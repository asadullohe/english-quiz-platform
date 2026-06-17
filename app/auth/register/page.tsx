import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student account yaratish</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <Input placeholder="Ism familiya" />
            <Input placeholder="Email" type="email" />
            <Input placeholder="Parol" type="password" />
            <Button className="w-full" type="button">
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
