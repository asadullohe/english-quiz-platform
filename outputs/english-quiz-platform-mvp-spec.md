# English Quiz Platform MVP Spec

## Product Summary

Uzbek tilida ingliz tili o'rganayotganlar uchun quiz platforma. Asosiy loop:

1. Teacher/support teacher groupga mavzu beradi.
2. Studentlar belgilangan mavzu bo'yicha savollar kiritadi.
3. Teacher/support teacher savollarni review qiladi.
4. Approved savollardan teacher live classroom quiz yaratadi.
5. Studentlar quizni ishlaydi.
6. Result, xato/tog'ri javoblar va question analytics chiqadi.

Asosiy differentiator: studentlar faqat quiz ishlamaydi, o'zlari ham quiz bank yaratishga qatnashadi.

## Tech Stack

- Frontend: Next.js
- UI: shadcn/ui + Tailwind CSS
- Backend/DB/Auth: Supabase
- Auth: Supabase Auth
- Realtime: Supabase Realtime
- Storage: Supabase Storage yoki S3/R2 style object storage
- UI language: full Uzbek

## Roles

### Admin

- All-access.
- Teacher/support teacher account yaratadi.
- User role/status boshqaradi.
- Admin panel alohida UI bo'ladi.

### Teacher

- Group yaratadi.
- Support teacher biriktiradi.
- Assignment beradi.
- Approved questions'dan quiz/session yaratadi.
- Live session start/end qiladi.
- Reports, analytics, CSV export ko'radi.
- Teacher-created questions review'siz approved bo'ladi.

### Support Teacher

- Assigned groups ichida submissions review qiladi.
- Reported questions review qiladi.
- Groupni boshqarishda teacherga yordam beradi.
- Group yaratmaydi.
- O'z yaratgan savolini o'zi approve qila olmaydi.

### Student

- Account bilan kiradi.
- Invite code orqali groupga qo'shiladi.
- Assignment bo'yicha savol yaratadi.
- Live quiz ishlaydi.
- Self practice qiladi.
- O'z resultlari va contribution statusini ko'radi.

### Guest

- Role emas.
- Faqat teacher `allowGuests` yoqsa live sessionga name bilan kira oladi.
- Guest result session reportda saqlanadi, lekin profile/history bo'lmaydi.

## Levels

MVP fixed list:

- Beginner
- Elementary
- Pre-Intermediate
- Intermediate
- Upper-Intermediate
- IELTS

Custom level later.

## Categories

MVP fixed categories:

- Grammar
- Vocabulary
- Listening
- Reading
- Writing
- IELTS

Tags optional bo'ladi:

- present-simple
- irregular-verbs
- food
- travel
- ielts-listening-section-1

## Question Types

Answer format:

- `single_choice`
- `text`

Media optional:

- image
- audio

Shuning uchun listening/image-based alohida answer type emas. Masalan:

- audio + single choice = listening choice
- audio + text = listening written answer
- image + single choice = image-based choice
- image + text = image-based text

Text answer normalization:

- lowercase
- trim
- multiple spaces collapse
- punctuation ignore qilinmaydi

Close-enough/AI grading MVP'da yo'q.

## Media Upload

MVP:

- Image: jpg, png, webp
- Audio: mp3, wav, m4a
- Image max: 5MB
- Audio max: 10MB
- Audio max duration: 2 minutes
- TTS later

## Groups

Teacher/admin group yaratadi.

Student groupga classroom invite code bilan qo'shiladi.

Invite code:

- Doimiy.
- Teacher regenerate qila oladi.
- Group archived bo'lsa ishlamaydi.
- Student join qilganda darhol active bo'ladi.
- Later pending approval qo'shilishi mumkin.

## Assignments

Teacher/support teacher groupga assignment beradi.

Assignment fields:

- title
- topic
- group
- level
- category
- questionsPerStudent
- deadline
- status

Student assignment ichida required count bo'yicha savol submit qiladi.

Student completion:

- completed bo'lishi uchun required approved count yetishi kerak.
- quizga qo'shish uchun esa individual approved question yetarli.

Deadline:

- deadline'dan keyin submit yopiladi.
- teacher/support deadline extend qila oladi.
- late approved questions oldin yaratilgan quiz/sessionga avtomatik qo'shilmaydi.

