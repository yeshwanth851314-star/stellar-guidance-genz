import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Snapshot = {
  vibe_theme?: string;
  vibe_description?: string;
  vibe_icon?: string;
  vibe_color?: string;
  mantra?: string;
  deity?: string;
  cosmic_energy?: number;
  lucky_color?: string;
  lucky_number?: number;
} | null;

type SavedRow = {
  id: string;
  date: string;
  created_at: string;
  snapshot: Snapshot;
};

const savedListQO = queryOptions({
  queryKey: ["saved-readings", "list"],
  queryFn: async (): Promise<SavedRow[]> => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    const { data, error } = await supabase
      .from("saved_readings")
      .select("id, date, created_at, snapshot")
      .eq("user_id", u.user.id)
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SavedRow[];
  },
  staleTime: 1000 * 60,
});

export const Route = createFileRoute("/_authenticated/saved")({
  loader: ({ context }) => context.queryClient.ensureQueryData(savedListQO),
  component: SavedPage,
  head: () => ({
    meta: [
      { title: "Saved readings" },
      { name: "description", content: "Your saved daily astrological readings." },
    ],
  }),
});

function SavedPage() {
  const { data: rows } = useSuspenseQuery(savedListQO);
  const qc = useQueryClient();

  const remove = async (id: string) => {
    const { error } = await supabase.from("saved_readings").delete().eq("id", id);
    if (error) {
      toast.error("Could not remove");
      return;
    }
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["saved-readings"] });
    qc.invalidateQueries({ queryKey: ["saved-today"] });
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link
          to="/home"
          className="glass glass-edge grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-primary"
          aria-label="Back to home"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Archive</p>
          <h1 className="font-display text-2xl text-gradient-gold">Saved readings</h1>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {rows.length} {rows.length === 1 ? "reading" : "readings"} kept
          </p>
        </div>
      </motion.header>

      {rows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="glass-strong glass-edge relative overflow-hidden rounded-3xl p-10 text-center"
        >
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="pointer-events-none absolute -right-6 -top-8 select-none font-display text-[7rem] leading-none text-gradient-gold"
            style={{ filter: "drop-shadow(0 0 24px var(--gold-soft))" }}
          >
            ॐ
          </motion.div>
          <div className="glass-edge mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <Heart size={22} />
          </div>
          <p className="mt-4 font-display text-xl text-gradient-gold">No saved readings yet</p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            Tap the heart on any daily reading to keep it here.
            <br />
            Your archive grows with each cosmic day.
          </p>
          <Link
            to="/home"
            className="glass glass-edge mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-widest text-primary"
          >
            <Sparkles size={12} />
            Today's reading
          </Link>
        </motion.div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r, i) => {
            const dateLabel = new Date(r.date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const s = r.snapshot;
            const bg = s?.vibe_color
              ? `linear-gradient(135deg, ${s.vibe_color}22, oklch(0.18 0.06 275 / 0.55))`
              : undefined;
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-strong glass-edge overflow-hidden rounded-2xl p-4"
                style={bg ? { background: bg } : undefined}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {s?.vibe_icon && <span className="text-lg">{s.vibe_icon}</span>}
                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
                      {dateLabel}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(r.id)}
                    className="text-muted-foreground transition hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {s?.vibe_theme && (
                  <p className="font-display text-lg text-gradient-gold">{s.vibe_theme}</p>
                )}
                {s?.vibe_description && (
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {s.vibe_description}
                  </p>
                )}
                {s?.mantra && (
                  <p className="mt-3 border-t border-white/10 pt-3 font-serif text-[13px] italic text-primary">
                    "{s.mantra}"
                  </p>
                )}
                {(s?.deity || typeof s?.lucky_number === "number") && (
                  <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s?.deity && (
                      <span>
                        Deity · <span className="text-primary">{s.deity}</span>
                      </span>
                    )}
                    {typeof s?.lucky_number === "number" && (
                      <span>
                        Lucky · <span className="text-primary">{s.lucky_number}</span>
                      </span>
                    )}
                  </div>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
