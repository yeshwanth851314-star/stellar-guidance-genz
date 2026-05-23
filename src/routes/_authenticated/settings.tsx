import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderTab } from "@/components/PlaceholderTab";

export const Route = createFileRoute("/_authenticated/settings")({
  component: () => (
    <PlaceholderTab
      title="Settings"
      subtitle="Sounds, notifications, theme"
      description="Configure sound theme, daily reminders, and visual preferences — coming soon."
    />
  ),
});
