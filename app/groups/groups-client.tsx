"use client";

import { useActionState, useEffect, useId, useRef, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { ActionToast } from "@/components/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initialActionState, type ActionState } from "@/lib/action-state";
import {
  addMemberAction,
  createGroupAction,
  regenerateInviteAction,
  removeMemberAction,
  updateGroupAction,
} from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type GroupStatus = Database["public"]["Tables"]["groups"]["Row"]["status"];

export type GroupsProfile = {
  id: string;
  role: UserRole;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
};

export type LevelRow = {
  id: string;
  name: string;
};

export type GroupRow = {
  id: string;
  name: string;
  level_id: string | null;
  teacher_id: string;
  invite_code: string;
  invite_enabled: boolean;
  status: GroupStatus;
};

export type MemberRow = {
  id: string;
  group_id: string;
  user_id: string;
  role: "student" | "teacher" | "support_teacher";
};

type Option<T extends string = string> = {
  value: T;
  label: string;
};

const groupStatusOptions: Option<GroupStatus>[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const inviteOptions = [
  { value: "true", label: "Invite on" },
  { value: "false", label: "Invite off" },
];

const memberRoleOptions = [
  { value: "student", label: "Student" },
  { value: "support_teacher", label: "Support teacher" },
  { value: "teacher", label: "Teacher" },
];

function SelectField({
  defaultValue,
  form,
  name,
  options,
}: {
  defaultValue: string;
  form?: string;
  name: string;
  options: Option[];
}) {
  return (
    <select
      className="h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
      defaultValue={defaultValue}
      form={form}
      name={name}
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

function CreateGroupForm({
  levels,
  profile,
  teachers,
}: {
  levels: LevelRow[];
  profile: GroupsProfile;
  teachers: ProfileRow[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createGroupAction, initialActionState);

  useRefreshOnSuccess(state, formRef);

  return (
    <Card>
      <ActionToast state={state} />
      <CardHeader>
        <CardTitle>Yangi group</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="grid gap-3 md:grid-cols-[1fr_190px_220px_auto]"
          ref={formRef}
        >
          <Input name="name" placeholder="Group nomi" required />
          <SelectField
            defaultValue=""
            name="level_id"
            options={[
              { value: "", label: "Level yo'q" },
              ...levels.map((level) => ({ value: level.id, label: level.name })),
            ]}
          />
          {profile.role === "admin" ? (
            <SelectField
              defaultValue={teachers[0]?.id ?? ""}
              name="teacher_id"
              options={teachers.map((teacher) => ({
                value: teacher.id,
                label: teacher.full_name,
              }))}
            />
          ) : (
            <input name="teacher_id" type="hidden" value={profile.id} />
          )}
          <Button disabled={isPending} type="submit">
            {isPending ? "Yaratilmoqda" : "Yaratish"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InviteButton({ groupId }: { groupId: string }) {
  const formId = useId();
  const [state, formAction, isPending] = useActionState(
    regenerateInviteAction,
    initialActionState,
  );

  useRefreshOnSuccess(state);

  return (
    <>
      <ActionToast state={state} />
      <form action={formAction} id={formId}>
        <input name="group_id" type="hidden" value={groupId} />
      </form>
      <Button disabled={isPending} form={formId} size="sm" type="submit" variant="outline">
        {isPending ? "Yangilanmoqda" : "Invite yangilash"}
      </Button>
    </>
  );
}

function AddMemberForm({
  addableUsers,
  groupId,
}: {
  addableUsers: ProfileRow[];
  groupId: string;
}) {
  const [state, formAction, isPending] = useActionState(addMemberAction, initialActionState);

  useRefreshOnSuccess(state);

  return (
    <div className="rounded-2xl border p-4">
      <ActionToast state={state} />
      <p className="mb-3 text-sm font-bold">Member qo&apos;shish</p>
      <form action={formAction} className="grid gap-3 md:grid-cols-[1fr_190px_auto]">
        <input name="group_id" type="hidden" value={groupId} />
        <SelectField
          defaultValue={addableUsers[0]?.id ?? ""}
          name="user_id"
          options={addableUsers.map((user) => ({
            value: user.id,
            label: `${user.full_name} (${user.role})`,
          }))}
        />
        <SelectField defaultValue="student" name="role" options={memberRoleOptions} />
        <Button disabled={isPending} type="submit">
          {isPending ? "Qo'shilmoqda" : "Qo'shish"}
        </Button>
      </form>
    </div>
  );
}

function RemoveMemberButton({ groupId, memberId }: { groupId: string; memberId: string }) {
  const formId = useId();
  const [state, formAction, isPending] = useActionState(removeMemberAction, initialActionState);

  useRefreshOnSuccess(state);

  return (
    <>
      <ActionToast state={state} />
      <form action={formAction} id={formId}>
        <input name="member_id" type="hidden" value={memberId} />
        <input name="group_id" type="hidden" value={groupId} />
      </form>
      <Button disabled={isPending} form={formId} size="sm" type="submit" variant="outline">
        {isPending ? "Removing" : "Remove"}
      </Button>
    </>
  );
}

function GroupCard({
  addableUsers,
  group,
  levels,
  members,
  profilesById,
  levelsById,
}: {
  addableUsers: ProfileRow[];
  group: GroupRow;
  levels: LevelRow[];
  members: MemberRow[];
  profilesById: Map<string, ProfileRow>;
  levelsById: Map<string, LevelRow>;
}) {
  const formId = useId();
  const [state, formAction, isPending] = useActionState(updateGroupAction, initialActionState);
  const teacherName = profilesById.get(group.teacher_id)?.full_name ?? "Teacher yo'q";
  const levelName = group.level_id ? levelsById.get(group.level_id)?.name : "Level yo'q";

  useRefreshOnSuccess(state);

  return (
    <Card>
      <ActionToast state={state} />
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{group.name}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {teacherName} / {levelName}
            </p>
          </div>
          <div className="rounded-2xl border px-4 py-2 text-sm">
            <span className="font-bold">{group.invite_code}</span>
            <span className="ml-2 text-muted-foreground">
              {group.invite_enabled ? "open" : "off"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <form action={formAction} id={formId}>
          <input name="group_id" type="hidden" value={group.id} />
        </form>

        <div className="grid gap-3 md:grid-cols-[1fr_190px_150px_150px_auto]">
          <Input
            defaultValue={group.name}
            form={formId}
            name="name"
            placeholder="Group nomi"
            required
          />
          <SelectField
            defaultValue={group.level_id ?? ""}
            form={formId}
            name="level_id"
            options={[
              { value: "", label: "Level yo'q" },
              ...levels.map((level) => ({ value: level.id, label: level.name })),
            ]}
          />
          <SelectField
            defaultValue={group.status}
            form={formId}
            name="status"
            options={groupStatusOptions}
          />
          <SelectField
            defaultValue={String(group.invite_enabled)}
            form={formId}
            name="invite_enabled"
            options={inviteOptions}
          />
          <Button disabled={isPending} form={formId} type="submit">
            {isPending ? "Saving" : "Save"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <InviteButton groupId={group.id} />
        </div>

        <AddMemberForm addableUsers={addableUsers} groupId={group.id} />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">Member</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const memberProfile = profilesById.get(member.user_id);

                return (
                  <tr className="border-b last:border-0" key={member.id}>
                    <td className="py-3 pr-4">
                      <p className="font-bold">{memberProfile?.full_name ?? "User topilmadi"}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{member.role}</td>
                    <td className="py-3 pr-4">
                      <RemoveMemberButton groupId={group.id} memberId={member.id} />
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 ? (
                <tr>
                  <td className="py-4 text-muted-foreground" colSpan={3}>
                    Member yo&apos;q.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function GroupsClient({
  addableUsers,
  groups,
  levels,
  membersByGroup,
  profile,
  teachers,
  profiles,
}: {
  addableUsers: ProfileRow[];
  groups: GroupRow[];
  levels: LevelRow[];
  membersByGroup: Record<string, MemberRow[]>;
  profile: GroupsProfile;
  teachers: ProfileRow[];
  profiles: ProfileRow[];
}) {
  const profilesById = new Map(profiles.map((item) => [item.id, item]));
  const levelsById = new Map(levels.map((item) => [item.id, item]));

  return (
    <>
      <CreateGroupForm levels={levels} profile={profile} teachers={teachers} />

      <div className="grid gap-4">
        {groups.map((group) => (
          <GroupCard
            addableUsers={addableUsers}
            group={group}
            key={group.id}
            levels={levels}
            levelsById={levelsById}
            members={membersByGroup[group.id] ?? []}
            profilesById={profilesById}
          />
        ))}

        {groups.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Hali group yo&apos;q.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
