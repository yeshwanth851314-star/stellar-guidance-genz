import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderTab } from "@/components/PlaceholderTab";

export const Route = createFileRoute("/_authenticated/wellness")({
  component: () => (
    <PlaceholderTab
      title="Wellness"
      subtitle="Yoga, herbs & dosha guidance"
      description="Dosha-personalized yoga sequences, Ayurvedic herbs, and daily wellness rituals — coming soon."
    />
  ),
});
