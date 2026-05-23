import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderTab } from "@/components/PlaceholderTab";

export const Route = createFileRoute("/_authenticated/chart")({
  component: () => (
    <PlaceholderTab
      title="Birth Chart"
      subtitle="Your D1 Rashi chakra"
      description="An interactive Vedic birth chart with planetary placements, houses, and aspects is being prepared for the next iteration."
    />
  ),
});
