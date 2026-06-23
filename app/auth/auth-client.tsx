"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/lib/action-state";
import { loginAction, registerAction } from "./actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialActionState);

  return (
    <>
      <ActionToast state={state} />
      <form action={formAction} className="space-y-4">
        <Input autoComplete="email" name="email" placeholder="Email" required type="email" />
        <Input
          autoComplete="current-password"
          name="password"
          placeholder="Parol"
          required
          type="password"
        />
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Kirilmoqda" : "Kirish"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Account yo&apos;qmi?{" "}
        <Link className="font-semibold text-primary" href="/auth/register">
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </p>
    </>
  );
}

export function RegisterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(registerAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.key, state.status]);

  return (
    <>
      <ActionToast state={state} />
      <form action={formAction} className="space-y-4" ref={formRef}>
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
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Yaratilmoqda" : "Ro'yxatdan o'tish"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Account bormi?{" "}
        <Link className="font-semibold text-primary" href="/auth/login">
          Kirish
        </Link>
      </p>
    </>
  );
}
