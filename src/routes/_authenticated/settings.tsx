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
  const [notifStatus, setNotifStatus] = useState<string>("");

  if (!profile) return null;

  const update = async (patch: Record<string, unknown>) => {
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

  const fields: Array<{ k: keyof typeof profile; label: string; type?: string; placeholder?: string }> = [
    { k: "name", label: "Name", placeholder: "Your name" },
    { k: "email", label: "Email", type: "email", placeholder: "you@example.com" },
    { k: "phone", label: "Phone", type: "tel", placeholder: "+1 555 123 4567" },
    { k: "birth_date", label: "Birth date", type: "date" },
    { k: "birth_time", label: "Birth time", type: "time" },
    { k: "birth_place", label: "Birth place", placeholder: "City, Country" },
  ];

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifStatus("This browser does not support notifications.");
      return;
    }
    if (Notification.permission === "denied") {
      setNotifStatus("Blocked — allow notifications for this site in your browser settings.");
      return;
    }
    try {
      const p = await Notification.requestPermission();
      if (p === "granted") {
        setNotifStatus("Enabled ✨ — you'll hear from the cosmos at your chosen time.");
        try {
          new Notification("✨ Reminders enabled", {
            body: "You'll hear from the cosmos at your chosen time.",
          });
        } catch {
          /* some browsers restrict the constructor */
        }
      } else if (p === "denied") {
        setNotifStatus("Permission denied. Enable it from your browser's site settings.");
      } else {
        setNotifStatus("Dismissed. Tap again to retry.");
      }
    } catch (err) {
      setNotifStatus(`Could not request permission: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
        <h1 className="font-display text-3xl text-gradient-gold">Tune the Compass</h1>
      </header>

      <section className="glass space-y-3 rounded-2xl p-5">
        <p className="text-[10px] uppercase tracking-widest text-primary">Your details</p>
        {fields.map((f) => (
          <div key={String(f.k)} className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</label>
            <input
              type={f.type ?? "text"}
              defaultValue={(profile[f.k] as string | null) ?? ""}
              placeholder={f.placeholder}
              disabled={saving}
              onBlur={(e) => {
                const v = e.target.value;
                const current = (profile[f.k] as string | null) ?? "";
                if (v !== current) update({ [f.k]: v || null });
              }}
              className="rounded-lg border border-border bg-background/40 px-3 py-2 font-serif text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground">Changes save when you tap away from a field.</p>
      </section>

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
        <button
          onClick={enableNotifications}
          className="mt-3 w-full rounded-lg border border-primary/40 py-2 text-xs text-primary hover:bg-primary/10"
        >
          Enable browser notifications
        </button>
        {notifStatus && (
          <p className="mt-2 text-[10px] text-muted-foreground">{notifStatus}</p>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">
          Note: the in-app preview iframe may block notifications. Open the published site in a normal browser tab to grant permission.
        </p>
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
