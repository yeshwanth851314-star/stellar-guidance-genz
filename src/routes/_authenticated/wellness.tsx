import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getPanchanga } from "@/lib/panchanga.functions";

const wellnessQO = queryOptions({
  queryKey: ["wellness"],
  queryFn: async () => {
    const [{ data: u }, p] = await Promise.all([
      supabase.auth.getUser(),
      getPanchanga({ data: {} }),
    ]);
    const { data: profile } = await supabase
      .from("profiles")
      .select("dosha")
      .eq("user_id", u.user!.id)
      .maybeSingle();
    const dosha = profile?.dosha ?? p.dosha;
    const [{ data: poses }, { data: herbs }] = await Promise.all([
      supabase.from("yoga_poses").select("*").contains("dosha", [dosha]).limit(6),
      supabase.from("herbs").select("*").contains("dosha", [dosha]).limit(6),
    ]);
    return { dosha, poses: poses ?? [], herbs: herbs ?? [], panchanga: p };
  },
});

export const Route = createFileRoute("/_authenticated/wellness")({
  loader: ({ context }) => context.queryClient.ensureQueryData(wellnessQO),
  component: Wellness,
});

function Wellness() {
  const { data } = useSuspenseQuery(wellnessQO);
  const doshaCopy: Record<string, { title: string; sub: string; emoji: string }> = {
    Vata: { title: "Vata", sub: "Air · Ether — ground & warm", emoji: "🌬️" },
    Pitta: { title: "Pitta", sub: "Fire · Water — cool & soften", emoji: "🔥" },
    Kapha: { title: "Kapha", sub: "Earth · Water — energize & lighten", emoji: "🌿" },
  };
  const d = doshaCopy[data.dosha] ?? doshaCopy.Vata;

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Wellness</p>
        <h1 className="font-display text-3xl text-gradient-gold">{d.emoji} {d.title} day</h1>
        <p className="mt-1 text-xs text-muted-foreground">{d.sub}</p>
      </motion.header>

      <section>
        <h2 className="mb-2 text-[11px] uppercase tracking-widest text-primary">Yoga for today</h2>
        <div className="grid grid-cols-2 gap-3">
          {data.poses.map((y) => (
            <motion.div
              key={y.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4"
            >
              <div className="text-2xl">{y.emoji}</div>
              <p className="mt-2 font-serif text-sm text-primary">{y.name_english}</p>
              <p className="font-telugu text-[11px] text-muted-foreground">{y.name_telugu}</p>
              <p className="mt-2 text-[10px] text-muted-foreground line-clamp-2">{y.benefit}</p>
              <div className="mt-2 flex items-center justify-between text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>{y.duration_minutes}m</span>
                <span>{y.best_time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[11px] uppercase tracking-widest text-primary">Ayurvedic herbs</h2>
        <div className="space-y-2">
          {data.herbs.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass flex items-start gap-3 rounded-2xl p-3"
            >
              <div className="text-2xl">{h.emoji}</div>
              <div className="flex-1">
                <p className="font-serif text-sm text-primary">{h.name_english}</p>
                <p className="font-telugu text-[10px] text-muted-foreground">
                  {h.name_telugu} · {h.name_sanskrit}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{h.benefit}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
