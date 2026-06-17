import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES, LEVELS } from "@/lib/constants/app";

const steps = [
  "Teacher groupga mavzu va savollar sonini beradi.",
  "Studentlar savol yaratadi, support/teacher review qiladi.",
  "Approved savollardan live quiz boshlanadi.",
  "Result, xatolar va question analytics chiqadi.",
];

export default function Home() {
  return (
    <main className="grain min-h-screen overflow-hidden px-4 py-8 md:px-8">
      <section className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="py-12 md:py-20">
          <div className="inline-flex rounded-full border bg-card/80 px-4 py-2 text-sm font-semibold shadow-soft backdrop-blur">
            Uzbek learners uchun English quiz platforma
          </div>
          <h1 className="mt-7 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
            Studentlar savol yaratadi. Teacher live quiz qiladi.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            QuizUstoz classroom loopni yopadi: assignment, review, approved question bank,
            live quiz, self practice va real-time notification.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Dashboardga o&apos;tish
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/register">Student sifatida boshlash</Link>
            </Button>
          </div>
        </div>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl">MVP classroom flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <div className="flex gap-4 rounded-2xl border bg-background/80 p-4" key={step}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                  {index + 1}
                </span>
                <p className="font-semibold">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <UsersRound className="h-7 w-7 text-primary" />
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Admin, teacher, support teacher, student va guest participant.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Layers3 className="h-7 w-7 text-accent" />
            <CardTitle>Levels</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold" key={level}>
                {level}
              </span>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CheckCircle2 className="h-7 w-7 text-accent" />
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <span
                className="rounded-full bg-muted px-3 py-1 text-xs font-semibold"
                key={category}
              >
                {category}
              </span>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
