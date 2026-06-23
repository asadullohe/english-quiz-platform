# QuizUstoz Project Roadmap

Date: 2026-06-18

Purpose: current code state, missing work, and build order for next steps.

## 1. Current Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Supabase SSR session middleware
- Server Actions

## 2. Current Working Pieces

### App Shell

Status: mostly done.

- Landing page exists.
- Role dashboards exist:
  - `/dashboard/admin`
  - `/dashboard/teacher`
  - `/dashboard/support`
  - `/dashboard/student`
- Shared dashboard shell exists.
- Shared UI primitives exist:
  - `Button`
  - `Input`
  - `Card`
  - `StatCard`
  - `ActionToast`

Problems:

- Dashboard stats are hardcoded `0`.
- Logout button has no action.
- Notifications button has no behavior.

### Auth

Status: mostly done for MVP.

Done:

- Supabase browser/server clients exist.
- Middleware refreshes session.
- Login server action exists.
- Register server action exists.
- `/dashboard` redirects by profile role.
- Profile role/status check exists.
- Login/register use `useActionState` and toast feedback.
- Logout action exists and AppShell logout is wired.
- Active logged-in users are redirected away from login/register pages.
- Common Supabase auth errors are mapped to Uzbek messages.

Problems:

- Register creates only student flow.
- No password reset.
- No email confirmation UI state.
- No protected layout wrapper.
- No tests for role redirects.

Need next:

- Expand auth error mapping in Uzbek as more cases appear.
- Add password reset.
- Add explicit email confirmation UI state.
- Add tests for role redirects.

### Admin User Control

Status: usable MVP.

Done:

- `/admin/users` lists Supabase Auth users.
- Admin can create users.
- Admin can set role:
  - `student`
  - `teacher`
  - `support_teacher`
  - `admin`
- Admin can set status:
  - `active`
  - `disabled`
- Role/status auto-save on select change.
- Toast success/error.
- No message in URL.
- Current admin cannot demote/disable self.
- Missing profile can be repaired by changing role/status.

Problems:

- No search/filter.
- No pagination.
- No audit log.
- No delete/deactivate auth user.
- No invite email flow from app.
- Uses service role in server actions, correct but needs tests.

Need next:

- Add search by email/name.
- Add role/status filters.
- Add audit events table or `admin_user_events`.
- Add optional reset password/invite resend.

### Groups

Status: usable MVP.

Done:

- `/groups` lists groups.
- Admin sees all groups.
- Teacher sees own groups only.
- Admin can create group for selected teacher.
- Teacher can create own group.
- Group level can be set.
- Group status can be set:
  - `active`
  - `archived`
- Invite code visible.
- Invite can be on/off.
- Invite code can regenerate.
- Member can be added:
  - student
  - support teacher
  - teacher
- Member can be removed by setting status `removed`.
- Toast success/error.
- No message in URL.
- Student can join active groups by invite code.
- Students/support teachers can see their visible groups.
- Group detail route `/groups/[id]` exists.
- Members are shown grouped by role in group detail.
- Student dashboard has join group CTA.
- Basic group stats exist.

Problems:

- No member search.
- No duplicate member UI handling.
- No role-specific UI polish for students/support teachers.
- No hard delete/archive member history view.

Need next:

- Add member list filters.
- Add duplicate member UI handling.
- Polish role-specific group empty states.

### Database Schema

Status: broad MVP schema exists.

Tables exist:

- `profiles`
- `levels`
- `categories`
- `groups`
- `group_members`
- `media_assets`
- `question_assignments`
- `questions`
- `question_options`
- `question_text_answers`
- `question_tags`
- `question_review_events`
- `question_reports`
- `quiz_templates`
- `quiz_template_questions`
- `live_sessions`
- `session_question_pool`
- `participants`
- `attempts`
- `attempt_question_snapshots`
- `answers`
- `answer_review_events`
- `question_practice_history`
- `notifications`

Done:

- Initial migration exists.
- RLS enabled on app tables.
- Helper functions exist:
  - `is_admin`
  - `is_teacher`
  - `is_support_teacher`
  - `is_group_member`
  - `can_review_group`
  - `can_manage_group`
