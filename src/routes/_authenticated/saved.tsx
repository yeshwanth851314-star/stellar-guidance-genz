import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";

type SavedRow = {
  id: string;
  date: string;
  created_at: string;
  snapshot: {
    summary?: string;
    vibe?: string;
    affirmation?: string;
  } | null;
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
    <main className="mx-auto min-h-screen w-full max-w-[440px] px-5 pb-28 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          to="/home"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-muted-foreground hover:text-foreground"
          aria-label="Back to home"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-serif text-2xl">Saved readings</h1>
          <p className="text-xs text-muted-foreground">{rows.length} saved</p>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <Heart className="mx-auto mb-3 text-muted-foreground" size={28} />
          <p className="font-serif text-base text-foreground">No saved readings yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap the heart on a daily reading to keep it here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const dateLabel = new Date(r.date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {dateLabel}
                  </p>
                  <button
                    onClick={() => remove(r.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {r.snapshot?.vibe && (
                  <p className="mb-2 font-serif text-base text-foreground">
                    {r.snapshot.vibe}
                  </p>
                )}
                {r.snapshot?.summary && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {r.snapshot.summary}
                  </p>
                )}
                {r.snapshot?.affirmation && (
                  <p className="mt-3 border-t border-white/10 pt-3 font-serif text-sm italic text-primary">
                    "{r.snapshot.affirmation}"
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <BottomNav />
    </main>
  );
}
