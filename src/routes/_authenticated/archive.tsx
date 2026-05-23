import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderTab } from "@/components/PlaceholderTab";

export const Route = createFileRoute("/_authenticated/archive")({
  component: () => (
    <PlaceholderTab
      title="Archive"
      subtitle="Your past 30 days of cosmos"
      description="Browse past Panchangas, daily insights, and journal entries — coming soon."
    />
  ),
});