- Signup trigger creates student profile.
- Levels/categories seed exists.

Problems:

- `lib/supabase/database.types.ts` is incomplete. It only includes `profiles`, `groups`, `notifications`.
- Because DB types are incomplete, several admin/group queries use manual casts or untyped admin client.
- No local Supabase CLI installed.
- No automated migration verification.
- No RLS tests.

Need next:

- Generate full Supabase TypeScript types.
- Add typed service wrappers.
- Add RLS smoke tests.

## 3. Placeholder / Not Implemented Modules

### Assignments

Route: `/assignments`

Status: placeholder only.

Need:

- Teacher/support create assignment.
- Choose group.
- Choose topic.
- Choose level/category.
- Set questions per student.
- Set deadline.
- Track student progress.
- Change status:
  - `open`
  - `reviewing`
  - `ready`
  - `used`
  - `archived`

### Student Question Creation

Status: not implemented.

Need:

- Student sees active assignments.
- Student submits required number of questions.
- Support answer types:
  - single choice
  - text answer
- Add options.
- Mark correct option.
- Add acceptable text answers.
- Add tags.
- Add optional media.
- Save draft.
- Submit for review.

### Review Queue

Route: `/review/questions`

Status: placeholder only.

Need:

- Teacher/support sees pending questions by assigned groups.
- Review actions:
  - approve
  - needs changes
  - reject
  - flag
  - archive
- Edit question content.
- Add internal/student-visible comments.
- Write `question_review_events`.
- Notify student.

### Question Bank

Route: `/question-bank`

Status: placeholder only.

Need:

- List approved questions.
- Filter by level/category/tags.
- Filter public/group_only.
- Exclude own questions where needed.
- Show source group/assignment.
- Show media badges.

### Quiz Builder

Route: `/quizzes`

Status: placeholder only.

Need:

- Teacher creates quiz template.
- Pick questions from assignment approved set.
- Search question bank.
- Reorder questions.
- Set duration.
- Set feedback mode.
- Save draft/active/archive.

### Live Sessions

Route: `/sessions`

Status: placeholder only.

Need:

- Create live session from quiz template.
- Waiting room.
- Session code.
- Participant list.
- Manual start.
- Freeze question order into snapshots.
- Late join with remaining time.
- End session.
- Remove participant.
- Realtime or polling progress.

### Quiz Taking

Status: not implemented.

Need:

- Student joins session.
- Student answers questions.
- Timer.
- Auto-submit on timeout.
- Retry wrong questions if configured.
- Save answers.
- Prevent duplicate submit.

### Results / Analytics

Status: not implemented.

Need:

- Per-student result.
- Per-question stats.
- Correct/wrong counts.
- Teacher session report.
- CSV export.
- Answer review events.

### Self Practice

Route: `/self-practice`

Status: placeholder only.

Need:

- Student selects level/category.
- Random 5-20 approved questions.
- Exclude student's own questions.
- Save practice history.
- Retry wrong questions.
- Show accuracy.

### Reports / Moderation

Route: `/review/reports`

Status: placeholder only.

Need:

- Student reports question.
- Teacher/support/admin sees open reports.
- Actions:
  - dismiss
  - fixed
  - archive
- Optional flag question.

### Notifications

Status: DB table exists, UI not implemented.

Need:

- Create notifications in server actions.
- List unread notifications.
- Mark read.
- Realtime subscribe or polling.
- AppShell notification count.

### Media Upload

Status: schema only.

Need:

- Upload image/audio.
- Validate file type and size.
- Store in Supabase Storage.
- Save `media_assets`.
- Attach media to questions.

## 4. Technical Debt

- README is stale. It says login/register and groups are not wired, but now partially wired.
- `database.types.ts` incomplete.
- Auth actions still use URL query messages.
- AppShell logout button is fake.
- Dashboard stat cards are hardcoded.
- No tests.
- No error boundary.
- No loading skeletons.
- No empty-state polish for most modules.
- No pagination.
- No audit trail.
- `tsconfig.tsbuildinfo` is tracked and changes during typecheck/build.

## 5. Recommended Build Order

### Step 1. Clean Auth

Goal: make login/register/logout production-shaped.

Tasks:

