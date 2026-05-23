import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
  s: number;
  phase: number;
}

export function StarField({ density = 120 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stars: Star[] = [];
    let shooting: { x: number; y: number; vx: number; vy: number; life: number } | null = null;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      stars = Array.from({ length: density }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 1.4 + 0.2,
        o: Math.random() * 0.6 + 0.2,
        s: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const tick = () => {
      t += 1;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // nebula glow
      const grad = ctx.createRadialGradient(
        canvas.offsetWidth * 0.7,
        canvas.offsetHeight * 0.2,
        20,
        canvas.offsetWidth * 0.7,
        canvas.offsetHeight * 0.2,
        canvas.offsetWidth * 0.8
      );
      grad.addColorStop(0, "rgba(160, 100, 220, 0.18)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      stars.forEach((s) => {
        const tw = 0.6 + Math.sin(t * s.s + s.phase) * 0.4;
        ctx.globalAlpha = s.o * tw;
        ctx.fillStyle = "#fff8dc";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // occasional shooting star
      if (!shooting && Math.random() < 0.003) {
        shooting = {
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight * 0.4,
          vx: 4 + Math.random() * 3,
          vy: 1 + Math.random() * 1.5,
          life: 1,
        };
      }
      if (shooting) {
        ctx.strokeStyle = `rgba(255, 230, 180, ${shooting.life})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(shooting.x - shooting.vx * 8, shooting.y - shooting.vy * 8);
        ctx.stroke();
        shooting.x += shooting.vx;
        shooting.y += shooting.vy;
        shooting.life -= 0.012;
        if (shooting.life <= 0) shooting = null;
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen"
      aria-hidden
    />
  );
}
