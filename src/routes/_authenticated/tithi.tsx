import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { findHinduBirthday } from "@/lib/birthday.functions";
import { Gift, Sparkles } from "lucide-react";

const profileQO = queryOptions({
  queryKey: ["tithi-profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("profiles")
      .select("name, birth_date, birth_time")
      .eq("user_id", u.user!.id)
      .maybeSingle();
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/tithi")({
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQO),
  component: TithiBirthday,
});

function TithiBirthday() {
  const { data: profile } = useSuspenseQuery(profileQO);
  const find = useServerFn(findHinduBirthday);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof findHinduBirthday>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!profile?.birth_date) {
      setError("Add your birth date in your profile first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const iso = `${profile.birth_date}T${profile.birth_time ?? "06:00:00"}Z`;
      const r = await find({ data: { birthIso: iso, year } });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compute");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Janma Tithi</p>
        <h1 className="font-display text-3xl text-gradient-gold">Hindu Birthday</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Find the Gregorian date when your birth tithi & lunar month return.
        </p>
      </header>

      <section className="glass rounded-2xl p-5">
        <label className="text-[10px] uppercase tracking-widest text-primary">Target Year</label>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            min={1900}
            max={2100}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 font-serif text-base text-primary"
          />
          <button
            onClick={search}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "..." : "Find"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </section>

      {result && (
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-widest">Birth Tithi</p>
          </div>
          <p className="mt-1 font-serif text-base">{result.birthTithi}</p>
          <p className="text-xs text-muted-foreground">
            Moon in {result.birthNakshatra} · Rasi {result.birthRasi}
          </p>
        </section>
      )}

      {result && (
        <section className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-primary">
            Matches in {year} ({result.matches.length})
          </p>
          {result.matches.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No exact tithi match found in this year. Try the year before or after.
            </p>
          )}
          {result.matches.map((m) => {
            const d = new Date(m.date);
            const pretty = d.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            return (
              <div key={m.date} className="glass flex items-center gap-3 rounded-2xl p-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Gift className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-serif text-base text-foreground">{pretty}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.tithi} · {m.nakshatra}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
