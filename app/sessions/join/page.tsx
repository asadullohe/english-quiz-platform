import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { JoinSessionForm } from "./join-session-client";

export default async function JoinSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid max-w-xl gap-6">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BookOpenCheck className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-black">QuizUstoz</span>
            <span className="block text-xs text-muted-foreground">Live classroom quiz</span>
          </span>
        </Link>

        <div>
          <h1 className="text-3xl font-black tracking-tight">Live sessionga kirish</h1>
          <p className="mt-2 text-muted-foreground">
            Teacher bergan code orqali waiting room yoki live quizga kiring.
          </p>
        </div>

        <JoinSessionForm isLoggedIn={Boolean(user)} />

        {!user ? (
          <Button asChild variant="outline">
            <Link href="/auth/login">Account bilan kirish</Link>
          </Button>
        ) : null}
      </div>
    </main>
  );
}
