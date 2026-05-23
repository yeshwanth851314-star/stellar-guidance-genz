import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const profileQO = queryOptions({
  queryKey: ["profile-detail"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/profile")({
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQO),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: p } = useSuspenseQuery(profileQO);
  if (!p) return null;
  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-8">
      <h1 className="font-display text-3xl text-gradient-gold">{p.name ?? "Seeker"}</h1>
      <p className="text-xs text-muted-foreground">{p.email}</p>

      <div className="glass mt-2 space-y-3 rounded-2xl p-5">
        <Row label="Birth Date" value={p.birth_date ?? "—"} />
        <Row label="Birth Time" value={p.birth_time ?? "—"} />
        <Row label="Birth Place" value={p.birth_place ?? "—"} />
        <Row label="Rasi" value={String(p.rasi ?? "—")} />
        <Row label="Nakshatra" value={`${p.nakshatra ?? "—"} · Pada ${p.pada ?? "—"}`} />
        <Row label="Dosha" value={p.dosha ?? "—"} />
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-4 rounded-full border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-serif text-primary">{value}</span>
    </div>
  );
}
