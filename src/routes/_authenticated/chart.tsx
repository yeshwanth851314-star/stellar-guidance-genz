import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPanchanga } from "@/lib/panchanga.functions";

const chartQO = queryOptions({
  queryKey: ["chart"],
  queryFn: async () => {
    const [{ data: u }, p] = await Promise.all([
      supabase.auth.getUser(),
      getPanchanga({ data: {} }),
    ]);
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", u.user!.id)
      .maybeSingle();
    const { data: rasis } = await supabase.from("rasi_library").select("*").order("idx");
    return { profile, panchanga: p, rasis: rasis ?? [] };
  },
});

export const Route = createFileRoute("/_authenticated/chart")({
  loader: ({ context }) => context.queryClient.ensureQueryData(chartQO),
  component: Chart,
});

const SYMBOLS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
const PLANET_GLYPHS: Record<string, string> = {
  Su: "☉", Mo: "☾", Ma: "♂", Me: "☿", Ju: "♃", Ve: "♀", Sa: "♄", Ra: "☊", Ke: "☋", La: "Lg",
};

// Navamsa (D9) house from a rasi index + degree (0..30).
// Each rasi splits into 9 navamsa amshas of 3°20'. Starting amsha depends on element.
function navamsaRasi(rasi: number, degInRasi: number): number {
  const amsha = Math.floor(degInRasi / (30 / 9)); // 0..8
  // Movable (Aries, Cancer, Libra, Capricorn): start from same sign
  // Fixed (Taurus, Leo, Scorpio, Aquarius): start from 9th
  // Dual (Gemini, Virgo, Sagittarius, Pisces): start from 5th
  const mod = rasi % 3; // 0 movable, 1 fixed, 2 dual
  const start = mod === 0 ? rasi : mod === 1 ? (rasi + 8) % 12 : (rasi + 4) % 12;
  return (start + amsha) % 12;
}

type Planet = { code: string; name: string; rasi: number; deg: number };

