import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
  },
  component: Landing,
});

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: EASE },
  }),
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: EASE },
  }),
};

const NAV: Array<{ label: string; to: "/login" | "/home" | "/chart" | "/wellness" | "/profile" }> = [
  { label: "Wisdom", to: "/home" },
  { label: "Chart", to: "/chart" },
  { label: "Rituals", to: "/wellness" },
  { label: "Contact", to: "/profile" },
];
const HEADING = ["Align", "Awaken", "Ascend"];

function Logo() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-[var(--gold)]">
      <span className="h-[10px] w-[10px] rounded-full bg-[var(--gold)]" />
    </div>
  );
}

function Landing() {
  const [open, setOpen] = useState(false);

  return (
    <div className="font-sans relative flex min-h-screen flex-col overflow-hidden text-foreground">
      {/* Video background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cosmos-deep"
        style={{
          backgroundImage:
            "radial-gradient(60% 80% at 70% 20%, oklch(0.32 0.10 280 / 0.7), transparent 60%), radial-gradient(60% 60% at 20% 80%, oklch(0.30 0.12 320 / 0.6), transparent 60%)",
        }}
      />
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/419ec44e-4f09-4213-8537-4c825f1c3ef0/id-preview-c4fd7e51--f52dba0b-7b64-47f3-beb1-ab4a1e0d934b.lovable.app-1779551117379.png"
        className="absolute inset-0 h-full w-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260517_222138_3e3205be-3364-417b-a64a-bfe087acbec4.mp4"
      />
      {/* Cosmic veil over video for readability + brand mood */}
      <div className="absolute inset-0 bg-gradient-to-b from-cosmos-deep/70 via-cosmos-deep/55 to-cosmos-deep/85" />
      <div
        className="absolute inset-0 opacity-60 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(120% 80% at 70% 10%, oklch(0.82 0.16 85 / 0.35), transparent 55%), radial-gradient(80% 60% at 10% 90%, oklch(0.78 0.12 350 / 0.25), transparent 60%)",
        }}
      />

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-8 md:px-12 md:pt-6">
        <motion.div variants={fadeDown} initial="hidden" animate="show" custom={0}>
          <Logo />
        </motion.div>

        <div className="hidden items-center gap-8 md:flex">
          {NAV.map((item, i) => (
            <motion.div
              key={item.label}
              variants={fadeDown}
              initial="hidden"
              animate="show"
              custom={i + 1}
            >
              <Link
                to={item.to}
                className="text-sm font-semibold uppercase tracking-widest text-foreground/90 hover:text-[var(--gold)]"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.button
          variants={fadeDown}
          initial="hidden"
          animate="show"
          custom={5}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-full bg-black/70 backdrop-blur"
        >
          <span className="h-0.5 w-4 bg-white" />
          <span className="h-0.5 w-4 bg-white" />
          <span className="h-0.5 w-4 bg-white" />
        </motion.button>
      </nav>

      {/* HERO — single focal point */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground/70"
        >
          Vedic Wisdom · Daily Alignment
        </motion.p>

        <h1 aria-label={HEADING.join(" ")} className="flex flex-col items-center">
          {HEADING.map((word, i) => (
            <span key={word} className="block overflow-hidden">
              <motion.span
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3 + i * 0.14, duration: 0.7, ease: EASE }}
                className="block font-display font-semibold uppercase text-gradient-gold"
                style={{ fontSize: "clamp(2rem, 9vw, 3.75rem)", lineHeight: 1.05, letterSpacing: "0.04em" }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={7}
          className="max-w-[18rem] text-[13px] leading-relaxed text-foreground/80 sm:text-sm"
        >
          Sacred guidance from Panchanga, Nakshatra, and ritual — personalized to your cosmic blueprint.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={8}
          className="pt-2"
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/60 bg-black/40 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-[var(--gold)] backdrop-blur-md transition hover:bg-[var(--gold)]/10"
          >
            Begin Journey
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </main>

      {/* MOBILE MENU */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-cosmos-deep px-5 pb-8 pt-5 sm:px-8"
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/80"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="mt-16 flex flex-col gap-8">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="font-display text-3xl font-semibold uppercase tracking-widest text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link
            to="/login"
            className="mt-auto inline-flex items-center gap-2 text-xl font-semibold uppercase tracking-wide text-[var(--gold)]"
            onClick={() => setOpen(false)}
          >
            Begin Journey
            <ArrowUpRight className="h-5 w-5" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