## Review Workflow

Question status:

- draft
- pending_review
- needs_changes
- approved
- rejected
- flagged
- archived

Rules:

- Student submission support/teacher review queue'ga tushadi.
- Support teacher approve qilsa final approved.
- Support teacher o'z savolini o'zi approve qila olmaydi.
- Support-created questions teacher review qiladi.
- Teacher-created questions approved immediately.
- Reviewer kichik xatoni edit qilib approve qila oladi.
- Katta xatoda comment bilan needs_changes/rejected qiladi.
- needs_changes/rejected comment required.

Review comments:

- Student-visible comments bor.
- Internal reviewer notes alohida bo'lishi mumkin.

Review history:

- event log saqlanadi: submitted, edited, commented, approved, rejected, needs_changes.
- Full field-level diff MVP'da shart emas.

Approved question:

- Student qayta edit qila olmaydi.
- Kerak bo'lsa duplicate/new submission qiladi.

## Question Bank

Approved questions reusable bankka tushadi.

Visibility:

- `public`
- `group_only`

Default:

- approved questions public self practice bankda ko'rinadi.
- teacher assignment setting bilan public sharingni o'chirishi mumkin.

Student creator public bankda anonymous bo'ladi.
Teacher/reviewer creatorni ichkarida ko'radi.

Reported questions:

- Student ham report qila oladi.
- Report comment required.
- Report reviewer queue'ga tushadi.
- Critical wrong-answer report bo'lsa savol self practice'dan hide qilinishi mumkin.
- Creatorga notification faqat action bo'lsa boradi.

## Quiz Templates

Quiz template teacher/group private.

Fields:

- title
- description
- cover image
- level
- category
- selected questions
- question count per participant
- duration
- feedback settings

Template sharing global emas. Global sharing later.

Quiz builder:

- default assignment approved questions ko'rsatadi.
- global approved bankdan ham savol qo'shish mumkin.
- teacher manual select qiladi.
- `select all approved` button bo'ladi.
- filters: assignment, level, category, tags, type, media, search.

## Live Classroom Quiz

Main MVP feature.

Session status:

- waiting
- live
- ended

Waiting room:

- teacher session yaratadi.
- join code chiqadi.
- studentlar waiting roomga kiradi.
- teacher participant list/progress ko'radi.
- teacher participantni remove/kick qila oladi.

Start:

- teacher manual Start bosadi.
- scheduled sessions later.
- start vaqtida snapshot/freeze bo'ladi.

Session startda locked:

- question content
- options
- correct answers
- points
- selected question pool
- participant-specific random question order
- option order

Live rules:

- session live bo'lgandan keyin config locked.
- late join allowed, qolgan vaqt bilan.
- late participant uchun question set join vaqtida generate qilinadi.
- enough questions bo'lmasa join denied.
- teacher manual End qila oladi.
- hamma submitted bo'lsa teacherga "All submitted, end now?" prompt chiqadi, auto end qilinmaydi.

Guest:

- teacher setting `allowGuests`.
- default off for group classroom.
- guest name session ichida unique.
- guest result reportda guest badge bilan chiqadi.
- guest score group analyticsdan alohida ko'rinadi.

Navigation:

- Student current questionga javob beradi yoki skip qiladi.
- `Keyingisi` bosadi.
- Javob berilgan savol locked bo'ladi.
- Skipped savol keyin qayta keladi.
- Hamma savol answered bo'lmaguncha cycle davom etadi yoki time tugaydi.
- Classroom live quizda retry yo'q.

Feedback:

- Classroom default: feedback after finish.
- Teacher setting bilan instant feedback yoqilishi mumkin.
- If instant feedback on:
  - correct modal
  - wrong modal
  - wrong answer qizil, correct answer yashil

Correct answers after finish:

- default ko'rinadi.
- teacher setting bilan hide qilishi mumkin.

Own questions:

- Student o'zi yaratgan savolni live quizda ko'rmaydi.
- enough questions validation bo'ladi.

Randomization:

- questions random per participant.
- options random per participant.
- random order frozen.

Timer:

- server authoritative.
- frontend timer display only.
- time tugasa unanswered score 0, reportda skipped.

## Self Practice

Logged-in studentlar uchun group shart emas.

