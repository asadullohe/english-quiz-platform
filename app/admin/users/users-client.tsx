"use client";

import { useActionState, useEffect, useId, useRef, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { initialActionState, type ActionState } from "@/lib/action-state";
import type { Database } from "@/lib/supabase/database.types";
import { createUserAction, updateUserAction } from "./actions";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type UserStatus = Database["public"]["Tables"]["profiles"]["Row"]["status"];

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  hasProfile: boolean;
  isCurrentUser: boolean;
};

type Option<T extends string = string> = {
  value: T;
  label: string;
};

const roleOptions: Option<UserRole>[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "support_teacher", label: "Support teacher" },
  { value: "admin", label: "Admin" },
];

const statusOptions: Option<UserStatus>[] = [
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

function SelectField({
  defaultValue,
  disabled,
  form,
  name,
  onChange,
  options,
}: {
  defaultValue: string;
  disabled?: boolean;
  form?: string;
  name: string;
  onChange?: () => void;
  options: Option[];
}) {
  return (
    <select
      className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
      defaultValue={defaultValue}
      disabled={disabled}
      form={form}
      name={name}
      onChange={onChange}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function useRefreshOnSuccess(
  state: ActionState,
  formRef?: RefObject<HTMLFormElement | null>,
) {
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    formRef?.current?.reset();
    router.refresh();
  }, [formRef, router, state.key, state.status]);
}

function CreateUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createUserAction, initialActionState);

  useRefreshOnSuccess(state, formRef);

  return (
    <Card>
      <ActionToast state={state} />
      <CardHeader>
        <CardTitle>Yangi user</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_180px_auto]"
          ref={formRef}
        >
          <Input name="full_name" placeholder="Ism familiya" required />
          <Input name="email" placeholder="Email" required type="email" />
          <Input minLength={6} name="password" placeholder="Vaqtinchalik parol" required />
          <SelectField defaultValue="teacher" name="role" options={roleOptions} />
          <Button disabled={isPending} type="submit">
            {isPending ? "Yaratilmoqda" : "Yaratish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function UserTableRow({ user }: { user: AdminUserRow }) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(updateUserAction, initialActionState);

  useRefreshOnSuccess(state);

  function submitChange() {
    formRef.current?.requestSubmit();
  }

  return (
    <tr className="border-b last:border-0">
      <td className="py-4 pr-4">
        <ActionToast state={state} />
        <form action={formAction} className="hidden" id={formId} ref={formRef}>
          <input name="user_id" type="hidden" value={user.id} />
        </form>
        <p className="font-bold">{user.fullName}</p>
        <p className="text-muted-foreground">{user.email}</p>
        {!user.hasProfile ? (
          <p className="mt-1 text-xs font-semibold text-destructive">
            Profile yo&apos;q. O&apos;zgartirilsa tiklanadi.
          </p>
        ) : null}
        {user.isCurrentUser ? (
          <p className="mt-1 text-xs font-semibold text-primary">Siz</p>
        ) : null}
        <span
          className={cn(
            "mt-2 inline-flex h-6 items-center rounded-full px-2 text-xs font-bold",
            isPending
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isPending ? "Saving..." : "Auto-save"}
        </span>
      </td>
      <td className="py-4 pr-4">
        <SelectField
          defaultValue={user.role}
          disabled={isPending}
          form={formId}
          name="role"
          onChange={submitChange}
          options={roleOptions}
        />
      </td>
      <td className="py-4 pr-4">
        <SelectField
          defaultValue={user.status}
          disabled={isPending}
          form={formId}
          name="status"
          onChange={submitChange}
          options={statusOptions}
        />
      </td>
      <td className="py-4 pr-4 text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString("uz-UZ")}
      </td>
    </tr>
  );
}

export function UsersClient({ rows }: { rows: AdminUserRow[] }) {
  return (
    <>
      <CreateUserForm />

      <Card>
        <CardHeader>
          <CardTitle>User control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <UserTableRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
