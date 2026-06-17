import { PlaceholderPage } from "@/components/placeholder-page";

export default function SessionsPage() {
  return (
    <PlaceholderPage
      title="Live sessions"
      description="Waiting room, manual start, remaining-time late join va result report."
      items={[
        "Session code and participant list",
        "Start/end server actions",
        "Progress polling/realtime",
      ]}
    />
  );
}