Question bankdan random practice:

- level filter
- category filter
- default max 20
- min 5
- available 5-19 bo'lsa borini beradi
- 5 dan kam bo'lsa boshqa filter taklif qiladi
- student o'zi yaratgan savollar excluded

Selection priority:

1. unseen questions
2. previously wrong questions
3. old questions
4. recently correct questions

Self scoring:

- point yo'q.
- accuracy percent.
- first-try correct alohida.
- retry correct alohida.
- final correct alohida.

Retry:

- allowRetry teacher/global setting bo'lishi mumkin.
- self quizda wrong questions birinchi passdan keyin qayta beriladi.
- har wrong question uchun faqat 1 retry.
- retryda ham wrong bo'lsa final wrong.

Self practice result:

- wrong questions review qilinadi.
- student answer qizil.
- correct answer yashil.
- explanation ko'rinadi.
- media replay bo'ladi.

## Attempts And Snapshots

`attempts` va `answers` live va self practice uchun umumiy bo'ladi.

Attempt:

- attempt_type: live | self_practice
- user_id
- participant_id optional
- live_session_id optional
- status
- started_at
- submitted_at

Har attempt uchun question snapshots bo'ladi:

- original_question_id
- prompt_snapshot
- options_snapshot
- correct_answer_snapshot
- explanation_snapshot
- image_asset_id
- audio_asset_id
- points_snapshot
- order_index

Sabab: question keyin edit bo'lsa eski result buzilmasin.

## Scoring

Question points:

- default 1
- teacher/support reviewda oshirishi mumkin
- max recommended 10
- points session/attempt snapshotda freeze qilinadi

Live quiz:

- earned points / total points
- skipped = 0

Self practice:

- points ishlatilmaydi
- accuracy percent ishlatiladi

Manual correction:

- teacher/support text answersni resultdan keyin review qila oladi.
- final score/result o'zgarsa studentga notification boradi.
- answer review event audit saqlanadi.

## Results And Analytics

Student result:

- faqat o'z resultini ko'radi.
- correct/wrong/skipped.
- wrong answer qizil.
- correct answer yashil.
- explanation.
- teacher hide correct answers setting qo'yishi mumkin.

Teacher report:

- all students + guests
- score
- percent
- answered/skipped
- time
- per-question analytics:
  - correctCount
  - wrongCount
  - skippedCount
  - correctRate
  - most common wrong answer

Student leaderboard:

- studentlarga ko'rsatilmaydi.
- teacher full report ko'radi.

Export:

- MVP CSV export bor.

## Notifications

MVP: in-app realtime notification.

Supabase:

- notifications table
- RLS
- Supabase Realtime subscribe

No email/SMS in MVP.

Notification events:

- assignment_created
- question_needs_changes
- question_approved
- question_rejected
- question_reported
- session_started
- session_ended
- answer_review_changed_result

Notification fields:

- userId
- type
- title
- body
- linkUrl
- readAt
- createdAt

## Auth

Supabase Auth.

Profiles table:

- id references auth.users
- full_name
- role
- status
- created_at

Account creation:

- student self-register allowed.
- student invite code orqali register/login qilib groupga join qiladi.
- teacher/support/admin admin panel orqali qo'lda yaratiladi.
- teacher signup public emas.

Guest:

- Supabase Auth user emas.
- live session participant only.

## RLS And Permissions

All tables RLS enabled.

Recommended helper functions:

- is_admin()
- is_teacher()
- is_support_for_group(group_id)
- is_teacher_for_group(group_id)
- is_group_member(group_id)

Support teacher:

- faqat assigned groups ko'radi.

Student:

- o'z profile, groups, assignments, attempts, notifications.
- approved public question bank.

Teacher:

- own groups.
- assigned support teachers.
- group assignments/submissions/sessions/results.

Admin:

- all access.

## Database Schema Plan

Recommended Postgres/Supabase schema. Exact column types migration yozishda aniqlanadi, lekin MVP uchun table boundaries shular bo'lsin.

### Auth And Profiles

`auth.users` Supabase managed table.

`profiles`

