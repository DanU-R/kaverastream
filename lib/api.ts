// Typed client for the rushboard data layer.
// Consumes the public endpoints of the stream API (CORS: *)

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.ppv.st/api";

export interface StreamSource {
  name: string;
  default: boolean;
  type: string; // 'iframe' | ...
  data: string;
}

export interface Stream {
  id: number;
  name: string;
  tag: string;
  source_tag: string;
  poster: string;
  blurhash?: string;
  colors?: string[];
  uri_name: string;
  starts_at: number;
  ends_at: number;
  always_live: number;
  locale: string;
  category_name: string;
  iframe?: string;
  viewers: number;
  substreams: any[];
}

export interface StreamDetail extends Stream {
  description?: string;
  m3u8?: string;
  source_type?: string;
  sources?: StreamSource[];
  start_timestamp?: number;
  end_timestamp?: number;
  category?: number;
  vip_stream?: boolean;
  auth?: boolean;
  server_id?: number;
  uri?: string;
  token?: string;
  viewers: number;
}

export interface CategoryGroup {
  id: number;
  category: string;
  always_live: boolean;
  streams: Stream[];
}

export interface StreamsResponse {
  success: boolean;
  timestamp?: number;
  streams: CategoryGroup[];
}

export interface Vod {
  id: number;
  name: string;
  tag: string;
  poster: string;
  uri_name: string;
  added: number;
  event_date: number;
  views: number;
}

export interface VodGroup {
  id: number;
  category: string;
  vods: Vod[];
}

export interface VodsResponse {
  success: boolean;
  timestamp?: number;
  vods: VodGroup[];
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status} ${path}`);
  return res.json();
}

export async function fetchStreams(): Promise<CategoryGroup[]> {
  const d = await get<StreamsResponse>("/streams");
  return d.streams ?? [];
}

export async function fetchStreamsByCategory(
  category: string
): Promise<CategoryGroup[]> {
  const d = await get<StreamsResponse>(
    `/streams?category=${encodeURIComponent(category)}`
  );
  return d.streams ?? [];
}

export async function fetchStreamDetail(id: number): Promise<StreamDetail> {
  const d = await get<{ success: boolean; data: StreamDetail }>(
    `/streams/${id}`
  );
  return d.data;
}

export async function fetchVods(): Promise<VodGroup[]> {
  const d = await get<VodsResponse>("/vods");
  return d.vods ?? [];
}

export interface VodDetail extends Vod {
  tag: string;
  description: string;
  source: { type: string; data: string };
  recommended_vods?: Vod[];
  event_date: number;
}

export async function fetchVodDetail(id: number): Promise<VodDetail> {
  const d = await get<{ success: boolean; data: VodDetail }>(`/vods/${id}`);
  return d.data;
}

// ---- helpers ----
export function isLive(s: Stream, now = Date.now() / 1000): boolean {
  if (s.always_live) return true;
  return s.starts_at <= now && now <= s.ends_at;
}

export function isUpcoming(s: Stream, now = Date.now() / 1000): boolean {
  return !s.always_live && s.starts_at > now;
}

export function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function firstIframe(s: StreamDetail | Stream): StreamSource | null {
  const d = s as StreamDetail;
  if (d.sources && d.sources.length) {
    return d.sources.find((x) => x.default) ?? d.sources[0];
  }
  if (s.iframe) return { name: "External Player", default: true, type: "iframe", data: s.iframe };
  return null;
}
