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

const NAV = ["Wisdom", "Chart", "Rituals", "Contact"];
const STATS = [
  { n: "108", label: "SACRED\nMANTRAS" },
  { n: "27", label: "LUNAR\nNAKSHATRAS" },
  { n: "12", label: "ZODIAC\nRASIS" },
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
      <video
        autoPlay
        loop
        muted
        playsInline
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
          {NAV.map((label, i) => (
            <motion.a
              key={label}
              href="#"
              variants={fadeDown}
              initial="hidden"
              animate="show"
              custom={i + 1}
              className="text-sm font-semibold uppercase tracking-widest text-foreground/90 hover:text-[var(--gold)]"
            >
              {label}
            </motion.a>
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

      {/* STATS */}
      <div className="relative z-10 flex flex-1 items-center justify-end px-5 py-8 sm:px-8 md:px-12 md:py-0">
        <div className="flex items-end gap-5 sm:gap-8 md:gap-10">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={i + 2}
              className="flex flex-col items-end text-right"
            >
              <div
                className="font-display font-semibold leading-none text-foreground"
                style={{ fontSize: "clamp(1.5rem, 5vw, 3.5rem)" }}
              >
                <span
                  className="text-[var(--gold)]"
                  style={{ fontSize: "0.5em", verticalAlign: "0.35em", marginRight: "0.05em" }}
                >
                  +
                </span>
                {s.n}
              </div>
              <div className="mt-2 whitespace-pre-line text-[10px] font-semibold uppercase leading-tight tracking-widest text-foreground/85 sm:text-xs md:text-sm">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* BOTTOM */}
      <div className="relative z-10 flex flex-col gap-6 px-5 pb-8 sm:px-8 md:gap-12 md:px-12 md:pb-12">
        {/* Row A */}
        <div className="flex items-center justify-between gap-4">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={5}
            className="max-w-[130px] text-[10px] font-semibold uppercase tracking-widest text-foreground/85 sm:max-w-[160px] sm:text-xs md:max-w-xs md:text-sm"
          >
            Aligning Soul
            <br />
            With Stars
            <br />
            For Your Path
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={6}
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 whitespace-nowrap font-display text-base font-semibold uppercase tracking-wide text-[var(--gold)] hover:opacity-80 sm:text-xl md:text-2xl"
            >
              Begin Journey
              <ArrowUpRight className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
            </Link>
          </motion.div>
        </div>

        {/* Row B */}
        <div className="flex items-end justify-between gap-3 sm:gap-4">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={7}
            className="w-[120px] shrink-0 text-left text-[9px] font-semibold uppercase tracking-widest text-foreground/85 sm:w-[180px] sm:text-xs md:w-[280px] md:text-right md:text-sm"
          >
            Sacred guidance woven from Panchanga, Nakshatra & wellness — personalized to your cosmic blueprint
          </motion.p>

          <h1 className="text-right" aria-label={HEADING.join(" ")}>
            {HEADING.map((word, i) => (
              <span key={word} className="block overflow-hidden">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.4 + i * 0.14, duration: 0.7, ease: EASE }}
                  className="block font-display font-semibold uppercase text-gradient-gold"
                  style={{ fontSize: "clamp(2rem, 9vw, 9rem)", lineHeight: 0.88 }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>
        </div>
      </div>

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
            {NAV.map((label) => (
              <a
                key={label}
                href="#"
                className="font-display text-3xl font-semibold uppercase tracking-widest text-foreground"
                onClick={() => setOpen(false)}
              >
                {label}
              </a>
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
