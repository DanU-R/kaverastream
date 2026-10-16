import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/proxy?url=<m3u8-or-ts-url>&referer=<referer>
 *
 * Reverse proxy for HLS m3u8 manifests and .ts segments.
 * Fetches the upstream URL with proper Referer header (bypassing
 * token protection), sets CORS headers, and rewrites m3u8 segment
 * URLs to route back through this proxy.
 *
 * This allows the client-side hls.js player to load the stream
 * without CORS issues.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const referer = req.nextUrl.searchParams.get("referer");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Validate URL
  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Derive referer from the target URL if not provided
  const refererUrl = referer || `${targetUrl.origin}/`;

  try {
    const upstream = await fetch(targetUrl.href, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Referer: refererUrl,
        Origin: refererUrl,
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "";
    const body = await upstream.text();

    // Check if this is an m3u8 manifest
    const isM3u8 =
      contentType.includes("mpegurl") ||
      contentType.includes("x-mpegurl") ||
      body.trimStart().startsWith("#EXTM3U");

    if (isM3u8) {
      // Rewrite URLs in the manifest to go through our proxy
      const proxyBase = new URL("/api/proxy", req.url).href;
      const lines = body.split("\n");
      const rewritten = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          // Rewrite URI= inside #EXT-X-KEY, #EXT-X-MAP, etc.
          if (trimmed.startsWith("#") && trimmed.includes("URI=\"")) {
            return rewriteUriInTag(trimmed, targetUrl, refererUrl, proxyBase);
          }
          return line;
        }
        // This is a segment/key URL — rewrite it
        return rewriteUrl(trimmed, targetUrl, refererUrl, proxyBase);
      });

      return new NextResponse(rewritten.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      });
    }

    // Not m3u8 — pass through (likely .ts segment or key)
    const passContentType = contentType.includes("mp2t")
      ? "video/mp2t"
      : contentType || "application/octet-stream";

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": passContentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Proxy failed: ${message}` },
      { status: 502 }
    );
  }
}

function rewriteUrl(
  url: string,
  baseUrl: URL,
  referer: string,
  proxyBase: string
): string {
  try {
    // Resolve relative URL against the manifest URL
    const absolute = new URL(url, baseUrl.href).href;
    return `${proxyBase}?url=${encodeURIComponent(absolute)}&referer=${encodeURIComponent(referer)}`;
  } catch {
    return url;
  }
}

function rewriteUriInTag(
  tag: string,
  baseUrl: URL,
  referer: string,
  proxyBase: string
): string {
  return tag.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
    const rewritten = rewriteUrl(uri, baseUrl, referer, proxyBase);
    return `URI="${rewritten}"`;
  });
}
