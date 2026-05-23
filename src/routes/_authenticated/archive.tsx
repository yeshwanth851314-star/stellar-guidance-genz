import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const archiveQO = queryOptions({
  queryKey: ["archive"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("daily_content")
      .select("*")
      .eq("user_id", u.user!.id)
      .order("date", { ascending: false })
      .limit(30);
    return data ?? [];
  },
});

export const Route = createFileRoute("/_authenticated/archive")({
  loader: ({ context }) => context.queryClient.ensureQueryData(archiveQO),
  component: Archive,
});

function Archive() {
  const { data } = useSuspenseQuery(archiveQO);
  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Archive</p>
        <h1 className="font-display text-3xl text-gradient-gold">Past Cosmos</h1>
      </header>
      {data.length === 0 ? (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Your journey begins today. Tomorrow's wisdom will appear here.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-baseline justify-between">
                <p className="font-serif text-sm text-primary">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <span className="text-lg">{d.vibe_icon}</span>
              </div>
              <p className="mt-1 font-display text-base text-gradient-gold">{d.vibe_theme}</p>
              <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{d.vibe_description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
