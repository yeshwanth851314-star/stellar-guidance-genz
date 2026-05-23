import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { geocodePlace, computeFullChart } from "@/lib/chart.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: Onboarding,
});

function Onboarding() {
  const nav = useNavigate();
  const geocode = useServerFn(geocodePlace);
  const computeChart = useServerFn(computeFullChart);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [place, setPlace] = useState("");
  const [geo, setGeo] = useState<{ lat: number; lng: number; display_name: string } | null>(null);
  const [tz, setTz] = useState<number>(5.5);
  const [geocoding, setGeocoding] = useState(false);
  const [loading, setLoading] = useState(false);

  const doGeocode = async () => {
    if (!place.trim()) return;
    setGeocoding(true);
    try {
      const r = await geocode({ data: { place } });
      setGeo({ lat: r.lat, lng: r.lng, display_name: r.display_name });
      setTz(r.approxTzHours);
      toast.success("Place found");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Geocoding failed");
    } finally {
      setGeocoding(false);
    }
  };

  const finish = async () => {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      if (!geo) throw new Error("Please verify your birth place first");

      const { panchanga: p, lagna } = await computeChart({
        data: { birthDate: date, birthTime: time, tzOffsetHours: tz, lat: geo.lat, lng: geo.lng },
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          birth_date: date,
          birth_time: time,
          birth_place: geo.display_name,
          birth_lat: geo.lat,
          birth_lng: geo.lng,
          rasi: p.rasi,
          nakshatra: p.nakshatra,
          pada: p.pada,
          lagna: lagna.rasi,
          tithi: p.tithi,
          vara: p.vara,
          yoga_index: p.yoga,
          karana_index: p.karana,
          sun_longitude: p.sunLongitude,
          moon_longitude: p.moonLongitude,
          dosha: p.dosha,
          onboarded: true,
        })
        .eq("user_id", u.user.id);

      if (error) throw error;
      toast.success(`Welcome, ${name}. Your Rasi is ${p.rasiName}.`);
      nav({ to: "/home" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass rounded-3xl p-7"
      >
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Step {step + 1} of 3
        </p>

        {step === 0 && (
          <>
            <h2 className="mt-1 font-display text-3xl text-gradient-gold">Your name</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              What shall the cosmos call you?
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-5 w-full rounded-xl border border-border bg-background/50 px-4 py-3 outline-none focus:border-primary"
            />
            <button
              disabled={!name.trim()}
              onClick={() => setStep(1)}
              className="mt-5 w-full rounded-full bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-40"
            >
              Continue
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="mt-1 font-display text-3xl text-gradient-gold">Birth details</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Used to calculate your Rasi, Nakshatra, and Lagna (Ascendant).
            </p>
            <div className="mt-5 space-y-3">
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Date
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Time of birth (24h, local time)
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 outline-none focus:border-primary"
                />
              </label>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Place of birth
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => { setPlace(e.target.value); setGeo(null); }}
                    placeholder="Mangalagiri, India"
                    className="flex-1 rounded-xl border border-border bg-background/50 px-4 py-2.5 outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={doGeocode}
                    disabled={!place.trim() || geocoding}
                    className="rounded-xl bg-primary/20 px-3 text-xs font-semibold text-primary disabled:opacity-40"
                  >
                    {geocoding ? "..." : "Find"}
                  </button>
                </div>
              </label>
              {geo && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-[11px]">
                  <p className="text-foreground/80">{geo.display_name}</p>
                  <p className="mt-1 text-muted-foreground">
                    {geo.lat.toFixed(4)}°, {geo.lng.toFixed(4)}°
                  </p>
                </div>
              )}
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Timezone offset (hours from UTC)
                <input
                  type="number"
                  step="0.25"
                  value={tz}
                  onChange={(e) => setTz(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground/70">India: 5.5 · UK: 0 · NYC: -5</span>
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 rounded-full border border-border py-2.5 text-sm">
                Back
              </button>
              <button
                disabled={!date || !geo}
                onClick={() => setStep(2)}
                className="flex-1 rounded-full bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mt-1 font-display text-3xl text-gradient-gold">Cosmic alignment</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {name}, we'll calculate your full Vedic chart using Lahiri ayanamsha — including your
              Lagna (Ascendant) based on the exact coordinates of {geo?.display_name?.split(",")[0]}.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>✦ Rasi (Moon sign), Nakshatra & Pada</li>
              <li>✦ Lagna (Ascendant) from your birth coordinates</li>
              <li>✦ Daily Tithi, Yoga, Karana</li>
              <li>✦ Dosha-based wellness guidance</li>
            </ul>
            <button
              disabled={loading}
              onClick={finish}
              className="mt-7 w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
              style={{ boxShadow: "0 8px 32px -10px var(--gold)" }}
            >
              {loading ? "Aligning the stars..." : "Reveal my chart"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
