import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderTab } from "@/components/PlaceholderTab";

export const Route = createFileRoute("/_authenticated/ar")({
  component: () => (
    <PlaceholderTab
      title="AR Star Field"
      subtitle="Find your Nakshatra in the sky"
      description="Tilt your phone to pan through the constellations of the 27 Nakshatras — coming soon."
    />
  ),
});
