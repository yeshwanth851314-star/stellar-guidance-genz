import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, Compass, Sparkles, Leaf, Gift, BookOpen, User, Settings } from "lucide-react";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/chart", label: "Chart", icon: Compass },
  { to: "/ar", label: "Stars", icon: Sparkles },
  { to: "/wellness", label: "Wellness", icon: Leaf },
  { to: "/tithi", label: "Tithi", icon: Gift },
  { to: "/archive", label: "Archive", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 px-3 pb-3">
      <div className="glass flex items-center justify-between rounded-2xl px-2 py-2 shadow-lg shadow-black/40">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  aria-hidden="true"
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                animate={active ? { y: -1 } : { y: 0 }}
                className="relative z-10"
              >
                <Icon className={`h-4 w-4 ${active ? "drop-shadow-[0_0_6px_var(--gold)]" : ""}`} />
              </motion.div>
              <span className="relative z-10 text-[9px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
