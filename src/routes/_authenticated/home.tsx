import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Heart, Share2, Flame, Loader2, Sun, Sunrise, ShieldAlert, Users, X, Sparkles, RefreshCw } from "lucide-react";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPanchanga } from "@/lib/panchanga.functions";
import { getDailyContent } from "@/lib/daily-content.functions";
import { getMuhurats } from "@/lib/muhurat.functions";
import { Reveal } from "@/components/Reveal";

const RASIS = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"];
const TODAY = new Date().toISOString().slice(0, 10);

const panchangaQO = queryOptions({
  queryKey: ["panchanga", TODAY],
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
  queryKey: ["daily-content", TODAY],
  queryFn: () => getDailyContent({ data: {} }),
  staleTime: 1000 * 60 * 60,
});

// Streak: count consecutive days (ending today or yesterday) of daily_content rows.
const streakQO = queryOptions({
  queryKey: ["streak", TODAY],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return 0;
    const { data } = await supabase
      .from("daily_content")
      .select("date")
      .eq("user_id", u.user.id)
      .order("date", { ascending: false })
      .limit(60);
    if (!data || data.length === 0) return 0;
    const dates = new Set(data.map((d) => d.date));
    let streak = 0;
    const cursor = new Date();
    // allow today OR yesterday as the latest day (so it doesn't break if today's row not yet created)
    if (!dates.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  },
  staleTime: 1000 * 60 * 15,
});

const savedTodayQO = queryOptions({
  queryKey: ["saved-today", TODAY],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return false;
    const { data } = await supabase
      .from("saved_readings")
      .select("id")
      .eq("user_id", u.user.id)
      .eq("date", TODAY)
      .maybeSingle();
    return !!data;
  },
});