- `id uuid primary key references auth.users(id)`
- `full_name text not null`
- `role user_role not null`
- `status user_status not null default 'active'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Enums:

- `user_role`: student, teacher, support_teacher, admin
- `user_status`: active, disabled

### Static Reference Tables

`levels`

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `order_index int not null`
- `is_active boolean not null default true`

`categories`

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `order_index int not null`
- `is_active boolean not null default true`

Seed values:

- levels: Beginner, Elementary, Pre-Intermediate, Intermediate, Upper-Intermediate, IELTS
- categories: Grammar, Vocabulary, Listening, Reading, Writing, IELTS

### Groups

`groups`

- `id uuid primary key`
- `name text not null`
- `level_id uuid references levels(id)`
- `teacher_id uuid not null references profiles(id)`
- `invite_code text unique not null`
- `invite_enabled boolean not null default true`
- `status group_status not null default 'active'`
- `archived_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`group_members`

- `id uuid primary key`
- `group_id uuid not null references groups(id)`
- `user_id uuid not null references profiles(id)`
- `role group_member_role not null`
- `joined_at timestamptz not null default now()`
- `status group_member_status not null default 'active'`

Constraints:

- unique `(group_id, user_id)`
- support teacher assignment lives here as `role = support_teacher`

Enums:

- `group_status`: active, archived
- `group_member_role`: student, teacher, support_teacher
- `group_member_status`: active, removed

### Media

`media_assets`

- `id uuid primary key`
- `uploaded_by_user_id uuid references profiles(id)`
- `type media_type not null`
- `storage_path text not null`
- `public_url text`
- `mime_type text not null`
- `size_bytes bigint not null`
- `duration_seconds int`
- `created_at timestamptz not null default now()`

Enum:

- `media_type`: image, audio

### Assignments

`question_assignments`

- `id uuid primary key`
- `group_id uuid not null references groups(id)`
- `created_by_user_id uuid not null references profiles(id)`
- `title text not null`
- `topic text not null`
- `level_id uuid references levels(id)`
- `category_id uuid references categories(id)`
- `questions_per_student int not null`
- `deadline_at timestamptz`
- `share_approved_to_public_bank boolean not null default true`
- `status assignment_status not null default 'open'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Enum:

- `assignment_status`: open, reviewing, ready, used, archived

Student completion can be computed from approved question count per assignment/student. If performance becomes issue, add cached progress table later.

### Questions

`questions`

- `id uuid primary key`
- `created_by_user_id uuid not null references profiles(id)`
- `source_assignment_id uuid references question_assignments(id)`
- `source_group_id uuid references groups(id)`
- `level_id uuid references levels(id)`
- `category_id uuid references categories(id)`
- `answer_type answer_type not null`
- `prompt text not null`
- `explanation text`
- `image_asset_id uuid references media_assets(id)`
- `audio_asset_id uuid references media_assets(id)`
- `points int not null default 1`
- `visibility question_visibility not null default 'public'`
- `status question_status not null default 'draft'`
- `approved_by_user_id uuid references profiles(id)`
- `approved_at timestamptz`
- `archived_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`question_options`

- `id uuid primary key`
- `question_id uuid not null references questions(id)`
- `text text not null`
- `is_correct boolean not null default false`
- `order_index int not null`
- `created_at timestamptz not null default now()`

`question_text_answers`

- `id uuid primary key`
- `question_id uuid not null references questions(id)`
- `answer_text text not null`
- `normalized_answer text not null`
- `created_at timestamptz not null default now()`

`question_tags`

- `id uuid primary key`
- `question_id uuid not null references questions(id)`
- `tag text not null`

Constraints:

- `points >= 1 and points <= 10`
- single choice questions need at least 2 options and exactly 1 correct option, enforced in service layer first; DB trigger later optional.
- text questions need at least 1 accepted answer, enforced in service layer first.
- unique `(question_id, tag)`

Enums:

- `answer_type`: single_choice, text
- `question_visibility`: public, group_only
- `question_status`: draft, pending_review, needs_changes, approved, rejected, flagged, archived

### Review And Reports

`question_review_events`

- `id uuid primary key`
- `question_id uuid not null references questions(id)`
- `actor_id uuid not null references profiles(id)`
- `event_type review_event_type not null`
- `comment text`
- `visibility review_comment_visibility not null default 'student_visible'`
- `created_at timestamptz not null default now()`

`question_reports`

