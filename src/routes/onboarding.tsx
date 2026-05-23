import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getPanchanga } from "@/lib/panchanga.functions";
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
  const computeP = useServerFn(getPanchanga);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");

      const iso = new Date(`${date}T${time}:00Z`).toISOString();
      const p = await computeP({ data: { isoDate: iso } });

      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          birth_date: date,
          birth_time: time,
          birth_place: place || null,
          rasi: p.rasi,
          nakshatra: p.nakshatra,
          pada: p.pada,
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
              Used to calculate your Rasi, Nakshatra, and Lagna.
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
                Time (24h)
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 outline-none focus:border-primary"
                />
              </label>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Place (optional)
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="Hyderabad, India"
                  className="mt-1 w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 outline-none focus:border-primary"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 rounded-full border border-border py-2.5 text-sm">
                Back
              </button>
              <button
                disabled={!date}
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
              {name}, we'll calculate your Vedic chart using Lahiri ayanamsha and reveal your
              daily Panchanga, planetary insights, and personalized wellness.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>✦ Rasi (Moon sign) & Nakshatra</li>
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