export const Route = createFileRoute("/_authenticated/home")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(panchangaQO),
      context.queryClient.ensureQueryData(profileQO),
      context.queryClient.ensureQueryData(dailyQO),
      context.queryClient.ensureQueryData(streakQO),
      context.queryClient.ensureQueryData(savedTodayQO),
    ]);
  },
  pendingComponent: HomeSkeleton,
  pendingMs: 0,
  component: Home,
});

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-primary/5 ${className}`}
      aria-hidden="true"
    >
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
      />
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Shimmer className="h-3 w-32" />
          <Shimmer className="h-7 w-44" />
        </div>
        <div className="space-y-2">
          <Shimmer className="h-3 w-16 ml-auto" />
          <Shimmer className="h-4 w-20 ml-auto" />
        </div>
      </div>
      <Shimmer className="h-20 rounded-2xl" />
      <Shimmer className="h-56 rounded-3xl" />
      <div className="flex gap-2">
        <Shimmer className="h-10 flex-1 rounded-full" />
        <Shimmer className="h-10 flex-1 rounded-full" />
      </div>
      <Shimmer className="h-24 rounded-2xl" />
      <Shimmer className="h-20 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Shimmer className="h-24 rounded-2xl" />
        <Shimmer className="h-24 rounded-2xl" />
        <Shimmer className="h-24 rounded-2xl" />
        <Shimmer className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}

function Home() {
  const { data: p } = useSuspenseQuery(panchangaQO);
  const { data: profile } = useSuspenseQuery(profileQO);
  const { data: daily } = useSuspenseQuery(dailyQO);
  const { data: streak } = useSuspenseQuery(streakQO);
  const { data: saved } = useSuspenseQuery(savedTodayQO);
  const qc = useQueryClient();
  const vibeRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const fresh = await getDailyContent({ data: { force: true } });
      qc.setQueryData(["daily-content", TODAY], fresh);
      toast.success("New guidance channeled");
    } catch {
      toast.error("Could not regenerate — try again in a moment");
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("home-hint-dismissed")) setShowHint(true);
  }, []);

  const dismissHint = () => {
    localStorage.setItem("home-hint-dismissed", "1");
    setShowHint(false);
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      if (saved) {
        await supabase.from("saved_readings").delete().eq("user_id", u.user.id).eq("date", TODAY);
        toast.success("Removed from saved");
      } else {
        await supabase.from("saved_readings").insert({
          user_id: u.user.id,
          date: TODAY,
          snapshot: daily as never,
        });
        toast.success("Saved to your favorites");
      }
      qc.invalidateQueries({ queryKey: ["saved-today", TODAY] });
      qc.invalidateQueries({ queryKey: ["saved-readings"] });
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!vibeRef.current) return;
    setSharing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(vibeRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0a0612",
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `divine-vibe-${TODAY}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Today's Divine Vibe",
          text: `${daily.vibe_theme} — ${daily.vibe_description}`,
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `divine-vibe-${TODAY}.png`;
        a.click();
        toast.success("Image downloaded");
      }
    } catch {
      toast.error("Could not generate image");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8 pr-16">

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{today}</p>
          <h1 className="font-display text-2xl text-gradient-gold break-words">
            Namaste, {profile?.name ?? "Seeker"}
          </h1>
          {streak > 0 && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
              <Flame size={10} className="text-primary" />
              <span className="text-[10px] uppercase tracking-wider text-primary">
                {streak}-day streak
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Your Rasi</p>
          <p className="font-serif text-sm text-primary">
            {typeof profile?.rasi === "number" ? RASIS[profile.rasi] : p.rasiName}
          </p>
          <p className="text-[9px] text-muted-foreground">Moon today: {p.rasiName}</p>
        </div>
      </motion.header>


      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-edge relative flex items-start gap-3 rounded-2xl bg-primary/10 p-3 pr-9"
        >
          <Sparkles className="mt-0.5 shrink-0 text-primary" size={14} />
          <div className="text-[11px] leading-relaxed text-foreground">
            <span className="font-serif text-primary">New here?</span> Tap{" "}
            <Heart size={10} className="-mt-0.5 inline fill-primary text-primary" /> to save a
            reading, share it as an image, or check{" "}
            <Link to="/compatibility" className="text-primary underline-offset-2 hover:underline">
              compatibility
            </Link>{" "}
            with a partner.
          </div>
          <button
            onClick={dismissHint}
            aria-label="Dismiss"
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}



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
        ref={vibeRef}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-strong glass-edge glass-shine relative overflow-hidden rounded-3xl p-6"
        style={{
          background: `linear-gradient(135deg, ${daily.vibe_color}33, oklch(0.18 0.06 275 / 0.6))`,
        }}
      >
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="pointer-events-none absolute -right-4 -top-6 select-none font-display text-[7rem] leading-none text-gradient-gold"
          style={{ filter: "drop-shadow(0 0 24px var(--gold-soft))" }}
        >
          ॐ
        </motion.div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{daily.vibe_icon}</span>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Today's Vibe</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleRegenerate}
            disabled={regenerating}
            aria-label="Regenerate today's guidance"
            className="glass-edge grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary disabled:opacity-50"
          >
            <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
          </motion.button>
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

      {/* Save / Share actions */}
      <div className="-mt-2 flex gap-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          onClick={handleSave}
          disabled={saving}
          aria-label={saved ? "Remove from saved" : "Save today's reading"}
          className="glass glass-edge flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[11px] uppercase tracking-widest text-primary transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Heart size={14} className={saved ? "fill-primary text-primary" : ""} />
          )}
          {saved ? "Saved" : "Save"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          onClick={handleShare}
          disabled={sharing}
          aria-label="Share today's reading"
          className="glass glass-edge flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[11px] uppercase tracking-widest text-primary transition-opacity disabled:opacity-50"
        >
          {sharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
          Share
        </motion.button>
      </div>


      <div className="-mt-1 text-right">
        <Link to="/saved" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary">
          View all saved →
        </Link>
      </div>

      {/* Muhurat widget — auspicious & inauspicious windows today */}
      <MuhuratWidget lat={profile?.birth_lat as number | null} lng={profile?.birth_lng as number | null} />

      {/* Compatibility CTA */}
      <Reveal delay={0.05}>
        <Link
          to="/compatibility"
          className="glass-strong glass-edge flex items-center justify-between rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="glass-edge rounded-full bg-primary/15 p-2 text-primary">
              <Users size={16} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Synastry</p>
              <p className="mt-0.5 font-serif text-sm text-foreground">Check compatibility</p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Ashtakoota →</span>
        </Link>
      </Reveal>

      {/* Mantra card */}
      <Reveal>
        <section className="glass-strong glass-edge rounded-2xl p-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Today's Mantra</p>
          <p className="mt-2 font-display text-lg text-gradient-gold">{daily.mantra}</p>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            Deity · <span className="text-primary">{daily.deity}</span>
          </p>
        </section>
      </Reveal>

      {/* Morning / Evening guidance */}
      <Reveal delay={0.05}>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="glass glass-edge rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌅</span>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Morning Guidance</p>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{daily.morning_guidance ?? ""}</p>
          </div>
          <div className="glass glass-edge rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌙</span>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Evening Guidance</p>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{daily.evening_guidance ?? ""}</p>
          </div>
        </section>
      </Reveal>

      {/* Insight cards */}
      <Reveal delay={0.1}>
        <div className="grid grid-cols-2 gap-3">
          <InsightCard label="Planetary" value={daily.planetary_insight ?? ""} />
          <InsightCard label="Spiritual" value={daily.spiritual_guidance ?? ""} />
          <InsightCard label="Practical" value={daily.practical_tip ?? ""} />
          <InsightCard label="Ayurvedic" value={daily.ayurvedic_tip ?? ""} />
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass glass-edge rounded-2xl p-4 text-center">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Lucky Color</p>
            <svg
              viewBox="0 0 64 64"
              className="mx-auto mt-2 h-9 w-9"
              style={{
                color: daily.lucky_color ?? "#fff",
                filter: `drop-shadow(0 0 10px ${daily.lucky_color ?? "#fff"})`,
              }}
              aria-hidden="true"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <path
                  key={i}
                  d="M32 8 C 38 22, 38 34, 32 44 C 26 34, 26 22, 32 8 Z"
                  fill="currentColor"
                  fillOpacity="0.55"
                  stroke="currentColor"
                  strokeWidth="1"
                  transform={`rotate(${i * 45} 32 32)`}
                />
              ))}
              <circle cx="32" cy="32" r="4" fill="currentColor" />
            </svg>
          </div>
          <div className="glass glass-edge rounded-2xl p-4 text-center">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Lucky Number</p>
            <p className="mt-1 font-display text-3xl text-gradient-gold">{daily.lucky_number}</p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function InsightCard({ label, value }: { label: string; value: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="glass glass-edge rounded-2xl p-4 text-left transition-colors hover:bg-primary/5"
      aria-expanded={open}
    >
      <p className="text-[9px] uppercase tracking-widest text-primary">{label}</p>
      <p className={`mt-1.5 text-[11px] leading-relaxed text-muted-foreground ${open ? "" : "line-clamp-5"}`}>
        {value}
      </p>
      {value.length > 180 && (
        <p className="mt-1 text-[9px] uppercase tracking-widest text-primary/70">
          {open ? "Show less" : "Tap for more"}
        </p>
      )}
    </button>
  );
}

