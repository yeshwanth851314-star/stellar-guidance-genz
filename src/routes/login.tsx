import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
  },
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/home` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/home" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/home`,
      });
      if (res.error) throw res.error;
      if (!res.redirected) nav({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-7"
      >
        <h1 className="font-display text-3xl text-gradient-gold">
          {mode === "signup" ? "Begin" : "Welcome back"}
        </h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
          Karma Compass
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary/40 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1H12v3.2h5.35c-.23 1.27-1.55 3.74-5.35 3.74-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.57-2.48C16.83 3.5 14.65 2.5 12 2.5 6.97 2.5 2.9 6.57 2.9 11.6S6.97 20.7 12 20.7c6.93 0 9.5-4.86 9.5-9.43 0-.63-.07-1.12-.15-1.17z"/></svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            required
            placeholder="email@cosmos.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            disabled={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ boxShadow: "0 8px 32px -10px var(--gold)" }}
          >
            {loading ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {mode === "signup" ? "Already aligned?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-primary underline-offset-4 hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create account"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
