import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cache m3u8 URLs for 90 minutes (auth_key valid ~2h)
const urlCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 90 * 60 * 1000;

const CHANNEL_MAP: Record<string, string> = {
  rcti: "rcti",
  mnctv: "mnctv",
  gtv: "gtv",
  inews: "inews",
};

/**
 * GET /api/tv/[channel]
 *
 * Uses Playwright to navigate to rctiplus.com/tv/{channel},
 * waits for JWPlayer to init, intercepts the m3u8 response,
 * and returns { url, type: 'hls' }.
 *
 * Cached for 90 minutes (auth_key expires in ~2h).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;
  const ch = channel?.toLowerCase();

  if (!ch || !CHANNEL_MAP[ch]) {
    return NextResponse.json({ error: "Invalid channel. Use: rcti, mnctv, gtv, inews" }, { status: 400 });
  }

  // Check cache
  const cached = urlCache.get(ch);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ url: cached.url, type: "hls" as const });
  }

  try {
    const m3u8Url = await extractM3u8FromRcti(ch);

    if (!m3u8Url) {
      return NextResponse.json({ url: null, error: "extraction failed" }, { status: 502 });
    }

    urlCache.set(ch, { url: m3u8Url, ts: Date.now() });

    return NextResponse.json({ url: m3u8Url, type: "hls" as const });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ url: null, error: `extraction failed: ${message}` }, { status: 502 });
  }
}

async function extractM3u8FromRcti(channel: string): Promise<string | null> {
  if (!process.env.DISPLAY) process.env.DISPLAY = ":99";

  let chromium: any;
  try {
    // Use eval to prevent bundler from trying to resolve playwright
    const pw = await (0, eval)('import("playwright")');
    chromium = pw.chromium;
  } catch {
    return null; // Playwright not available
  }

  const targetUrl = `https://www.rctiplus.com/tv/${channel}`;

  try {
    const browser = await chromium.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--autoplay-policy=no-user-gesture-required",
      ],
      env: { ...process.env, DISPLAY: ":99" },
    });

    try {
      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 720 },
      });

      await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      });

      const page = await context.newPage();

      let m3u8Url: string | null = null;

      // Intercept network responses to find the m3u8 URL
      page.on("response", async (resp: any) => {
        const url = resp.url();
        if (url.includes(".m3u8") && !m3u8Url) {
          m3u8Url = url;
        }
      });

      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

      // Wait for JWPlayer to init and start streaming
      // Try to extract via jwplayer API first, then rely on response interception
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        if (m3u8Url) break;

        // Try extracting via jwplayer() API
        try {
          const file = await page.evaluate(() => {
            // @ts-expect-error - jwplayer is injected by the page
            const player = typeof jwplayer !== "undefined" ? jwplayer() : null;
            if (player && typeof player.getPlaylistItem === "function") {
              const item = player.getPlaylistItem();
              if (item && item.file) return item.file;
            }
            return null;
          });
          if (file && file.includes(".m3u8")) {
            m3u8Url = file;
            break;
          }
        } catch {}

        await page.waitForTimeout(800);
      }

      await page.close();
      return m3u8Url;
    } finally {
      await browser.close();
    }
  } catch {
    return null;
  }
}
