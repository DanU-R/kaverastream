// Serverless HLS proxy — full-rewrite mode.
// Fetches the upstream manifest server-side, rewrites EVERY resource URI
// (master->child manifests and child->segments) back through this proxy, so the
// browser player's whole pipeline stays on this origin → no CORS, no client DNS.
// This lets Indonesian channels (non-CORS CDNs, geo/region quirks) play via
// <video>+hls.js even when the app runs in a Vercel region far from the CDN.

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Cache-Control": "public, max-age=10",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw || !/^https?:\/\//.test(raw)) {
    return new Response("bad url", { status: 400, headers: cors() });
  }
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("bad url", { status: 400, headers: cors() });
  }
  if (!["http:", "https:"].includes(target.protocol)) {
    return new Response("bad protocol", { status: 400, headers: cors() });
  }

  // upstream fetch, mirror auth-ish headers that CDNs like
  const upstream = await fetch(target.toString(), {
    headers: {
      "User-Agent": UA,
      Accept: "*/*",
      Referer: target.origin + "/",
      Origin: target.origin,
    },
    cache: "no-store",
  });
  if (!upstream.ok) {
    return new Response(`upstream ${upstream.status}`, {
      status: upstream.status,
      headers: cors(),
    });
  }

  const body = Buffer.from(await upstream.arrayBuffer());
  const ct = upstream.headers.get("content-type") ?? "";

  // If it's an m3u8 (master or segment), rewrite all resource URIs to proxy.
  if (ct.includes("mpegurl") || body.toString("latin1").includes("#EXTM3U")) {
    const dir = new URL(".", target.toString().split("?")[0]).toString();
    let text = body.toString("utf-8");
    const out = text
      .split("\n")
      .map((line) => {
        const t = line.trim();
        if (!t || t.startsWith("#")) return line;
        let abs = t;
        if (!/^https?:\/\//.test(abs)) abs = new URL(abs, dir).toString();
        return `/api/p/stream?url=${encodeURIComponent(abs)}`;
      })
      .join("\n");
    return new Response(out, {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/vnd.apple.mpegurl" },
    });
  }

  // non-manifest resource (TS/.ts segment, key, etc.) — pass through bytes
  return new Response(body, {
    status: 200,
    headers: { ...cors(), "Content-Type": ct || "application/octet-stream" },
  });
}
