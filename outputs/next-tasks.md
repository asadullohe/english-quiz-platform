# QuizUstoz Next Tasks

## Active

- [ ] Step 10: Self Practice

## Step 1: Clean Auth

- [x] Convert `loginAction` to `useActionState` shape.
- [x] Convert `registerAction` to `useActionState` shape.
- [x] Replace URL query auth messages with `ActionToast`.
- [x] Add `logoutAction`.
- [x] Wire AppShell logout button.
- [x] Redirect active logged-in users away from auth pages.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build`.

## Step 2: Finish Groups MVP

- [x] Add student join-by-invite flow.
- [x] Add `/groups/[id]` detail route.
- [x] Show group members grouped by role.
- [x] Add student dashboard join group CTA.
- [x] Add group stats.

## Step 3: Assignment Creation

- [x] Build `/assignments` real page.
- [x] Add create assignment action.
- [x] List assignments by role.
- [x] Show assignment status.
- [x] Add deadline display.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build`.

## Step 4: Student Question Submission

- [x] Add assignment detail or submission route.
- [x] Build question editor shell.
- [x] Support `single_choice` questions.
- [x] Support `text` answer questions.
- [x] Save draft questions.
- [x] Submit questions for review.
- [x] Show assignment progress against required count.

## Step 5: Review Queue

- [x] Replace `/review/questions` placeholder with real queue.
- [x] List pending questions by reviewer-visible groups.
- [x] Show question prompt, options/text answers, tags, and explanation.
- [x] Add approve action.
- [x] Add needs changes action with required comment.
- [x] Add reject action with required comment.
- [x] Write `question_review_events`.
- [x] Make approved questions available for question bank queries.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build`.

## Step 6: Question Bank

- [x] Replace `/question-bank` placeholder with approved question list.
- [x] Filter by level/category.
- [x] Show public/group-only visibility.
- [x] Show source group/assignment.
- [x] Show options/text answers.
- [x] Show media badges placeholder.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build`.

## Step 7: Quiz Builder

- [x] Replace `/quizzes` placeholder with quiz template list.
- [x] Add quiz template create action.
- [x] Pick questions from approved question bank.
- [x] Set duration and question count.
- [x] Set feedback mode.
- [x] Save template as draft/active/archive.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build`.

## Step 8: Live Session

- [x] Replace `/sessions` placeholder with live session list/create UI.
- [x] Create session from active quiz template.
- [x] Generate join code.
- [x] Add waiting/live/ended status controls.
- [x] Freeze selected template questions into session question pool.
- [x] Show participant placeholder/progress shell.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build`.

## Step 8b: Quiz Taking Runtime

- [x] Add join-by-session-code route.
- [x] Add account participant join.
- [x] Add guest participant join when allowed.
- [x] Create live attempt from frozen session pool.
- [x] Render question-taking UI.
- [x] Save answers.
- [x] Submit attempt.
- [x] Prevent duplicate submit.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build`.

## Step 9: Results + Analytics

- [x] Add session report route or section.
- [x] Show participant results.
- [x] Show correct/wrong/skipped counts.
- [x] Show per-question accuracy.
- [x] Show student own submitted attempt result.
- [x] Add CSV export placeholder or server route.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm build`.

## Step 10: Self Practice

- [ ] Replace `/self-practice` placeholder with practice setup.
- [ ] Select level/category.
- [ ] Generate random approved public questions.
- [ ] Exclude own questions where needed.
- [ ] Create self-practice attempt.
- [ ] Render practice taking UI.
- [ ] Save practice history.
- [ ] Show accuracy after submit.

## Later

- [ ] Step 11: Notifications.
