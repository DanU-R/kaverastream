import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REFERER = "https://www.rctiplus.com/";

// Static DASH manifest URLs (stable, no auth_key needed)
const DASH_URLS: Record<string, string> = {
  "trans-tv": "https://d2xz2v5wuvgur6.cloudfront.net/out/v1/7a69cfc9e135493f87ac4efd63000429/index.mpd",
  "trans-7": "https://d2tjypxxy769fn.cloudfront.net/out/v1/0fd7b7d368bc44bc9b4dece20acc3e33/index.mpd",
  "metro-tv": "https://d2tjypxxy769fn.cloudfront.net/out/v1/fd4360b1c12c4375848c8f085fd51d41/index.mpd",
};

/**
 * GET /api/proxy-dash/[channel]
 *
 * Proxies DASH .mpd manifests and segment requests with a Referer header
 * (required for CloudFront DASH streams from rctiplus.com).
 *
 * For .mpd: rewrites relative URLs to go through this proxy.
 * For segments/init: passes through with Referer header.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;
  const ch = channel?.toLowerCase();

  if (!ch || !DASH_URLS[ch]) {
    return NextResponse.json(
      { error: "Invalid channel. Use: trans-tv, trans-7, metro-tv" },
      { status: 400 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const seg = searchParams.get("seg"); // if provided, proxy this specific segment URL

  // If seg param is provided, proxy the segment/init fragment
  if (seg) {
    return proxyUrl(seg, REFERER);
  }

  // Otherwise, fetch the .mpd manifest and rewrite relative URLs
  const mpdUrl = DASH_URLS[ch];
  return proxyMpd(mpdUrl, ch, REFERER);
}

async function proxyMpd(mpdUrl: string, channel: string, referer: string) {
  try {
    const res = await fetch(mpdUrl, {
      headers: {
        Referer: referer,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch MPD: ${res.status}` },
        { status: 502 }
      );
    }

    const mpdText = await res.text();
    const baseUrl = mpdUrl.substring(0, mpdUrl.lastIndexOf("/") + 1);

    // Rewrite relative URLs in the MPD to go through our proxy
    // DASH MPDs have URLs in BaseURL elements and SegmentTemplate media/init attributes
    const rewritten = mpdText
      // Rewrite <BaseURL>relative/</BaseURL>
      .replace(/<BaseURL>([^<]+)<\/BaseURL>/g, (_match, url) => {
        const abs = resolveUrl(url, mpdUrl);
        return `<BaseURL>/api/proxy-dash/${channel}?seg=${encodeURIComponent(abs)}</BaseURL>`;
      })
      // Rewrite SegmentTemplate media/init attributes with relative paths
      .replace(/(media|initialization)="([^"]+)"/g, (_match, attr, url) => {
        if (url.startsWith("http")) return `${attr}="${url}"`;
        const abs = resolveUrl(url, mpdUrl);
        return `${attr}="/api/proxy-dash/${channel}?seg=${encodeURIComponent(abs)}"`;
      })
      // Rewrite any remaining relative URLs in BaseURL context
      .replace(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/[^"<>]+)/gi, (match) => {
        const abs = resolveUrl(match, mpdUrl);
        return `/api/proxy-dash/${channel}?seg=${encodeURIComponent(abs)}`;
      });

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/dash+xml",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to proxy DASH manifest" },
      { status: 502 }
    );
  }
}

async function proxyUrl(targetUrl: string, referer: string) {
  try {
    const res = await fetch(targetUrl, {
      headers: {
        Referer: referer,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

function resolveUrl(relative: string, base: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}
