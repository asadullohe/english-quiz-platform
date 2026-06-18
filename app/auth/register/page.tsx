import Link from "next/link";
import { registerAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student account yaratish</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={registerAction} className="space-y-4">
            {params?.error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {params.error}
              </p>
            ) : null}
            <Input autoComplete="name" name="full_name" placeholder="Ism familiya" required />
            <Input autoComplete="email" name="email" placeholder="Email" required type="email" />
            <Input
              autoComplete="new-password"
              minLength={6}
              name="password"
              placeholder="Parol"
              required
              type="password"
            />
            <Button className="w-full" type="submit">
              Ro&apos;yxatdan o&apos;tish
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Account bormi?{" "}
            <Link className="font-semibold text-primary" href="/auth/login">
              Kirish
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
