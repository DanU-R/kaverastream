import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PPW_API = "https://api.ppv.st/api";

interface PpvSource { type: string; data: string }
interface PpvStreamResponse {
  success: boolean;
  data?: { name?: string; sources?: PpvSource[] };
}

// Cache embed URL lookups
const embedCache = new Map<string, string>();

/**
 * GET /api/segment?id=<streamId>&seg=<encoded-segment-url>
 *
 * Fetches a .ts segment or key file via Playwright.
 * Loads the embed page, intercepts the segment response via
 * page.on('response'), and returns the content.
 *
 * For .ts segments, we use page.goto() since segments don't have
 * CORS restrictions (they're binary files served with CORS: *).
 * For m3u8 sub-playlists, we use the response interceptor.
 */
export async function GET(req: NextRequest) {
  const segUrl = req.nextUrl.searchParams.get("seg");
  const streamId = req.nextUrl.searchParams.get("id");

  if (!segUrl) return NextResponse.json({ error: "Missing seg param" }, { status: 400 });

  // .ts segments and keys are served with CORS: * and can be fetched directly
  // We just need the right Referer header
  const referer = "https://taifood-blog.asia/";

  try {
    // Try direct fetch first (segments usually have CORS: *)
    const resp = await fetch(segUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Referer": referer,
        "Origin": referer,
        "Accept": "*/*",
      },
      cache: "no-store",
    });

    if (resp.ok) {
      const buf = await resp.arrayBuffer();
      const contentType = resp.headers.get("content-type") || "";
      // Check both content-type AND body content for m3u8 detection
      const text = new TextDecoder().decode(buf);
      const isM3u8 = contentType.includes("mpegurl") || contentType.includes("m3u8") || text.trimStart().startsWith("#EXTM3U");
      const ct = isM3u8 ? "application/vnd.apple.mpegurl" : contentType.includes("mp2t") ? "video/mp2t" : "application/octet-stream";

      // If m3u8, rewrite segment URLs
      if (isM3u8) {
        const lines = text.split("\n");
        const rewritten = lines.map((line: string) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            if (trimmed.startsWith("#") && trimmed.includes("URI=\"")) {
              return line.replace(/URI="([^"]+)"/g, (_m: string, uri: string) => {
                const abs = new URL(uri, segUrl).href;
                return `URI="/api/segment?id=${streamId}&seg=${encodeURIComponent(abs)}"`;
              });
            }
            return line;
          }
          try {
            const abs = new URL(trimmed, segUrl).href;
            return `/api/segment?id=${streamId}&seg=${encodeURIComponent(abs)}`;
          } catch {
            return line;
          }
        });
        return new NextResponse(rewritten.join("\n"), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": ct,
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // If direct fetch fails (403), try via Playwright
    console.log("[segment] Direct fetch failed:", resp.status, "- trying Playwright");
    const content = await fetchViaPlaywright(segUrl, streamId || "");

    if (!content) {
      return NextResponse.json({ error: `Segment fetch failed` }, { status: 502 });
    }

    return content;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Segment proxy failed: ${message}` }, { status: 502 });
  }
}

/**
 * Fallback: Use Playwright to intercept the segment response.
 * Loads the embed page (to establish session), then navigates to the
 * segment URL and intercepts the response.
 */
async function fetchViaPlaywright(segUrl: string, streamId: string): Promise<NextResponse | null> {
  if (!process.env.DISPLAY) process.env.DISPLAY = ":99";

  let chromium: any;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch {
    return null;
  }

  // Get embed URL for this stream
  let embedUrl = embedCache.get(streamId);
  if (!embedUrl) {
    try {
      const ppvRes = await fetch(`${PPW_API}/streams/${streamId}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (ppvRes.ok) {
        const ppvData = (await ppvRes.json()) as PpvStreamResponse;
        const sources = ppvData?.data?.sources;
        if (Array.isArray(sources)) {
          const iframeSource = sources.find((s) => s.type === "iframe" && s.data);
          if (iframeSource) {
            embedUrl = iframeSource.data;
            embedCache.set(streamId, embedUrl);
          }
        }
      }
    } catch {}
  }

  if (!embedUrl) return null;

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-blink-features=AutomationControlled"],
    env: { ...process.env, DISPLAY: ":99" },
  });

  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
      extraHTTPHeaders: { "Referer": "https://taifood-blog.asia/" },
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    const page = await context.newPage();

    // Navigate to embed page first to establish session
    await page.goto(embedUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Wait a bit for session to establish
    await page.waitForTimeout(3000);

    // Now intercept the segment response by navigating to it
    let segmentBody: ArrayBuffer | null = null;
    let segmentContentType = "video/mp2t";

    page.on("response", async (resp: any) => {
      if (resp.url() === segUrl || resp.url().includes(segUrl.split("/").pop() || "")) {
        try {
          if (resp.ok()) {
            segmentBody = await resp.arrayBuffer();
            segmentContentType = resp.headers()["content-type"] || "video/mp2t";
          }
        } catch {}
      }
    });

    // Try navigating to the segment URL
    try {
      const resp = await page.goto(segUrl, { waitUntil: "commit", timeout: 10000 });
      if (resp && resp.ok()) {
        const buf = await resp.body();
        const ct = resp.headers()["content-type"] || "video/mp2t";
        await page.close();
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type": ct.includes("mpegurl") ? "application/vnd.apple.mpegurl" : ct,
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch {}

    // Check if we got it via response interceptor
    if (segmentBody) {
      await page.close();
      return new NextResponse(segmentBody, {
        status: 200,
        headers: {
          "Content-Type": segmentContentType,
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    await page.close();
    return null;
  } catch {
    return null;
  } finally {
    await browser.close();
  }
}
