import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function PlaceholderTab({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-8"
      >
        <Sparkles className="mx-auto h-8 w-8 text-primary drop-shadow-[0_0_10px_var(--gold)]" />
        <h1 className="mt-4 font-display text-3xl text-gradient-gold">{title}</h1>
        <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </p>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </motion.div>
    </div>
  );
}
