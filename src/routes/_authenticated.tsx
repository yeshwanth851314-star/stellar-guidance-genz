import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { useDailyReminder } from "@/hooks/use-daily-reminder";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { redirect: location.pathname } });

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!profile?.onboarded && location.pathname !== "/onboarding") {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const [reminder, setReminder] = useState<{ time: string | null; enabled: boolean }>({
    time: null,
    enabled: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("notification_time, notif_spiritual")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setReminder({
        time: data.notification_time?.slice(0, 5) ?? null,
        enabled: !!data.notif_spiritual,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useDailyReminder(reminder.time, reminder.enabled);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-24">
      {/* Cinematic cosmic backdrop — shared across all tabs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cosmos-deep/80 via-cosmos-deep/75 to-cosmos-deep/95" />
        <div
          className="absolute inset-0 opacity-60 mix-blend-soft-light"
          style={{
            background:
              "radial-gradient(120% 80% at 70% 10%, oklch(0.82 0.16 85 / 0.30), transparent 55%), radial-gradient(80% 60% at 10% 90%, oklch(0.78 0.12 350 / 0.22), transparent 60%)",
          }}
        />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}