- `id uuid primary key`
- `question_id uuid not null references questions(id)`
- `reporter_id uuid references profiles(id)`
- `reason question_report_reason not null`
- `comment text not null`
- `status report_status not null default 'open'`
- `resolved_by_user_id uuid references profiles(id)`
- `resolved_at timestamptz`
- `created_at timestamptz not null default now()`

Enums:

- `review_event_type`: submitted, edited, commented, approved, needs_changes, rejected, flagged, archived
- `review_comment_visibility`: student_visible, internal
- `question_report_reason`: wrong_answer, unclear, typo, inappropriate, wrong_level, other
- `report_status`: open, dismissed, fixed, archived

### Quiz Templates

`quiz_templates`

- `id uuid primary key`
- `created_by_user_id uuid not null references profiles(id)`
- `group_id uuid references groups(id)`
- `title text not null`
- `description text`
- `cover_image_asset_id uuid references media_assets(id)`
- `level_id uuid references levels(id)`
- `category_id uuid references categories(id)`
- `question_count_per_participant int not null`
- `duration_minutes int not null`
- `feedback_mode feedback_mode not null default 'after_finish'`
- `show_correct_answers_after_finish boolean not null default true`
- `allow_guests boolean not null default false`
- `status quiz_template_status not null default 'draft'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`quiz_template_questions`

- `id uuid primary key`
- `quiz_template_id uuid not null references quiz_templates(id)`
- `question_id uuid not null references questions(id)`
- `order_index int`
- `created_at timestamptz not null default now()`

Constraints:

- unique `(quiz_template_id, question_id)`

Enums:

- `feedback_mode`: instant, after_finish
- `quiz_template_status`: draft, active, archived

### Live Sessions

`live_sessions`

- `id uuid primary key`
- `quiz_template_id uuid references quiz_templates(id)`
- `group_id uuid references groups(id)`
- `created_by_user_id uuid not null references profiles(id)`
- `join_code text unique not null`
- `title_snapshot text not null`
- `description_snapshot text`
- `cover_image_asset_id_snapshot uuid references media_assets(id)`
- `duration_minutes int not null`
- `question_count_per_participant int not null`
- `feedback_mode feedback_mode not null`
- `show_correct_answers_after_finish boolean not null`
- `allow_guests boolean not null default false`
- `status live_session_status not null default 'waiting'`
- `started_at timestamptz`
- `ends_at timestamptz`
- `ended_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`session_question_pool`

- `id uuid primary key`
- `session_id uuid not null references live_sessions(id)`
- `original_question_id uuid not null references questions(id)`
- `created_by_user_id_snapshot uuid references profiles(id)`
- `points_snapshot int not null`
- `prompt_snapshot text not null`
- `explanation_snapshot text`
- `answer_type_snapshot answer_type not null`
- `options_snapshot jsonb`
- `accepted_answers_snapshot jsonb`
- `image_asset_id_snapshot uuid references media_assets(id)`
- `audio_asset_id_snapshot uuid references media_assets(id)`
- `created_at timestamptz not null default now()`

Enum:

- `live_session_status`: waiting, live, ended

### Participants And Attempts

`participants`

- `id uuid primary key`
- `session_id uuid not null references live_sessions(id)`
- `participant_type participant_type not null`
- `user_id uuid references profiles(id)`
- `guest_name text`
- `status participant_status not null default 'waiting'`
- `joined_at timestamptz not null default now()`
- `removed_at timestamptz`

Constraints:

- account participant: unique `(session_id, user_id)`
- guest participant: unique `(session_id, guest_name)`

`attempts`

- `id uuid primary key`
- `attempt_type attempt_type not null`
- `user_id uuid references profiles(id)`
- `participant_id uuid references participants(id)`
- `live_session_id uuid references live_sessions(id)`
- `status attempt_status not null default 'in_progress'`
- `self_practice_level_id uuid references levels(id)`
- `self_practice_category_id uuid references categories(id)`
- `started_at timestamptz not null default now()`
- `submitted_at timestamptz`
- `created_at timestamptz not null default now()`

`attempt_question_snapshots`

