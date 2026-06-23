"use client";

import { useActionState } from "react";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/lib/action-state";
import { joinLiveSessionAction } from "./actions";

export function JoinSessionForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [state, formAction, isPending] = useActionState(joinLiveSessionAction, initialActionState);

  return (
    <Card>
      <ActionToast state={state} />
      <CardHeader>
        <CardTitle>Session code</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3">
          <Input
            autoComplete="off"
            className="uppercase"
            maxLength={12}
            name="join_code"
            placeholder="Masalan: A1B2C3"
            required
          />
          {!isLoggedIn ? (
            <Input autoComplete="name" name="guest_name" placeholder="Guest name" />
          ) : null}
          <Button disabled={isPending} type="submit">
            {isPending ? "Kirilmoqda" : "Sessionga kirish"}
          </Button>
        </form>
        <p className="mt-3 text-sm text-muted-foreground">
          Account bilan kirsangiz group membership tekshiriladi. Guest faqat teacher ruxsat bersa
          ishlaydi.
        </p>
      </CardContent>
    </Card>
  );
}