function Chart() {
  const { data } = useSuspenseQuery(chartQO);
  const [vargha, setVargha] = useState<"D1" | "D9">("D1");

  const moonLong = Number(data.profile?.moon_longitude ?? data.panchanga.moonLongitude);
  const sunLong = Number(data.profile?.sun_longitude ?? data.panchanga.sunLongitude);
  const moonRasi = data.profile?.rasi ?? data.panchanga.rasi;
  const lagna = data.profile?.lagna ?? 0;

  // Build planet positions. We have actual longitudes for Sun & Moon.
  // For others, derive seeded but stable demo placements relative to user lagna.
  const planets: Planet[] = [
    { code: "La", name: "Lagna", rasi: lagna, deg: 0 },
    { code: "Su", name: "Sun", rasi: Math.floor(sunLong / 30), deg: sunLong % 30 },
    { code: "Mo", name: "Moon", rasi: moonRasi, deg: moonLong % 30 },
    { code: "Ma", name: "Mars", rasi: (lagna + 2) % 12, deg: 12 },
    { code: "Me", name: "Mercury", rasi: Math.floor(sunLong / 30), deg: ((sunLong + 18) % 30) },
    { code: "Ju", name: "Jupiter", rasi: (lagna + 4) % 12, deg: 7 },
    { code: "Ve", name: "Venus", rasi: (Math.floor(sunLong / 30) + 11) % 12, deg: 22 },
    { code: "Sa", name: "Saturn", rasi: (lagna + 9) % 12, deg: 18 },
    { code: "Ra", name: "Rahu", rasi: (lagna + 7) % 12, deg: 5 },
    { code: "Ke", name: "Ketu", rasi: (lagna + 1) % 12, deg: 5 },
  ];

  // For navamsa, recompute each planet's rasi using D9 mapping, lagna becomes D9 lagna.
  const planetsD9: Planet[] = planets.map((p) => ({
    ...p,
    rasi: navamsaRasi(p.rasi, p.deg),
  }));

  const active = vargha === "D1" ? planets : planetsD9;
  const chartLagna = active.find((p) => p.code === "La")!.rasi;

  // House -> rasi for the chosen chart (counted from chart's lagna)
  const houseToRasi = (houseN: number) => (chartLagna + houseN - 1) % 12;
  const planetsInHouse = (houseN: number) =>
    active.filter((p) => p.code !== "La" && p.rasi === houseToRasi(houseN));

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Birth Chart</p>
        <h1 className="font-display text-3xl text-gradient-gold">
          {vargha === "D1" ? "D1 · Rasi Chakra" : "D9 · Navamsa"}
        </h1>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {vargha === "D1"
            ? "Your foundational birth chart — Lagna, planets, and twelve houses."
            : "The marriage & soul chart — strength of planets in deeper division."}
        </p>
      </motion.header>

      <div className="glass inline-flex w-fit rounded-full p-1 text-[10px] uppercase tracking-widest">
        {(["D1", "D9"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVargha(v)}
            className={`rounded-full px-4 py-1.5 transition ${
              vargha === v ? "bg-primary/20 text-primary" : "text-muted-foreground"
            }`}
          >
            {v === "D1" ? "Rasi" : "Navamsa"}
          </button>
        ))}
      </div>

      <motion.div
        key={vargha}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-5"
      >
        <svg viewBox="0 0 300 300" className="w-full">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="oklch(0.82 0.16 85 / 0.4)" />
              <stop offset="1" stopColor="oklch(0.32 0.12 295 / 0.2)" />
            </linearGradient>
          </defs>
          <rect x="20" y="20" width="260" height="260" fill="url(#g1)" stroke="oklch(0.82 0.16 85 / 0.5)" strokeWidth="1" />
          <line x1="20" y1="20" x2="280" y2="280" stroke="oklch(0.82 0.16 85 / 0.5)" />
          <line x1="280" y1="20" x2="20" y2="280" stroke="oklch(0.82 0.16 85 / 0.5)" />
          <polygon points="150,20 280,150 150,280 20,150" fill="none" stroke="oklch(0.82 0.16 85 / 0.7)" strokeWidth="1.2" />
          {[
            { n: 1, x: 150, y: 80 },
            { n: 2, x: 80, y: 50 },
            { n: 3, x: 50, y: 80 },
            { n: 4, x: 80, y: 150 },
            { n: 5, x: 50, y: 220 },
            { n: 6, x: 80, y: 250 },
            { n: 7, x: 150, y: 220 },
            { n: 8, x: 220, y: 250 },
            { n: 9, x: 250, y: 220 },
            { n: 10, x: 220, y: 150 },
            { n: 11, x: 250, y: 80 },
            { n: 12, x: 220, y: 50 },
          ].map((h) => {
            const rasiIdx = houseToRasi(h.n);
            const here = planetsInHouse(h.n);
            return (
              <g key={h.n}>
                <text x={h.x} y={h.y} textAnchor="middle" fontSize="13" fill="oklch(0.82 0.16 85)" fontFamily="Cinzel, serif">
                  {SYMBOLS[rasiIdx]}
                </text>
                {h.n === 1 && (
                  <text x={h.x} y={h.y - 10} textAnchor="middle" fontSize="8" fill="oklch(0.78 0.12 350)">
                    Lg
                  </text>
                )}
                {here.map((pl, i) => (
                  <text
                    key={pl.code}
                    x={h.x + ((i % 3) - 1) * 12}
                    y={h.y + 14 + Math.floor(i / 3) * 10}
                    textAnchor="middle"
                    fontSize="9"
                    fill="oklch(0.85 0.12 70)"
                  >
                    {PLANET_GLYPHS[pl.code] ?? pl.code}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
        <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Lagna · <span className="text-primary">{data.rasis[chartLagna]?.name_english ?? "—"}</span></span>
          <span>Moon · <span className="text-primary">{data.rasis[active.find((p) => p.code === "Mo")!.rasi]?.name_english ?? "—"}</span></span>
        </div>
      </motion.div>

      {/* Planet list */}
      <section className="glass rounded-2xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-primary">Planetary positions</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          {active
            .filter((p) => p.code !== "La")
            .map((p) => (
              <div key={p.code} className="flex justify-between border-b border-white/5 py-1">
                <span className="text-muted-foreground">
                  <span className="mr-1 text-primary">{PLANET_GLYPHS[p.code]}</span>
                  {p.name}
                </span>
                <span className="text-primary">{data.rasis[p.rasi]?.name_english ?? "—"}</span>
              </div>
            ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {(() => {
          const r = data.rasis[moonRasi];
          if (!r) return null;
          return (
            <div className="glass col-span-2 rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Your Moon Sign</p>
              <p className="mt-1 font-display text-xl text-gradient-gold">{r.symbol} {r.name_english}</p>
              <p className="font-telugu text-xs text-muted-foreground">{r.name_telugu}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <div><p>Element</p><p className="mt-0.5 text-primary">{r.element}</p></div>
                <div><p>Lord</p><p className="mt-0.5 text-primary">{r.lord}</p></div>
                <div><p>Quality</p><p className="mt-0.5 text-primary">{r.quality}</p></div>
              </div>
              {r.trait_keywords && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.trait_keywords.map((t: string) => (
                    <span key={t} className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
