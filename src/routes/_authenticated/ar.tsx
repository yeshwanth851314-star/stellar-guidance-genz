import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Compass, Sparkles, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPanchanga } from "@/lib/panchanga.functions";

const panchangaQO = queryOptions({
  queryKey: ["panchanga", new Date().toISOString().slice(0, 10)],
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

const nakLibQO = queryOptions({
  queryKey: ["nakshatra-library"],
  queryFn: async () => {
    const { data } = await supabase.from("nakshatra_library").select("*").order("idx");
    return data ?? [];
  },
  staleTime: Infinity,
});

export const Route = createFileRoute("/_authenticated/ar")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(panchangaQO),
      context.queryClient.ensureQueryData(profileQO),
      context.queryClient.ensureQueryData(nakLibQO),
    ]);
  },
  component: ARView,
});

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS: { title: string; body: string; focus: "constellation" | "name" | "pada" | "deity" | null }[] = [
  {
    title: "Point at the night sky",
    body: "Hold your device up. We'll guide your gaze toward the stars of your birth Nakshatra.",
    focus: null,
  },
  {
    title: "Your constellation",
    body: "These are the stars that the Moon was passing through at your birth.",
    focus: "constellation",
  },
  {
    title: "The Nakshatra",
    body: "Each Nakshatra carries a sound, a symbol, and a quality you were born under.",
    focus: "name",
  },
  {
    title: "Your Pada",
    body: "A Nakshatra is divided into four padas — quarter slices that fine-tune the energy.",
    focus: "pada",
  },
  {
    title: "Your ruling deity",
    body: "This is the cosmic guardian whose qualities echo through your inner world.",
    focus: "deity",
  },
];

