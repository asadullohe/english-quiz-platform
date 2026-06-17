import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderPage({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border bg-card/88 p-6 shadow-soft backdrop-blur">
          <p className="text-sm font-semibold text-accent">MVP module</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Keyingi implementation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {items.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
