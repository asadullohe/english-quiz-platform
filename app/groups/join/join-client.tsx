"use client";

import { useActionState, useEffect, useRef } from "react";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/lib/action-state";
import { joinGroupByInviteAction } from "../actions";

export function JoinGroupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    joinGroupByInviteAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.key, state.status]);

  return (
    <Card>
      <ActionToast state={state} />
      <CardHeader>
        <CardTitle>Invite code bilan qo&apos;shilish</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto]" ref={formRef}>
          <Input
            autoComplete="off"
            className="uppercase"
            maxLength={12}
            name="invite_code"
            placeholder="Masalan: A1B2C3"
            required
          />
          <Button disabled={isPending} type="submit">
            {isPending ? "Tekshirilmoqda" : "Qo'shilish"}
          </Button>
        </form>
        <p className="mt-3 text-sm text-muted-foreground">
          Code teacher bergan active group uchun ishlaydi.
        </p>
      </CardContent>
    </Card>
  );
}
