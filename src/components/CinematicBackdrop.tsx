import { useEffect, useRef, useState } from "react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4";

/**
 * Static gradient poster shown instantly while the video defers loading.
 * Mirrors the cosmic palette so there is no visible flash before <video> mounts.
 */
const POSTER_BG =
  "radial-gradient(120% 80% at 70% 10%, oklch(0.82 0.16 85 / 0.45), transparent 55%), radial-gradient(80% 60% at 10% 90%, oklch(0.78 0.12 350 / 0.35), transparent 60%), linear-gradient(180deg, oklch(0.18 0.04 280) 0%, oklch(0.12 0.03 280) 100%)";

export function CinematicBackdrop() {
  const [mountVideo, setMountVideo] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Defer video mount until the browser is idle so it never blocks first paint
  // or tab transitions. Lazy per tab: each authenticated route mount waits for
  // idle before touching the network.
  useEffect(() => {
    let cancelled = false;
    const schedule =
      (typeof window !== "undefined" && (window as any).requestIdleCallback) ||
      ((cb: () => void) => window.setTimeout(cb, 300));
    const cancel =
      (typeof window !== "undefined" && (window as any).cancelIdleCallback) ||
      window.clearTimeout;

    const handle = schedule(() => {
      if (!cancelled) setMountVideo(true);
    });

    return () => {
      cancelled = true;
      try {
        cancel(handle);
      } catch {
        /* noop */
      }
    };
  }, []);

  // Pause when tab is hidden to save bandwidth + battery.
  useEffect(() => {
    const onVis = () => {
      const v = containerRef.current?.querySelector("video");
      if (!v) return;
      if (document.hidden) v.pause();
      else void v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10"
    >
      {/* Instant gradient poster — covers the screen before video decodes */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: POSTER_BG }}
      />
      {mountVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden
          onCanPlay={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-70" : "opacity-0"
          }`}
          src={VIDEO_SRC}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-cosmos-deep/80 via-cosmos-deep/75 to-cosmos-deep/95" />
      <div
        className="absolute inset-0 opacity-60 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(120% 80% at 70% 10%, oklch(0.82 0.16 85 / 0.30), transparent 55%), radial-gradient(80% 60% at 10% 90%, oklch(0.78 0.12 350 / 0.22), transparent 60%)",
        }}
      />
    </div>
  );
}
