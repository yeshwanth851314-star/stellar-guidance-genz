import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

const profileQO = queryOptions({
  queryKey: ["settings-profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", u.user!.id)
      .maybeSingle();
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQO),
  component: Settings,
});

function Settings() {
  const { data: profile } = useSuspenseQuery(profileQO);
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const update = async (patch: Partial<typeof profile>) => {
    setSaving(true);
    await supabase.from("profiles").update(patch as never).eq("user_id", profile.user_id);
    await qc.invalidateQueries({ queryKey: ["settings-profile"] });
    setSaving(false);
  };

  const toggles: Array<{ k: keyof typeof profile; label: string; desc: string }> = [
    { k: "notif_planetary", label: "Planetary alerts", desc: "Transits and retrogrades" },
    { k: "notif_spiritual", label: "Spiritual guidance", desc: "Daily mantras and rituals" },
    { k: "notif_wellness", label: "Wellness reminders", desc: "Yoga and herb suggestions" },
    { k: "notif_lunar", label: "Lunar events", desc: "Full moon, new moon, eclipses" },
    { k: "notif_weekly", label: "Weekly outlook", desc: "Sunday cosmic preview" },
    { k: "notif_muhurta", label: "Auspicious times", desc: "Daily muhurta windows" },
    { k: "sound_enabled", label: "Cosmic sounds", desc: "Ambient and interaction audio" },
  ];

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
        <h1 className="font-display text-3xl text-gradient-gold">Tune the Compass</h1>
      </header>

      <section className="glass space-y-4 rounded-2xl p-5">
        <p className="text-[10px] uppercase tracking-widest text-primary">Notifications</p>
        {toggles.map((t) => (
          <div key={String(t.k)} className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-serif text-sm text-foreground">{t.label}</p>
              <p className="text-[10px] text-muted-foreground">{t.desc}</p>
            </div>
            <Switch
              checked={!!profile[t.k]}
              disabled={saving}
              onCheckedChange={(v) => update({ [t.k]: v })}
            />
          </div>
        ))}
      </section>

      <section className="glass rounded-2xl p-5">
        <p className="text-[10px] uppercase tracking-widest text-primary">Daily reminder</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-serif text-sm">Notification time</p>
          <input
            type="time"
            defaultValue={profile.notification_time?.slice(0, 5) ?? "06:30"}
            onBlur={(e) => update({ notification_time: e.target.value })}
            className="rounded-lg border border-border bg-background/40 px-3 py-1.5 font-serif text-sm text-primary"
          />
        </div>
      </section>

      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-2 rounded-full border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}
