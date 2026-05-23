import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPanchanga } from "@/lib/panchanga.functions";

const panchangaQO = queryOptions({
  queryKey: ["panchanga", new Date().toISOString().slice(0, 10)],
  queryFn: () => getPanchanga({ data: {} }),
  staleTime: 1000 * 60 * 30,
});

const profileQO = queryOptions({
  queryKey: ["profile-me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
    return data;
  },
});

const nakLibQO = queryOptions({
  queryKey: ["nakshatra-library"],
  queryFn: async () => {
    const { data } = await supabase.from("nakshatra_library").select("*").order("idx");
    return data ?? [];
  },
  staleTime: Infinity,
});

export const Route = createFileRoute("/_authenticated/ar")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(panchangaQO),
      context.queryClient.ensureQueryData(profileQO),
      context.queryClient.ensureQueryData(nakLibQO),
    ]);
  },
  component: ARView,
});

function ARView() {
  const { data: p } = useSuspenseQuery(panchangaQO);
  const { data: profile } = useSuspenseQuery(profileQO);
  const { data: library } = useSuspenseQuery(nakLibQO);

  // Use the user's birth Nakshatra if present, else today's transit
  const activeIdx = (profile?.nakshatra ?? p.nakshatra) as number;
  const activePada = (profile?.pada ?? p.pada) as number;
  const nak = library.find((n) => n.idx === activeIdx) ?? library[0];

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    if (!motionEnabled) return;
    const handler = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0; // -180..180 front/back
      const gamma = e.gamma ?? 0; // -90..90 left/right
      setTilt({ x: Math.max(-30, Math.min(30, gamma)) / 30, y: Math.max(-30, Math.min(30, beta - 45)) / 30 });
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [motionEnabled]);

  const enableMotion = async () => {
    const D = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } })
      .DeviceOrientationEvent;
    if (D?.requestPermission) {
      try {
        const res = await D.requestPermission();
        if (res === "granted") setMotionEnabled(true);
      } catch {
        setMotionEnabled(true);
      }
    } else {
      setMotionEnabled(true);
    }
  };

  const stars = (nak?.constellation_stars as Array<{ x: number; y: number }> | null) ?? [
    { x: 0.3, y: 0.4 },
    { x: 0.5, y: 0.35 },
    { x: 0.7, y: 0.45 },
  ];

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <header className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">AR Star Field</p>
        <h1 className="font-display text-2xl text-gradient-gold">Your Nakshatra</h1>
      </header>

      {/* Constellation viewport */}
      <motion.div
        className="glass relative aspect-square w-full overflow-hidden rounded-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.25 0.08 280 / 0.6), oklch(0.08 0.03 270 / 0.9))",
        }}
      >
        {/* Background stars */}
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 60 }).map((_, i) => {
            const x = (i * 37) % 100;
            const y = (i * 53) % 100;
            const s = (i % 3) + 1;
            return (
              <span
                key={i}
                className="absolute rounded-full bg-white/40"
                style={{ left: `${x}%`, top: `${y}%`, width: s, height: s }}
              />
            );
          })}
        </div>

        {/* Constellation */}
        <motion.svg
          viewBox="0 0 1 1"
          className="absolute inset-0 h-full w-full"
          animate={{ x: tilt.x * 24, y: tilt.y * 24 }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
          {stars.map((s, i) =>
            i < stars.length - 1 ? (
              <line
                key={`l${i}`}
                x1={s.x}
                y1={s.y}
                x2={stars[i + 1].x}
                y2={stars[i + 1].y}
                stroke="oklch(0.85 0.16 85 / 0.6)"
                strokeWidth={0.003}
              />
            ) : null,
          )}
          {stars.map((s, i) => (
            <g key={`s${i}`}>
              <circle cx={s.x} cy={s.y} r={0.018} fill="oklch(0.95 0.05 85)" />
              <circle cx={s.x} cy={s.y} r={0.035} fill="oklch(0.85 0.16 85 / 0.3)" />
            </g>
          ))}
        </motion.svg>

        {/* Pada indicator overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-primary">
          <span>{nak?.symbol ?? "—"}</span>
          <span>Pada {activePada}</span>
        </div>
      </motion.div>

      {/* Motion toggle */}
      {!motionEnabled && (
        <button
          onClick={enableMotion}
          className="glass rounded-full px-4 py-2 text-[11px] uppercase tracking-widest text-primary"
        >
          Tilt phone to explore · enable motion
        </button>
      )}

      {/* Nakshatra info */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-5"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Moon Nakshatra</p>
        <h2 className="mt-1 font-display text-3xl text-gradient-gold">{nak?.name_english}</h2>
        <p className="font-serif text-sm text-primary">{nak?.name_sanskrit}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Cell label="Pada" value={`${activePada} / 4`} />
          <Cell label="Lord" value={nak?.lord ?? "—"} />
          <Cell label="Element" value={nak?.element ?? "—"} />
        </div>

        <div className="mt-4 rounded-2xl bg-background/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Ruling Deity</p>
          <p className="mt-1 font-display text-xl text-gradient-gold">{nak?.deity ?? "—"}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {nak?.trait ?? ""}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <Cell label="Gana" value={nak?.gana ?? "—"} />
          <Cell label="Quality" value={nak?.quality ?? "—"} />
        </div>
      </motion.section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/30 p-2">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-serif text-[12px] text-primary">{value}</p>
    </div>
  );
}
