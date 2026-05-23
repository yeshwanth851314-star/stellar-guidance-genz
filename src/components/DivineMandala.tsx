import { motion } from "framer-motion";

/**
 * Sacred geometry decoration — a slowly rotating mandala with 8 lotus petals,
 * radiating spokes, and concentric rings. Drawn with currentColor so it can
 * inherit gold/saffron from its parent.
 */
export function DivineMandala({
  size = 160,
  className = "",
  spin = 80,
  opacity = 0.55,
}: {
  size?: number;
  className?: string;
  spin?: number;
  opacity?: number;
}) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={{ color: "var(--gold)", opacity }}
      animate={{ rotate: 360 }}
      transition={{ duration: spin, repeat: Infinity, ease: "linear" }}
      aria-hidden="true"
    >
      {/* outer ring */}
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 3" />
      {/* 24 radiating spokes */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * 360) / 24;
        return (
          <line
            key={`s-${i}`}
            x1="100"
            y1="20"
            x2="100"
            y2="32"
            stroke="currentColor"
            strokeWidth="0.6"
            transform={`rotate(${a} 100 100)`}
          />
        );
      })}
      {/* 8 lotus petals */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 360) / 8;
        return (
          <path
            key={`p-${i}`}
            d="M100 40 C 112 60, 112 80, 100 96 C 88 80, 88 60, 100 40 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            transform={`rotate(${a} 100 100)`}
          />
        );
      })}
      {/* inner triangles (Sri Yantra hint) */}
      <polygon points="100,60 132,118 68,118" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <polygon points="100,140 68,82 132,82" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="3" fill="currentColor" />
    </motion.svg>
  );
}
