import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

export const Route = createFileRoute("/_authenticated/home")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(panchangaQO),
      context.queryClient.ensureQueryData(profileQO),
    ]);
  },
  component: Home,
});

function Home() {
  const { data: p } = useSuspenseQuery(panchangaQO);
  const { data: profile } = useSuspenseQuery(profileQO);

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
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {today}
          </p>
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

      {/* Daily vibe card */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass relative overflow-hidden rounded-3xl p-6"
        style={{ background: "linear-gradient(135deg, oklch(0.32 0.12 295 / 0.4), oklch(0.18 0.06 275 / 0.6))" }}
      >
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Today's Vibe</p>
        <h2 className="mt-1 font-display text-2xl text-gradient-gold">
          {p.dosha === "vata" ? "Move with grace" : p.dosha === "pitta" ? "Channel your fire" : "Ground & nourish"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The Moon walks through <span className="text-primary">{p.nakshatraName}</span>, casting{" "}
          {p.dosha} energy. Honor it with mindful steps.
        </p>
        <div className="mt-4 flex items-center gap-4 text-[11px] uppercase tracking-wider">
          <span className="text-muted-foreground">Dosha</span>
          <span className="rounded-full bg-primary/20 px-3 py-0.5 text-primary">{p.dosha}</span>
        </div>
      </motion.section>

      {/* Insight cards */}
      <div className="grid grid-cols-2 gap-3">
        <InsightCard label="Sun" value={`${p.sunLongitude.toFixed(1)}°`} sub={p.rasiName} />
        <InsightCard label="Moon" value={`${p.moonLongitude.toFixed(1)}°`} sub={p.nakshatraName} />
        <InsightCard label="Karana" value={`#${p.karana}`} />
        <InsightCard label="Ayanamsha" value={`${p.ayanamsha.toFixed(2)}°`} sub="Lahiri" />
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => supabase.auth.signOut()}
        className="mx-auto mt-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary"
      >
        Sign out
      </motion.button>
    </div>
  );
}

function InsightCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-lg text-primary">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
