import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";

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
  return (
    <div className="min-h-screen pb-24">
      <Outlet />
      <BottomNav />
    </div>
  );
}
