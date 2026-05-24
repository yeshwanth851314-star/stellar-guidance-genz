import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "om-ambient-volume";
const MAX_GAIN = 0.5; // 100% slider → master gain 0.5 (comfortable ceiling)

/**
 * Gentle ambient Om drone synthesized with the Web Audio API.
 * Uses 136.1 Hz (traditional "Om" / Earth-year frequency) with
 * soft harmonics and a slow tremolo for a meditative pad.
 */
export function OmAmbient() {
  const [on, setOn] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 65;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const n = stored ? Number(stored) : NaN;
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 65;
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ gain: GainNode; oscs: OscillatorNode[] } | null>(null);

  // Persist volume
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, String(volume));
  }, [volume]);

  // Live-apply volume to running master gain
  useEffect(() => {
    const ctx = ctxRef.current;
    const n = nodesRef.current;
    if (!ctx || !n || !on) return;
    const target = (volume / 100) * MAX_GAIN;
    n.gain.gain.cancelScheduledValues(ctx.currentTime);
    n.gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.2);
  }, [volume, on]);

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

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.7;
    master.connect(filter).connect(ctx.destination);

    const base = 136.1;
    const partials: Array<{ ratio: number; gain: number }> = [
      { ratio: 1, gain: 0.45 },
      { ratio: 2, gain: 0.30 },
      { ratio: 3, gain: 0.10 },
      { ratio: 0.5, gain: 0.18 },
    ];
    const oscs: OscillatorNode[] = partials.map(({ ratio, gain }) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = base * ratio;
      o.detune.value = (Math.random() - 0.5) * 6;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(master);
      o.start();
      return o;
    });

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();
    oscs.push(lfo);

    const target = (volume / 100) * MAX_GAIN;
    master.gain.linearRampToValueAtTime(target, ctx.currentTime + 2.5);

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
    <div className="fixed right-4 top-4 z-50 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {showSlider && (
            <motion.div
              initial={{ opacity: 0, x: 12, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: 12, width: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="glass flex items-center gap-2 rounded-full px-3 py-2 backdrop-blur-md"
            >
              <span className="text-xs text-muted-foreground" aria-hidden="true">🔈</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Om ambient volume"
                className="h-1 w-28 cursor-pointer accent-[var(--gold,oklch(0.82_0.16_85))]"
              />
              <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
                {volume}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={toggle}
          onDoubleClick={() => setShowSlider((s) => !s)}
          aria-label={on ? "Mute Om ambient" : "Play Om ambient"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.92 }}
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-lg backdrop-blur-md"
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
      </div>

      <button
        onClick={() => setShowSlider((s) => !s)}
        aria-label={showSlider ? "Hide volume slider" : "Show volume slider"}
        aria-expanded={showSlider}
        className="glass rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur-md hover:text-foreground"
      >
        {showSlider ? "Hide" : "Volume"}
      </button>
    </div>
  );
}
