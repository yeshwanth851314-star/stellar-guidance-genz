import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between px-6 pb-10 pt-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="relative grid h-28 w-28 place-items-center rounded-full border border-primary/30"
          style={{ boxShadow: "0 0 60px -10px var(--gold-soft)" }}
        >
          <Sparkles className="h-10 w-10 text-primary drop-shadow-[0_0_10px_var(--gold)]" />
        </motion.div>
        <h1 className="font-display text-5xl leading-tight text-gradient-gold">
          Karma<br />Compass
        </h1>
        <p className="font-serif text-sm uppercase tracking-[0.35em] text-muted-foreground">
          Daily Cosmos · Daily Self
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="max-w-xs space-y-4"
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Align your day with the rhythm of stars, planets, and ancient wisdom.
          Panchanga, Nakshatra, and wellness — personalized to you.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="block w-full rounded-full bg-primary py-3 font-medium text-primary-foreground transition hover:opacity-90"
            style={{ boxShadow: "0 8px 32px -8px var(--gold)" }}
          >
            Begin Your Journey
          </Link>
          <Link to="/login" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Already aligned? Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
