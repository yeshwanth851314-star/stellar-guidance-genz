import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getPanchanga } from "@/lib/panchanga.functions";
import { getDailyContent } from "@/lib/daily-content.functions";

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

const dailyQO = queryOptions({
  queryKey: ["daily-content", new Date().toISOString().slice(0, 10)],
  queryFn: () => getDailyContent({ data: {} }),
  staleTime: 1000 * 60 * 60,
});

export const Route = createFileRoute("/_authenticated/home")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(panchangaQO),
      context.queryClient.ensureQueryData(profileQO),
      context.queryClient.ensureQueryData(dailyQO),
    ]);
  },
  component: Home,
});

function Home() {
  const { data: p } = useSuspenseQuery(panchangaQO);
  const { data: profile } = useSuspenseQuery(profileQO);
  const { data: daily } = useSuspenseQuery(dailyQO);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-baseline justify-between"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{today}</p>
          <h1 className="font-display text-2xl text-gradient-gold">
            Namaste, {profile?.name ?? "Seeker"}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Rasi</p>
          <p className="font-serif text-sm text-primary">{p.rasiName}</p>
        </div>
      </motion.header>

      {/* Panchanga strip */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass grid grid-cols-4 gap-2 rounded-2xl p-3 text-center"
      >
        {[
          { l: "Tithi", v: p.tithiName.split(" ")[1], s: p.tithiName.split(" ")[0] },
          { l: "Vara", v: p.varaName },
          { l: "Nakshatra", v: p.nakshatraName, s: `Pada ${p.pada}` },
          { l: "Yoga", v: p.yogaName },
        ].map((b) => (
          <div key={b.l} className="px-1">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{b.l}</p>
            <p className="mt-1 truncate font-serif text-[11px] text-primary">{b.v}</p>
            {b.s && <p className="text-[9px] text-muted-foreground">{b.s}</p>}
          </div>
        ))}
      </motion.section>

      {/* Daily Vibe */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass relative overflow-hidden rounded-3xl p-6"
        style={{
          background: `linear-gradient(135deg, ${daily.vibe_color}33, oklch(0.18 0.06 275 / 0.6))`,
        }}
      >
        <div
          className="absolute -right-6 -top-6 h-32 w-32 rounded-full blur-3xl"
          style={{ background: `${daily.vibe_color}33` }}
        />
        <div className="flex items-center gap-2">
          <span className="text-2xl">{daily.vibe_icon}</span>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Today's Vibe</p>
        </div>
        <h2 className="mt-2 font-display text-2xl text-gradient-gold">{daily.vibe_theme}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{daily.vibe_description}</p>
        <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider">
          <span className="rounded-full bg-primary/20 px-3 py-0.5 text-primary">{p.dosha}</span>
          <span className="text-muted-foreground">Energy {daily.cosmic_energy}%</span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-background/40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${daily.cosmic_energy}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${daily.vibe_color}, oklch(0.82 0.16 85))` }}
          />
        </div>
      </motion.section>

      {/* Mantra card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-5 text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Today's Mantra</p>
        <p className="mt-2 font-display text-lg text-gradient-gold">{daily.mantra}</p>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Deity · <span className="text-primary">{daily.deity}</span>
        </p>
      </motion.section>

      {/* Morning / Evening guidance */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌅</span>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Morning Guidance</p>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{daily.morning_guidance ?? ""}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌙</span>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Evening Guidance</p>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{daily.evening_guidance ?? ""}</p>
        </div>
      </motion.section>

      {/* Insight cards */}
      <div className="grid grid-cols-2 gap-3">
        <InsightCard label="Planetary" value={daily.planetary_insight ?? ""} />
        <InsightCard label="Spiritual" value={daily.spiritual_guidance ?? ""} />
        <InsightCard label="Practical" value={daily.practical_tip ?? ""} />
        <InsightCard label="Ayurvedic" value={daily.ayurvedic_tip ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Lucky Color</p>
          <div
            className="mx-auto mt-2 h-8 w-8 rounded-full"
            style={{ background: daily.lucky_color ?? "#fff", boxShadow: `0 0 20px ${daily.lucky_color ?? "#fff"}` }}
          />
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Lucky Number</p>
          <p className="mt-1 font-display text-3xl text-gradient-gold">{daily.lucky_number}</p>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[9px] uppercase tracking-widest text-primary">{label}</p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-5">{value}</p>
    </div>
  );
}