- Convert login/register to `useActionState`.
- Show auth errors in toast.
- Remove auth message/error from URL.
- Add logout action.
- Wire AppShell logout button.
- Redirect logged-in user away from auth pages.

Done when:

- Bad login shows toast.
- Good login redirects to correct dashboard.
- Logout clears session.
- URL has no `message` or `error` params after submit.

### Step 2. Finish Groups MVP

Goal: make classroom membership usable.

Tasks:

- Add join-by-invite page/form for students.
- Add group detail route `/groups/[id]`.
- Show members grouped by role.
- Add student dashboard "join group" CTA.
- Add group stats.

Done when:

- Teacher creates group.
- Student enters invite code.
- Student becomes active group member.
- Teacher sees student in group detail.

### Step 3. Assignment Creation

Goal: teacher gives task to group.

Tasks:

- Build `/assignments` real page.
- Create assignment action.
- List assignments by role.
- Show assignment status.
- Add deadline display.

Done when:

- Teacher creates assignment for group.
- Student sees assignment.
- Support teacher sees assignment for assigned group.

### Step 4. Student Question Submission

Goal: student submits questions for assignment.

Tasks:

- Build question editor.
- Single-choice editor.
- Text-answer editor.
- Draft save.
- Submit for review.
- Assignment progress count.

Done when:

- Student submits required question count.
- Questions enter `pending_review`.

### Step 5. Review Queue

Goal: teacher/support approves questions.

Tasks:

- Pending queue.
- Question preview/editor.
- Approve/needs changes/reject actions.
- Review comments.
- Events timeline.
- Notifications.

Done when:

- Approved questions appear in question bank.
- Needs changes returns question to student.

### Step 6. Question Bank

Goal: approved questions searchable.

Tasks:

- Filters.
- Search.
- Visibility badge.
- Source badge.
- Media badge.

Done when:

- Teacher can find approved questions for quiz builder.
- Student self practice can query approved public questions.

### Step 7. Quiz Builder

Goal: teacher builds reusable quiz template.

Tasks:

- Create template.
- Select/reorder questions.
- Duration and feedback mode.
- Activate/archive.

Done when:

- Active quiz template can start live session.

### Step 8. Live Session

Goal: classroom quiz works.

Tasks:

- Create session from template.
- Waiting room.
- Join by code.
- Start action freezes question snapshots.
- Timer.
- Participant progress.
- End action.

Done when:

- Teacher starts session.
- Student joins and submits answers.
- Session result is saved.

### Step 9. Results + Analytics

Goal: teacher sees outcomes.

Tasks:

- Student result page.
- Teacher session report.
- Question analytics.
- CSV export.

Done when:

- Teacher exports CSV.
- Question correct rate visible.

### Step 10. Self Practice

Goal: student practices outside classroom.

Tasks:

- Random approved questions.
- Filters.
- Exclude own questions.
- Save history.
- Wrong retry.

Done when:

- Student completes self practice and sees accuracy.

### Step 11. Notifications

Goal: users see important events.

Tasks:

- Notification service helper.
- Create notification in review/group/session events.
- AppShell unread count.
- Mark read.
- Realtime or polling.

Done when:

- Student gets review result notification.
- Teacher gets report/submission notification.

### Step 12. Tests + Hardening

Goal: stop regressions.

Tasks:

- RLS tests.
- Server action tests where possible.
- Role access smoke tests.
- Build/lint/typecheck CI.
- Manual QA checklist.

Done when:

- Admin cannot leak service-role to client.
- Student cannot read other groups.
- Teacher cannot manage other teacher's group.
- Build passes clean.

## 6. Next Immediate Task

Start with Step 3: Assignment Creation.

Reason:

- Auth cleanup and group membership MVP are complete for the current baseline.
- Assignments are the next product link between teachers, groups, and student question submissions.
- Student question creation needs assignments to exist first.

Suggested first file targets:

- `app/assignments/page.tsx`
- new `app/assignments/actions.ts`
- new `app/assignments/assignments-client.tsx`
- `lib/supabase/database.types.ts`

## 7. Current Verification Commands

Run after each step:

```bash
pnpm typecheck
pnpm lint
pnpm build
```