function ARView() {
  const { data: p } = useSuspenseQuery(panchangaQO);
  const { data: profile } = useSuspenseQuery(profileQO);
  const { data: library } = useSuspenseQuery(nakLibQO);

  const activeIdx = (profile?.nakshatra ?? p.nakshatra) as number;
  const activePada = (profile?.pada ?? p.pada) as number;
  const nak = library.find((n) => n.idx === activeIdx) ?? library[0];

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [motionEnabled, setMotionEnabled] = useState(false);

  const [step, setStep] = useState<Step>(0);
  const [tourOpen, setTourOpen] = useState(true);

  // Device tilt
  useEffect(() => {
    if (!motionEnabled) return;
    const handler = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      setTilt({
        x: Math.max(-30, Math.min(30, gamma)) / 30,
        y: Math.max(-30, Math.min(30, beta - 45)) / 30,
      });
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [motionEnabled]);

  // Camera lifecycle
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const enableCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraError("Camera unavailable — using cosmic backdrop instead.");
    }
  };

  const disableCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const enableMotion = async () => {
    const D = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } })
      .DeviceOrientationEvent;
    if (D?.requestPermission) {
      try {
        const res = await D.requestPermission();
        if (res === "granted") setMotionEnabled(true);
      } catch {
        setMotionEnabled(true);
      }
    } else {
      setMotionEnabled(true);
    }
  };

  const stars =
    (nak?.constellation_stars as Array<{ x: number; y: number }> | null) ?? [
      { x: 0.3, y: 0.4 },
      { x: 0.5, y: 0.35 },
      { x: 0.7, y: 0.45 },
    ];

  const focus = STEPS[step].focus;
  const advance = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
    else setTourOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">AR Star Field</p>
          <h1 className="font-display text-2xl text-gradient-gold">Your Nakshatra</h1>
        </div>
        <button
          onClick={cameraOn ? disableCamera : enableCamera}
          className="glass glass-edge flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest text-primary"
          aria-label={cameraOn ? "Stop camera" : "Start camera"}
        >
          {cameraOn ? <CameraOff size={12} /> : <Camera size={12} />}
          {cameraOn ? "Stop" : "Live AR"}
        </button>
      </header>

      {/* Viewport */}
      <div
        className="glass glass-edge relative aspect-[3/4] w-full overflow-hidden rounded-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, oklch(0.25 0.08 280 / 0.7), oklch(0.05 0.02 270 / 0.95))",
        }}
      >
        {/* Camera feed */}
        <video
          ref={videoRef}
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            cameraOn ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Cosmic tint over camera */}
        {cameraOn && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cosmos-deep/30 via-transparent to-cosmos-deep/80" />
        )}

        {/* Background stars */}
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 70 }).map((_, i) => {
            const x = (i * 37) % 100;
            const y = (i * 53) % 100;
            const s = (i % 3) + 1;
            return (
              <motion.span
                key={i}
                className="absolute rounded-full bg-white/50"
                style={{ left: `${x}%`, top: `${y}%`, width: s, height: s }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 2 + (i % 5) * 0.5,
                  repeat: Infinity,
                  delay: (i % 7) * 0.3,
                }}
              />
            );
          })}
        </div>

        {/* Constellation */}
        <motion.svg
          viewBox="0 0 1 1"
          className="absolute inset-0 h-full w-full"
          animate={{
            x: tilt.x * 24,
            y: tilt.y * 24,
            scale: focus === "constellation" ? 1.1 : 1,
          }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
          {stars.map((s, i) =>
            i < stars.length - 1 ? (
              <motion.line
                key={`l${i}`}
                x1={s.x}
                y1={s.y}
                x2={stars[i + 1].x}
                y2={stars[i + 1].y}
                stroke="oklch(0.85 0.16 85 / 0.7)"
                strokeWidth={0.003}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.7 }}
              />
            ) : null,
          )}
          {stars.map((s, i) => (
            <motion.g
              key={`s${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 120 }}
            >
              <circle cx={s.x} cy={s.y} r={0.035} fill="oklch(0.85 0.16 85 / 0.35)" />
              <circle cx={s.x} cy={s.y} r={0.018} fill="oklch(0.95 0.05 85)" />
            </motion.g>
          ))}
        </motion.svg>

        {/* Center crosshair when no constellation focus */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"
          >
            <Compass size={32} className="drop-shadow-[0_0_12px_var(--gold)]" />
          </motion.div>
        )}

        {/* Floating overlay label — Nakshatra name */}
        <AnimatePresence>
          {focus === "name" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-strong glass-edge absolute left-1/2 top-6 -translate-x-1/2 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-primary"
            >
              {nak?.name_sanskrit}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pada highlight */}
        <AnimatePresence>
          {focus === "pada" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="glass-strong glass-edge absolute right-4 top-4 grid h-16 w-16 place-items-center rounded-full"
            >
              <div className="text-center">
                <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Pada</p>
                <p className="font-display text-xl text-gradient-gold leading-none">{activePada}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deity highlight */}
        <AnimatePresence>
          {focus === "deity" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="glass-strong glass-edge absolute bottom-20 left-1/2 -translate-x-1/2 rounded-2xl px-5 py-3 text-center"
            >
              <p className="text-[9px] uppercase tracking-[0.3em] text-primary">Ruling Deity</p>
              <p className="mt-1 font-display text-lg text-gradient-gold">{nak?.deity ?? "—"}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom symbol strip */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-primary">
          <span>{nak?.symbol ?? "—"}</span>
          <span>{nak?.name_english}</span>
        </div>

        {/* Guided overlay card */}
        <AnimatePresence>
          {tourOpen && (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong glass-edge absolute inset-x-4 bottom-4 rounded-2xl p-4 pr-3"
            >
              <div className="flex items-start gap-3">
                <div className="glass-edge mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Sparkles size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-primary">
                      Step {step + 1} / {STEPS.length}
                    </p>
                    <div className="flex flex-1 gap-1">
                      {STEPS.map((_, i) => (
                        <div
                          key={i}
                          className={`h-0.5 flex-1 rounded-full ${
                            i <= step ? "bg-primary" : "bg-primary/15"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1.5 font-serif text-[15px] text-foreground">
                    {STEPS[step].title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {STEPS[step].body}
                  </p>
                </div>
                <button
                  onClick={() => setTourOpen(false)}
                  aria-label="Skip tour"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={advance}
                className="glass-edge mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary/90 px-4 py-2 text-[11px] uppercase tracking-widest text-primary-foreground"
              >
                {step < 4 ? "Next" : "Begin"} <ChevronRight size={12} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restart tour pill when closed */}
        {!tourOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => {
              setStep(0);
              setTourOpen(true);
            }}
            className="glass glass-edge absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest text-primary"
          >
            <Sparkles size={11} /> Replay tour
          </motion.button>
        )}
      </div>

      {/* Errors / tilt enable */}
      {cameraError && (
        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {cameraError}
        </p>
      )}
      {!motionEnabled && (
        <button
          onClick={enableMotion}
          className="glass glass-edge rounded-full px-4 py-2 text-[11px] uppercase tracking-widest text-primary"
        >
          Tilt phone to explore · enable motion
        </button>
      )}

      {/* Detail card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong glass-edge rounded-3xl p-5"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Moon Nakshatra</p>
        <h2 className="mt-1 font-display text-3xl text-gradient-gold">{nak?.name_english}</h2>
        <p className="font-serif text-sm text-primary">{nak?.name_sanskrit}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Cell label="Pada" value={`${activePada} / 4`} />
          <Cell label="Lord" value={nak?.lord ?? "—"} />
          <Cell label="Element" value={nak?.element ?? "—"} />
        </div>

        <div className="mt-4 rounded-2xl bg-background/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Ruling Deity</p>
          <p className="mt-1 font-display text-xl text-gradient-gold">{nak?.deity ?? "—"}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {nak?.trait ?? ""}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <Cell label="Gana" value={nak?.gana ?? "—"} />
          <Cell label="Quality" value={nak?.quality ?? "—"} />
        </div>
      </motion.section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/30 p-2">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-serif text-[12px] text-primary">{value}</p>
    </div>
  );
}
