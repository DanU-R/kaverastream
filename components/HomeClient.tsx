"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadFeed, liveMatches, scheduledMatches, footballMatches, bySport, channels247, sportLabel, type MatchRow } from "@/lib/home";
import { FeaturedHero, LiveCard } from "@/components/HomeCards";
import { FootballCard, ScheduleRow, ChannelCard } from "@/components/HomeCards2";

export default function HomeClient() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let live = true;
    loadFeed()
      .then((r) => live && setRows(r))
      .catch(() => live && setRows([]))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, []);

  const lives = useMemo(() => liveMatches(rows), [rows]);
  const upcoming = useMemo(() => scheduledMatches(rows), [rows]);
  const football = useMemo(() => footballMatches(rows), [rows]);
  const sports = useMemo(() => bySport(rows), [rows]);
  const tv = useMemo(() => channels247(rows), [rows]);

  const featured = lives[0] ?? football.find((r) => r.status === "scheduled") ?? upcoming[0] ?? null;

  const filteredFootball = useMemo(() => {
    if (!q.trim()) return football;
    const s = q.toLowerCase();
    return football.filter((r) => r.title.toLowerCase().includes(s) || r.league.toLowerCase().includes(s));
  }, [q, football]);

  return (
    <div className="space-y-10">
      {/* Mobile search */}
      <div className="flex items-center gap-2 lg:hidden">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search matches, leagues, teams..."
          className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-outline/70 focus:border-primary-container focus:outline-none"
        />
      </div>

      {/* Featured hero */}
      {featured ? <FeaturedHero m={featured} /> : loading ? (
        <div className="aspect-video animate-pulse rounded-2xl bg-surface-container-low" />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container-low">
          <p className="text-outline">No matches currently available.</p>
          <Link href="/esportex" className="mt-3 rounded-lg bg-primary-container px-4 py-2 text-sm font-bold text-on-primary-container hover:bg-tertiary">
            Browse Schedule →
          </Link>
        </div>
      )}

      {/* Live Now carousel */}
      {lives.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-2.5 rounded-full bg-primary-container"></div>
              <h2 className="text-lg font-bold text-on-surface">Live Now</h2>
              <span className="rounded-full border border-outline-variant/40 bg-surface-container-high px-2 py-0.5 text-[11px] font-bold text-primary-container">
                {lives.length} Active
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lives.slice(0, 4).map((m) => <LiveCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {/* Football grid */}
      {filteredFootball.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-2.5 rounded-full bg-primary-container"></div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">European Football Slate</h2>
                <p className="text-xs text-outline">Live scores &amp; upcoming fixtures</p>
              </div>
            </div>
            <button className="rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-1 text-[11px] font-semibold text-primary-container">
              All Leagues
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFootball.slice(0, 9).map((m) => <FootballCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {/* Other sports */}
      {sports
        .filter((s) => s.sport !== "football" && s.sport !== "american_football" && s.sport !== "entertainment")
        .map((s) => (
          <section key={s.sport} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-2.5 rounded-full bg-primary-container"></div>
              <h2 className="text-lg font-bold text-on-surface">{sportLabel(s.sport)}</h2>
              <span className="text-xs text-outline">{s.matches.length} matches</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {s.matches.slice(0, 4).map((m) => <LiveCard key={m.id} m={m} />)}
            </div>
          </section>
        ))}

      {/* Schedule list */}
      {upcoming.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-2.5 rounded-full bg-primary-container"></div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">Broadcast Schedule</h2>
                <p className="text-xs text-outline">Upcoming live transmissions across Kavera channels</p>
              </div>
            </div>
            <div className="flex items-center gap-1 self-start rounded-lg border border-outline-variant/40 bg-surface-container-low p-1 sm:self-auto">
              <button className="rounded-md bg-surface-container-highest px-3 py-1 text-[11px] font-bold text-primary-container">Today</button>
              <button className="rounded-md px-3 py-1 text-[11px] text-on-surface-variant hover:text-on-surface">Tomorrow</button>
              <button className="rounded-md px-3 py-1 text-[11px] text-on-surface-variant hover:text-on-surface">Weekend</button>
            </div>
          </div>
          <div className="divide-y divide-outline-variant/20 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low">
            {upcoming.slice(0, 8).map((m) => <ScheduleRow key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {/* 24/7 Channels */}
      {tv.length > 0 && (
        <section className="space-y-4 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-2.5 rounded-full bg-primary-container"></div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">24/7 Dedicated Channels</h2>
                <p className="text-xs text-outline">Linear live networks streaming around the clock</p>
              </div>
            </div>
            <Link href="/esportex" className="flex items-center gap-1 text-sm font-semibold text-primary-container hover:text-tertiary">
              <span>Explore All</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tv.slice(0, 4).map((m, i) => <ChannelCard key={m.id} m={m} idx={i} />)}
          </div>
        </section>
      )}

      {loading && <div className="h-40 animate-pulse rounded-xl bg-surface-container-low" />}
    </div>
  );
}
