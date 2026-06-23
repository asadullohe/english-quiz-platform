"use client";

import { useEffect, useState } from "react";
import type { ActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

export function ActionToast({ state }: { state: ActionState }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state.status === "idle" || !state.message) {
      return;
    }

    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [state.key, state.message, state.status]);

  if (!visible || state.status === "idle") {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-40px))] rounded-2xl border px-4 py-3 text-sm font-semibold shadow-soft backdrop-blur",
        state.status === "success"
          ? "border-primary/25 bg-primary/95 text-primary-foreground"
          : "border-destructive/30 bg-destructive/95 text-destructive-foreground",
      )}
      role="status"
    >
      {state.message}
    </div>
  );
}
