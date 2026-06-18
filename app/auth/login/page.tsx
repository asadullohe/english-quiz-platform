import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Kirish</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            {params?.error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {params.error}
              </p>
            ) : null}
            {params?.message ? (
              <p className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {params.message}
              </p>
            ) : null}
            <Input autoComplete="email" name="email" placeholder="Email" required type="email" />
            <Input
              autoComplete="current-password"
              name="password"
              placeholder="Parol"
              required
              type="password"
            />
            <Button className="w-full" type="submit">
              Kirish
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Account yo&apos;qmi?{" "}
            <Link className="font-semibold text-primary" href="/auth/register">
              Ro&apos;yxatdan o&apos;tish
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
