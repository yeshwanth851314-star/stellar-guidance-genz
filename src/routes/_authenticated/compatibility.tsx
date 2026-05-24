import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { computeCompatibility } from "@/lib/compatibility.functions";
import { computeFullChart, geocodePlace } from "@/lib/chart.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const RASIS = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"];

export const Route = createFileRoute("/_authenticated/compatibility")({
  component: Compatibility,
});

type Score = { value: number; max: number; label: string };
type Result = {
  total: number;
  max: number;
  scores: Record<string, Score>;
  verdict: string;
};

function Compatibility() {
  const computeFn = useServerFn(computeCompatibility);
  const chartFn = useServerFn(computeFullChart);
  const geoFn = useServerFn(geocodePlace);

  const [partnerName, setPartnerName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      // 1. Get user's own nakshatra/rasi from profile
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data: profile } = await supabase
        .from("profiles")
        .select("nakshatra, rasi")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (profile?.nakshatra == null || profile?.rasi == null) {
        toast.error("Complete your birth details first in Profile");
        return;
      }

      // 2. Geocode partner's place
      const geo = await geoFn({ data: { place } });

      // 3. Compute partner's panchanga
      const chart = await chartFn({
        data: {
          birthDate: date,
          birthTime: time,
          tzOffsetHours: geo.approxTzHours,
          lat: geo.lat,
          lng: geo.lng,
        },
      });

      // 4. Compute compatibility
      const r = await computeFn({
        data: {
          boyNakshatra: profile.nakshatra,
          boyRasi: profile.rasi,
          girlNakshatra: chart.panchanga.nakshatra,
          girlRasi: chart.panchanga.rasi,
        },
      });
      setResult(r as Result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not compute");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-8">
      <header className="flex items-center gap-3">
        <Link to="/home" className="glass rounded-full p-2 text-primary">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Synastry</p>
          <h1 className="font-display text-3xl text-gradient-gold">Compatibility</h1>
        </div>
      </header>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Ashtakoota Milan — eight-fold Vedic compatibility based on nakshatra and rasi alignment.
        Enter your partner's birth details (we'll use your own from your profile).
      </p>

      {!result && (
        <form onSubmit={onSubmit} className="glass-strong glass-edge flex flex-col gap-3 rounded-2xl p-5">
          <Field label="Partner's name (optional)">
            <input
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              maxLength={60}
              className="w-full bg-transparent text-sm text-foreground outline-none"
              placeholder="e.g. Priya"
            />
          </Field>
          <Field label="Birth date">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </Field>
          <Field label="Birth time">
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </Field>
          <Field label="Birth place">
            <input
              required
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              maxLength={120}
              placeholder="City, Country"
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary/90 px-4 py-2.5 text-[11px] uppercase tracking-widest text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} />}
            Reveal match
          </button>
        </form>
      )}

      {result && (
        <CompatibilityResult
          result={result}
          partnerName={partnerName}
          onReset={() => setResult(null)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="glass glass-edge rounded-xl px-3 py-2">
      <p className="text-[9px] uppercase tracking-widest text-primary">{label}</p>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function CompatibilityResult({
  result,
  partnerName,
  onReset,
}: {
  result: Result;
  partnerName: string;
  onReset: () => void;
}) {
  const pct = Math.round((result.total / result.max) * 100);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <section className="glass-strong glass-edge rounded-3xl p-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
          You {partnerName ? `× ${partnerName}` : "& partner"}
        </p>
        <p className="mt-3 font-display text-6xl text-gradient-gold">{result.total}</p>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">of {result.max} · {pct}%</p>
        <p className="mt-3 font-serif text-sm text-primary">{result.verdict}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background/40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-amber-300"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {Object.entries(result.scores).map(([k, s]) => (
          <div key={k} className="glass glass-edge rounded-2xl p-3">
            <div className="flex items-baseline justify-between">
              <p className="text-[9px] uppercase tracking-widest text-primary">{k}</p>
              <p className="font-display text-sm text-gradient-gold">{s.value}<span className="text-muted-foreground">/{s.max}</span></p>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{s.label}</p>
            <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-background/40">
              <div className="h-full bg-primary/60" style={{ width: `${(s.value / s.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </section>

      <button
        onClick={onReset}
        className="glass glass-edge mt-2 rounded-full px-4 py-2.5 text-[11px] uppercase tracking-widest text-primary"
      >
        Try another match
      </button>
    </motion.div>
  );
}

export const _meta = { RASIS, NAKSHATRAS };
