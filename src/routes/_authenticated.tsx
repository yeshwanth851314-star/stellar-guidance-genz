import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { CinematicBackdrop } from "@/components/CinematicBackdrop";
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
      {/* Cinematic cosmic backdrop — shared across all tabs, lazy-loaded */}
      <CinematicBackdrop />
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


