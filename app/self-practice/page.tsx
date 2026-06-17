import { PlaceholderPage } from "@/components/placeholder-page";

export default function SelfPracticePage() {
  return (
    <PlaceholderPage
      title="Self practice"
      description="Student approved question bankdan random 5-20 savol ishlaydi."
      items={[
        "Level/category filters",
        "Exclude own questions",
        "Wrong-question retry and accuracy result",
      ]}
    />
  );
}