- `id uuid primary key`
- `attempt_id uuid not null references attempts(id)`
- `original_question_id uuid references questions(id)`
- `session_question_pool_id uuid references session_question_pool(id)`
- `created_by_user_id_snapshot uuid references profiles(id)`
- `order_index int not null`
- `points_snapshot int not null default 1`
- `answer_type_snapshot answer_type not null`
- `prompt_snapshot text not null`
- `explanation_snapshot text`
- `options_snapshot jsonb`
- `accepted_answers_snapshot jsonb`
- `image_asset_id_snapshot uuid references media_assets(id)`
- `audio_asset_id_snapshot uuid references media_assets(id)`
- `created_at timestamptz not null default now()`

`answers`

- `id uuid primary key`
- `attempt_question_snapshot_id uuid not null references attempt_question_snapshots(id)`
- `selected_option_snapshot_id text`
- `text_answer text`
- `normalized_text_answer text`
- `is_skipped boolean not null default false`
- `auto_is_correct boolean`
- `final_is_correct boolean`
- `locked_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`answer_review_events`

- `id uuid primary key`
- `answer_id uuid not null references answers(id)`
- `actor_id uuid not null references profiles(id)`
- `previous_final_is_correct boolean`
- `new_final_is_correct boolean not null`
- `comment text`
- `created_at timestamptz not null default now()`

Enums:

- `participant_type`: account, guest
- `participant_status`: waiting, active, submitted, auto_submitted, removed
- `attempt_type`: live, self_practice
- `attempt_status`: in_progress, retrying, submitted, auto_submitted, completed, removed

### Practice History

`question_practice_history`

- `id uuid primary key`
- `user_id uuid not null references profiles(id)`
- `question_id uuid not null references questions(id)`
- `last_answered_at timestamptz`
- `times_seen int not null default 0`
- `times_correct int not null default 0`
- `times_wrong int not null default 0`
- `last_result practice_result`

Constraint:

- unique `(user_id, question_id)`

Enum:

- `practice_result`: correct, wrong, skipped

### Notifications

`notifications`

- `id uuid primary key`
- `user_id uuid not null references profiles(id)`
- `type notification_type not null`
- `title text not null`
- `body text`
- `link_url text`
- `read_at timestamptz`
- `created_at timestamptz not null default now()`

### Index Plan

Add indexes early:

- `profiles(role, status)`
- `groups(teacher_id, status)`
- `groups(invite_code)`
- `group_members(group_id, role, status)`
- `group_members(user_id, status)`
- `question_assignments(group_id, status, deadline_at)`
- `questions(status, visibility, level_id, category_id)`
- `questions(created_by_user_id, status)`
- `questions(source_assignment_id, status)`
- `question_options(question_id)`
- `question_text_answers(question_id)`
- `question_review_events(question_id, created_at desc)`
- `question_reports(question_id, status)`
- `quiz_templates(created_by_user_id, status)`
- `quiz_template_questions(quiz_template_id)`
- `live_sessions(group_id, status)`
- `live_sessions(join_code)`
- `participants(session_id, status)`
- `attempts(user_id, attempt_type, started_at desc)`
- `attempts(live_session_id, status)`
- `attempt_question_snapshots(attempt_id, order_index)`
- `answers(attempt_question_snapshot_id)`
- `question_practice_history(user_id, last_answered_at desc)`
- `notifications(user_id, read_at, created_at desc)`

## Detailed RLS Plan

All application tables must have RLS enabled. Service-role key only in trusted server actions/route handlers for admin-only operations and carefully scoped maintenance.

### Helper Functions

Create stable SQL helper functions:

```sql
current_user_role() returns user_role
is_admin() returns boolean
is_teacher() returns boolean
is_support_teacher() returns boolean
is_active_user() returns boolean
is_group_member(group_id uuid) returns boolean
is_teacher_for_group(group_id uuid) returns boolean
is_support_for_group(group_id uuid) returns boolean
can_review_group(group_id uuid) returns boolean
can_manage_group(group_id uuid) returns boolean
```

Rules:

- disabled users fail most access checks.
- admin bypass allowed via `is_admin()`.
- teacher manages own groups.
- support teacher manages only assigned groups.

### Profiles Policies

Read:

- user can read own profile.
- group teachers/support can read profiles of members in assigned groups.
- admin can read all.

Update:

- user can update limited own fields like `full_name`.
- admin can update role/status.
- users cannot change own role/status.

Insert:

- profile row created via signup trigger or admin action.

### Groups And Members Policies

Groups read:

- members can read their active groups.
- teacher/support assigned to group can read group.
- admin all.

Groups insert:

- teacher/admin only.

Groups update:

- teacher who owns group.
- admin.
- support teacher cannot archive/create group.

Group members read:

- members can read own membership.
- teacher/support can read assigned group members.
- admin all.

Group members insert:

- join-by-code action inserts student membership.
- teacher can add existing support teacher to own group.
- admin all.

Group members update:

- teacher/admin can remove members.
- support teacher cannot add/remove support teachers.

### Assignments Policies

Read:

- students read assignments for groups they belong to.
- teacher/support read assignments for managed/assigned groups.
- admin all.

Insert:

- teacher for group.
- support teacher for assigned group.
- admin.

Update:

- teacher/support for group before archived.
- admin.

### Questions Policies

Read:

- creator can read own draft/pending/needs_changes/rejected questions.
- reviewers can read questions for assigned groups/assignments.
- all logged-in active users can read approved public questions.
- group members can read approved group_only questions in their group.
- admin all.

Insert:

- active logged-in users can create questions.
- source assignment must be in user's group if assignment-based.
- teacher-created can be approved via server action.

Update:

- creator can edit own draft/needs_changes before approved.
- reviewer can edit pending/needs_changes questions in assigned group.
- teacher/admin can archive approved questions they control.
- approved questions cannot be edited by student creator directly.

Status changes:

- student can move own draft to pending_review.
- support teacher can approve student questions in assigned group.
- support teacher cannot approve own question.
- teacher can approve support/student questions in own group.
- admin all.

### Review Events Policies

Read:

- creator can read student_visible events for own question.
- reviewers can read all events for assigned group questions.
- admin all.

Insert:

- server action inserts events when review/status changes.
- reviewers can comment/review assigned questions.
- creator can add resubmission comments if needed.

### Reports Policies

Read:

- reporter can read own report.
- reviewers can read reports for assigned group/public bank moderation.
- admin all.

Insert:

- active students/teachers/support can report approved questions.
- comment required.

Update:

- reviewers/admin resolve.

### Quiz Templates Policies

Read:

- creator teacher reads own templates.
- support teacher can read templates for assigned groups.
- admin all.

Insert:

- teacher/admin.

Update:

- teacher owner/admin while draft/active.
- support teacher can help only if explicitly allowed by service action later.

Template questions:

- same access as parent template.
- only approved questions can be attached, enforced by service layer.

### Live Sessions Policies

Read:

- teacher/support for group.
- group members can read joinable/waiting/live sessions for their group.
- participants can read their own joined session.
- admin all.

Insert:

- teacher/admin.

Update:

- teacher/admin can start/end session.
- support teacher only if teacher assigned permission later; MVP default can manage assigned group if allowed.

Important:

- client cannot update status directly.
- use server actions for start/end to create snapshots atomically.

### Participants Policies

Read:

- participant can read own participant row.
- teacher/support for session group can read all participants.
- admin all.

Insert:

- account student can join group session if group member and session waiting/live.
- guest can join only if `allow_guests = true`.
- no join after ended.

Update:

- participant can update limited own state through service action.
- teacher/support can mark participant removed.

### Attempts, Snapshots, Answers Policies

Attempts read:

- user can read own attempts.
- teacher/support can read attempts for sessions in assigned groups.
- admin all.

Attempts insert:

- server action creates attempt when participant starts live quiz or self practice starts.

Attempts update:

- user can progress own in-progress attempt through server action.
- teacher/support can mark removed/manual finalize for session.

Snapshots read:

- same as parent attempt.

Snapshots insert/update:

- server action only.
- no client direct update after created.

Answers read:

- user can read own answers.
- teacher/support can read answers after session ended or for reports/manual review.
- admin all.

Answers insert/update:

- user can submit answer for own active attempt before deadline.
- answer locked after `locked_at`.
- live session answer rejected if `now() >= ends_at`.
- teacher/support can manual review final correctness after result.

### Notifications Policies

Read:

- user reads own notifications.
- admin optional all.

Insert:

- server action/service layer creates notifications.
- normal client direct insert denied.

Update:

- user can set own `read_at`.

Delete:

- optional no delete in MVP; later archive/delete old read notifications.

### Storage Policies

Buckets:

- `question-images`
- `question-audio`

Rules:

- active users can upload within size/type limits through signed upload or server action.
- users can read media attached to questions they can read.
- public assets can be CDN-read if no sensitive content.
- delete only uploader before question submission, or admin/teacher cleanup.

### RLS Test Matrix

Before pilot, test these cases:

- student cannot read another student's draft question.
- student can read approved public question.
- student cannot approve own question.
- support teacher cannot see unassigned group submissions.
- support teacher cannot approve own question.
- teacher can see all submissions in own group.
- teacher cannot see another teacher's private quiz template.
- guest cannot access dashboards.
- participant cannot submit after session ended.
- participant cannot edit locked answer.
- student cannot see other students' live answers.
- teacher can export own session results.
- disabled user cannot create/read protected resources.

## Migration Order

Recommended DB implementation order:

1. Enums and helper timestamp trigger.
2. `profiles` and auth signup trigger.
3. `levels`, `categories` seeds.
4. `groups`, `group_members`, invite code constraints.
5. `media_assets`.
6. `question_assignments`.
7. `questions`, `question_options`, `question_text_answers`, `question_tags`.
8. `question_review_events`, `question_reports`.
9. `quiz_templates`, `quiz_template_questions`.
10. `live_sessions`, `session_question_pool`.
11. `participants`, `attempts`, `attempt_question_snapshots`, `answers`, `answer_review_events`.
12. `question_practice_history`.
13. `notifications`.
14. Indexes.
15. Helper functions.
16. RLS policies.
17. RLS tests/seed users.

## Route Structure

```txt
/(auth)
/login
/register
/join-group

