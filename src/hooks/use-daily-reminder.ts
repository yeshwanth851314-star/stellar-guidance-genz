import { useEffect } from "react";

/**
 * Schedules a local browser notification at the user's chosen daily time.
 * Re-arms itself for the next day after firing.
 */
export function useDailyReminder(time: string | null | undefined, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !time) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      const [hStr, mStr] = time.split(":");
      const h = Number(hStr);
      const m = Number(mStr);
      if (Number.isNaN(h) || Number.isNaN(m)) return;
      const now = new Date();
      const next = new Date();
      next.setHours(h, m, 0, 0);
      if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
      const delay = next.getTime() - now.getTime();
      timeoutId = setTimeout(() => {
        if (Notification.permission === "granted") {
          try {
            new Notification("✨ Your cosmic guidance is ready", {
              body: "Open Stellar Guidance for today's Panchanga, mantra & vibe.",
              icon: "/favicon.ico",
              tag: "daily-vibe",
            });
          } catch {
            /* ignore */
          }
        }
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [time, enabled]);
}