function MuhuratWidget({ lat, lng }: { lat: number | null; lng: number | null }) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const { data, isLoading } = useQuery({
    queryKey: ["muhurats", TODAY, lat, lng],
    queryFn: () => getMuhurats({ data: { lat: lat!, lng: lng! } }),
    enabled: hasCoords,
    staleTime: 1000 * 60 * 60,
  });

  if (!hasCoords) {
    return (
      <Reveal>
        <Link
          to="/profile"
          className="glass glass-edge block rounded-2xl p-4 text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Muhurat</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Add your birth place in Profile to see today's auspicious times</p>
        </Link>
      </Reveal>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="glass glass-edge rounded-2xl p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Today's Muhurats</p>
        <p className="mt-2 text-[11px] text-muted-foreground">Computing celestial alignment…</p>
      </div>
    );
  }

  return (
    <Reveal>
      <section className="glass-strong glass-edge rounded-2xl p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Today's Muhurats</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MuhuratCell
            icon={<Sunrise size={12} />}
            label="Brahma"
            time={data.brahmaMuhurta ? `${data.brahmaMuhurta.start}–${data.brahmaMuhurta.end}` : "—"}
            tone="aux"
          />
          <MuhuratCell
            icon={<Sun size={12} />}
            label="Abhijit"
            time={data.abhijit ? `${data.abhijit.start}–${data.abhijit.end}` : "—"}
            tone="good"
          />
          <MuhuratCell
            icon={<ShieldAlert size={12} />}
            label="Rahu"
            time={data.rahuKalam ? `${data.rahuKalam.start}–${data.rahuKalam.end}` : "—"}
            tone="warn"
          />
        </div>
        {data.sunrise && data.sunset && (
          <p className="mt-3 text-center text-[9px] uppercase tracking-widest text-muted-foreground">
            Sunrise {data.sunrise.time} · Sunset {data.sunset.time}
          </p>
        )}
      </section>
    </Reveal>
  );
}

function MuhuratCell({
  icon,
  label,
  time,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  time: string;
  tone: "good" | "warn" | "aux";
}) {
  const toneCls =
    tone === "good"
      ? "text-emerald-300"
      : tone === "warn"
      ? "text-rose-300"
      : "text-primary";
  return (
    <div className="glass-edge rounded-xl bg-background/30 p-2 text-center">
      <div className={`flex items-center justify-center gap-1 ${toneCls}`}>
        {icon}
        <span className="text-[9px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-1 font-serif text-[10px] text-foreground">{time}</p>
    </div>
  );
}