/dashboard
/dashboard/student
/dashboard/teacher
/dashboard/support
/dashboard/admin

/groups
/groups/[groupId]

/assignments
/assignments/[assignmentId]

/review
/review/questions
/review/reports

/question-bank

/quizzes
/quizzes/new
/quizzes/[quizId]/builder

/sessions
/sessions/[sessionId]/waiting
/sessions/[sessionId]/take
/sessions/[sessionId]/live
/sessions/[sessionId]/results

/self-practice
/self-practice/take
/self-practice/results

/admin/users
```

`/dashboard` role bo'yicha redirect qiladi. Real pages role-specific.

## MVP Scope

Included:

- Supabase Auth + profiles + roles
- Admin user management
- Groups + invite code
- Levels/categories seed
- Assignment create
- Student question creation
- Review queue
- Approved question bank
- Quiz builder
- Live classroom session
- Waiting room
- Late join with remaining time
- Own-question exclusion
- Random frozen order
- Results + question analytics
- Self practice random 5-20
- In-app realtime notifications
- CSV export
- RLS

Not included:

- Payment/subscription
- TTS
- Email/SMS notifications
- Scheduled sessions
- AI grading
- Public quiz template marketplace
- Mobile app
- Complex spaced repetition
- Field-level review diff

## Pilot

Pilot: bitta school/group.

Public teacher signup yo'q.
Student signup ochiq, lekin classroom access invite code bilan.
Self practice logged-in studentlar uchun group shartsiz ochiq.

MVP success criteria:

- teacher group yaratadi.
- studentlar invite code bilan kiradi.
- assignment beriladi.
- studentlar savol submit qiladi.
- teacher/support review qiladi.
- approved questions'dan quiz yaratiladi.
- waiting room ishlaydi.
- teacher start qiladi.
- studentlar quiz ishlaydi.
- timer/session tugaydi.
- result + question analytics chiqadi.
- CSV export ishlaydi.

Technical acceptance:

- RLS role leak yo'q.
- session startdan keyin questions locked.
- late join qolgan vaqt bilan ishlaydi.
- own questions excluded.
- random order frozen.
- result snapshots saqlanadi.

## Build Order

1. Auth + profiles + roles
2. Admin user management
3. Groups + invite code
4. Levels/categories seed
5. Assignment creation
6. Student question creation
7. Review queue
8. Question bank
9. Quiz builder
10. Live session waiting/start/take
11. Results + analytics
12. Self practice
13. Notifications
14. CSV export
15. RLS hardening and tests
