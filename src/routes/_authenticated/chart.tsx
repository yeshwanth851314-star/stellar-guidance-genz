import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

function Chart() {
  const { data } = useSuspenseQuery(chartQO);
  const moonRasi = data.profile?.rasi ?? data.panchanga.rasi;
  const lagna = data.profile?.lagna ?? 0;

  // North Indian style diamond chart: 12 houses arranged in 4x4
  // House 1 (Lagna) at top center diamond
  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Birth Chart</p>
        <h1 className="font-display text-3xl text-gradient-gold">D1 · Rasi Chakra</h1>
      </motion.header>

      <motion.div
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
          {/* diagonals */}
          <line x1="20" y1="20" x2="280" y2="280" stroke="oklch(0.82 0.16 85 / 0.5)" />
          <line x1="280" y1="20" x2="20" y2="280" stroke="oklch(0.82 0.16 85 / 0.5)" />
          {/* inner diamond */}
          <polygon points="150,20 280,150 150,280 20,150" fill="none" stroke="oklch(0.82 0.16 85 / 0.7)" strokeWidth="1.2" />
          {/* house numbers (North Indian) */}
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
            const rasiIdx = (lagna + h.n - 1) % 12;
            const isMoon = rasiIdx === moonRasi;
            return (
              <g key={h.n}>
                <text x={h.x} y={h.y} textAnchor="middle" fontSize="14" fill="oklch(0.82 0.16 85)" fontFamily="Cinzel, serif">
                  {SYMBOLS[rasiIdx]}
                </text>
                {isMoon && (
                  <text x={h.x} y={h.y + 14} textAnchor="middle" fontSize="10" fill="oklch(0.78 0.12 350)">
                    ☾
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Lagna · <span className="text-primary">{data.rasis[lagna]?.name_english ?? "—"}</span></span>
          <span>Moon · <span className="text-primary">{data.rasis[moonRasi]?.name_english ?? "—"}</span></span>
        </div>
      </motion.div>

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
