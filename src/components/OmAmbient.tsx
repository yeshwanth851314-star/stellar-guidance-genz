import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Gentle ambient Om drone synthesized with the Web Audio API.
 * Uses 136.1 Hz (traditional "Om" / Earth-year frequency) with
 * soft harmonics and a slow tremolo for a meditative pad.
 */
export function OmAmbient() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ gain: GainNode; oscs: OscillatorNode[] } | null>(null);

  useEffect(() => {
    return () => {
      nodesRef.current?.oscs.forEach((o) => {
        try { o.stop(); } catch { /* noop */ }
      });
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  const start = async () => {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const base = 136.1; // Om
    const freqs = [base, base * 2, base * 3]; // fundamental + soft harmonics
    const oscs: OscillatorNode[] = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.55 : i === 1 ? 0.18 : 0.08;
      o.connect(g).connect(master);
      o.start();
      return o;
    });

    // Slow tremolo for breath-like swell
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();
    oscs.push(lfo);

    // Fade in
    master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.5);

    nodesRef.current = { gain: master, oscs };
  };

  const stop = () => {
    const n = nodesRef.current;
    const ctx = ctxRef.current;
    if (!n || !ctx) return;
    n.gain.gain.cancelScheduledValues(ctx.currentTime);
    n.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => {
      n.oscs.forEach((o) => { try { o.stop(); } catch { /* noop */ } });
      nodesRef.current = null;
    }, 700);
  };

  const toggle = async () => {
    if (on) { stop(); setOn(false); }
    else { await start(); setOn(true); }
  };

  return (
    <motion.button
      onClick={toggle}
      aria-label={on ? "Mute Om ambient" : "Play Om ambient"}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.92 }}
      className="glass fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full text-lg backdrop-blur-md"
      style={{
        boxShadow: on
          ? "0 0 24px -4px oklch(0.82 0.16 85 / 0.6)"
          : "0 0 12px -6px oklch(0.82 0.16 85 / 0.2)",
      }}
    >
      <motion.span
        animate={on ? { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 0.55 }}
        transition={{ repeat: on ? Infinity : 0, duration: 3.2, ease: "easeInOut" }}
        className="text-gradient-gold font-display"
      >
        ॐ
      </motion.span>
    </motion.button>
  );
}
