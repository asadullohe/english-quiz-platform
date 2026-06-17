create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'teacher', 'support_teacher', 'admin');
create type public.user_status as enum ('active', 'disabled');
create type public.group_status as enum ('active', 'archived');
create type public.group_member_role as enum ('student', 'teacher', 'support_teacher');
create type public.group_member_status as enum ('active', 'removed');
create type public.media_type as enum ('image', 'audio');
create type public.assignment_status as enum ('open', 'reviewing', 'ready', 'used', 'archived');
create type public.answer_type as enum ('single_choice', 'text');
create type public.question_visibility as enum ('public', 'group_only');
create type public.question_status as enum (
  'draft',
  'pending_review',
  'needs_changes',
  'approved',
  'rejected',
  'flagged',
  'archived'
);
create type public.review_event_type as enum (
  'submitted',
  'edited',
  'commented',
  'approved',
  'needs_changes',
  'rejected',
  'flagged',
  'archived'
);
create type public.review_comment_visibility as enum ('student_visible', 'internal');
create type public.question_report_reason as enum (
  'wrong_answer',
  'unclear',
  'typo',
  'inappropriate',
  'wrong_level',
  'other'
);
create type public.report_status as enum ('open', 'dismissed', 'fixed', 'archived');
create type public.feedback_mode as enum ('instant', 'after_finish');
create type public.quiz_template_status as enum ('draft', 'active', 'archived');
create type public.live_session_status as enum ('waiting', 'live', 'ended');
create type public.participant_type as enum ('account', 'guest');
create type public.participant_status as enum (
  'waiting',
  'active',
  'submitted',
  'auto_submitted',
  'removed'
);
create type public.attempt_type as enum ('live', 'self_practice');
create type public.attempt_status as enum (
  'in_progress',
  'retrying',
  'submitted',
  'auto_submitted',
  'completed',
  'removed'
);
create type public.practice_result as enum ('correct', 'wrong', 'skipped');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'student',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.levels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  order_index int not null,
  is_active boolean not null default true
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  order_index int not null,
  is_active boolean not null default true
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level_id uuid references public.levels(id),
  teacher_id uuid not null references public.profiles(id),
  invite_code text unique not null,
  invite_enabled boolean not null default true,
  status public.group_status not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.group_member_role not null,
  joined_at timestamptz not null default now(),
  status public.group_member_status not null default 'active',
  unique (group_id, user_id)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  uploaded_by_user_id uuid references public.profiles(id),
  type public.media_type not null,
  storage_path text not null,
  public_url text,
  mime_type text not null,
  size_bytes bigint not null,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create table public.question_assignments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id),
  title text not null,
  topic text not null,
  level_id uuid references public.levels(id),
  category_id uuid references public.categories(id),
  questions_per_student int not null check (questions_per_student > 0),
  deadline_at timestamptz,
  share_approved_to_public_bank boolean not null default true,
  status public.assignment_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references public.profiles(id),
  source_assignment_id uuid references public.question_assignments(id),
  source_group_id uuid references public.groups(id),
  level_id uuid references public.levels(id),
  category_id uuid references public.categories(id),
  answer_type public.answer_type not null,
  prompt text not null,
  explanation text,
  image_asset_id uuid references public.media_assets(id),
  audio_asset_id uuid references public.media_assets(id),
  points int not null default 1 check (points between 1 and 10),
  visibility public.question_visibility not null default 'public',
  status public.question_status not null default 'draft',
  approved_by_user_id uuid references public.profiles(id),
  approved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  order_index int not null,
  created_at timestamptz not null default now()
);

create table public.question_text_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text not null,
  normalized_answer text not null,
  created_at timestamptz not null default now()
);

create table public.question_tags (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  tag text not null,
  unique (question_id, tag)
);

create table public.question_review_events (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  event_type public.review_event_type not null,
  comment text,
  visibility public.review_comment_visibility not null default 'student_visible',
  created_at timestamptz not null default now()
);

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  reporter_id uuid references public.profiles(id),
  reason public.question_report_reason not null,
  comment text not null check (length(trim(comment)) > 0),
  status public.report_status not null default 'open',
  resolved_by_user_id uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.quiz_templates (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references public.profiles(id),
  group_id uuid references public.groups(id),
  title text not null,
  description text,
  cover_image_asset_id uuid references public.media_assets(id),
  level_id uuid references public.levels(id),
  category_id uuid references public.categories(id),
  question_count_per_participant int not null check (question_count_per_participant > 0),
  duration_minutes int not null check (duration_minutes > 0),
  feedback_mode public.feedback_mode not null default 'after_finish',
  show_correct_answers_after_finish boolean not null default true,
  allow_guests boolean not null default false,
  status public.quiz_template_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_template_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_template_id uuid not null references public.quiz_templates(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  order_index int,
  created_at timestamptz not null default now(),
  unique (quiz_template_id, question_id)
);

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_template_id uuid references public.quiz_templates(id),
  group_id uuid references public.groups(id),
  created_by_user_id uuid not null references public.profiles(id),
  join_code text unique not null,
  title_snapshot text not null,
  description_snapshot text,
  cover_image_asset_id_snapshot uuid references public.media_assets(id),
  duration_minutes int not null check (duration_minutes > 0),
  question_count_per_participant int not null check (question_count_per_participant > 0),
  feedback_mode public.feedback_mode not null,
  show_correct_answers_after_finish boolean not null,
  allow_guests boolean not null default false,
  status public.live_session_status not null default 'waiting',
  started_at timestamptz,
  ends_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.session_question_pool (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  original_question_id uuid not null references public.questions(id),
  created_by_user_id_snapshot uuid references public.profiles(id),
  points_snapshot int not null,
  prompt_snapshot text not null,
  explanation_snapshot text,
  answer_type_snapshot public.answer_type not null,
  options_snapshot jsonb,
  accepted_answers_snapshot jsonb,
  image_asset_id_snapshot uuid references public.media_assets(id),
  audio_asset_id_snapshot uuid references public.media_assets(id),
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  participant_type public.participant_type not null,
  user_id uuid references public.profiles(id),
  guest_name text,
  status public.participant_status not null default 'waiting',
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  check (
    (participant_type = 'account' and user_id is not null and guest_name is null)
    or (participant_type = 'guest' and user_id is null and guest_name is not null)
  )
);

create unique index participants_unique_account
  on public.participants(session_id, user_id)
  where user_id is not null;

create unique index participants_unique_guest_name
  on public.participants(session_id, lower(guest_name))
  where guest_name is not null;

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  attempt_type public.attempt_type not null,
  user_id uuid references public.profiles(id),
  participant_id uuid references public.participants(id),
  live_session_id uuid references public.live_sessions(id),
  status public.attempt_status not null default 'in_progress',
  self_practice_level_id uuid references public.levels(id),
  self_practice_category_id uuid references public.categories(id),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (attempt_type = 'live' and participant_id is not null and live_session_id is not null)
    or (attempt_type = 'self_practice' and user_id is not null)
  )
);

create table public.attempt_question_snapshots (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  original_question_id uuid references public.questions(id),
  session_question_pool_id uuid references public.session_question_pool(id),
  created_by_user_id_snapshot uuid references public.profiles(id),
  order_index int not null,
  points_snapshot int not null default 1,
  answer_type_snapshot public.answer_type not null,
  prompt_snapshot text not null,
  explanation_snapshot text,
  options_snapshot jsonb,
  accepted_answers_snapshot jsonb,
  image_asset_id_snapshot uuid references public.media_assets(id),
  audio_asset_id_snapshot uuid references public.media_assets(id),
  created_at timestamptz not null default now(),
  unique (attempt_id, order_index)
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  attempt_question_snapshot_id uuid not null references public.attempt_question_snapshots(id) on delete cascade,
  selected_option_snapshot_id text,
  text_answer text,
  normalized_text_answer text,
  is_skipped boolean not null default false,
  auto_is_correct boolean,
  final_is_correct boolean,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_question_snapshot_id)
);

create table public.answer_review_events (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  previous_final_is_correct boolean,
  new_final_is_correct boolean not null,
  comment text,
  created_at timestamptz not null default now()
);

create table public.question_practice_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  last_answered_at timestamptz,
  times_seen int not null default 0,
  times_correct int not null default 0,
  times_wrong int not null default 0,
  last_result public.practice_result,
  unique (user_id, question_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.levels (slug, name, order_index) values
  ('beginner', 'Beginner', 1),
  ('elementary', 'Elementary', 2),
  ('pre-intermediate', 'Pre-Intermediate', 3),
  ('intermediate', 'Intermediate', 4),
  ('upper-intermediate', 'Upper-Intermediate', 5),
  ('ielts', 'IELTS', 6);

insert into public.categories (slug, name, order_index) values
  ('grammar', 'Grammar', 1),
  ('vocabulary', 'Vocabulary', 2),
  ('listening', 'Listening', 3),
  ('reading', 'Reading', 4),
  ('writing', 'Writing', 5),
  ('ielts', 'IELTS', 6);

create index profiles_role_status_idx on public.profiles(role, status);
create index groups_teacher_status_idx on public.groups(teacher_id, status);
create index group_members_group_role_status_idx on public.group_members(group_id, role, status);
create index group_members_user_status_idx on public.group_members(user_id, status);
create index question_assignments_group_status_idx on public.question_assignments(group_id, status, deadline_at);
create index questions_status_visibility_level_category_idx on public.questions(status, visibility, level_id, category_id);
create index questions_creator_status_idx on public.questions(created_by_user_id, status);
create index questions_assignment_status_idx on public.questions(source_assignment_id, status);
create index question_options_question_idx on public.question_options(question_id);
create index question_text_answers_question_idx on public.question_text_answers(question_id);
create index question_review_events_question_created_idx on public.question_review_events(question_id, created_at desc);
create index question_reports_question_status_idx on public.question_reports(question_id, status);
create index quiz_templates_creator_status_idx on public.quiz_templates(created_by_user_id, status);
create index quiz_template_questions_template_idx on public.quiz_template_questions(quiz_template_id);
create index live_sessions_group_status_idx on public.live_sessions(group_id, status);
create index participants_session_status_idx on public.participants(session_id, status);
create index attempts_user_type_started_idx on public.attempts(user_id, attempt_type, started_at desc);
create index attempts_session_status_idx on public.attempts(live_session_id, status);
create index attempt_question_snapshots_attempt_order_idx on public.attempt_question_snapshots(attempt_id, order_index);
create index answers_snapshot_idx on public.answers(attempt_question_snapshot_id);
create index practice_history_user_answered_idx on public.question_practice_history(user_id, last_answered_at desc);
create index notifications_user_read_created_idx on public.notifications(user_id, read_at, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create trigger assignments_set_updated_at
  before update on public.question_assignments
  for each row execute function public.set_updated_at();

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create trigger quiz_templates_set_updated_at
  before update on public.quiz_templates
  for each row execute function public.set_updated_at();

create trigger live_sessions_set_updated_at
  before update on public.live_sessions
  for each row execute function public.set_updated_at();

create trigger answers_set_updated_at
  before update on public.answers
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Student'),
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'active'
$$;

create or replace function public.is_active_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

create or replace function public.is_teacher()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_role() = 'teacher'
$$;

create or replace function public.is_support_teacher()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_role() = 'support_teacher'
$$;

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id
      and user_id = auth.uid()
      and status = 'active'
  )
$$;

create or replace function public.is_teacher_for_group(target_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.groups
    where id = target_group_id
      and teacher_id = auth.uid()
      and status = 'active'
  )
$$;

create or replace function public.is_support_for_group(target_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id
      and user_id = auth.uid()
      and role = 'support_teacher'
      and status = 'active'
  )
$$;

create or replace function public.can_review_group(target_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin()
    or public.is_teacher_for_group(target_group_id)
    or public.is_support_for_group(target_group_id)
$$;

create or replace function public.can_manage_group(target_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or public.is_teacher_for_group(target_group_id)
$$;

alter table public.profiles enable row level security;
alter table public.levels enable row level security;
alter table public.categories enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.media_assets enable row level security;
alter table public.question_assignments enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_text_answers enable row level security;
alter table public.question_tags enable row level security;
alter table public.question_review_events enable row level security;
alter table public.question_reports enable row level security;
alter table public.quiz_templates enable row level security;
alter table public.quiz_template_questions enable row level security;
alter table public.live_sessions enable row level security;
alter table public.session_question_pool enable row level security;
alter table public.participants enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_question_snapshots enable row level security;
alter table public.answers enable row level security;
alter table public.answer_review_events enable row level security;
alter table public.question_practice_history enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_visible"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.group_members gm_self
      join public.group_members gm_other on gm_other.group_id = gm_self.group_id
      where gm_self.user_id = auth.uid()
        and gm_self.status = 'active'
        and gm_other.user_id = profiles.id
        and gm_other.status = 'active'
    )
  );

create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "levels_read_active"
  on public.levels for select
  using (is_active or public.is_admin());

create policy "categories_read_active"
  on public.categories for select
  using (is_active or public.is_admin());

create policy "groups_select_visible"
  on public.groups for select
  using (
    public.is_admin()
    or teacher_id = auth.uid()
    or public.is_group_member(id)
  );

create policy "groups_insert_teacher_admin"
  on public.groups for insert
  with check (public.is_admin() or public.is_teacher());

create policy "groups_update_owner_admin"
  on public.groups for update
  using (public.can_manage_group(id))
  with check (public.can_manage_group(id));

create policy "group_members_select_visible"
  on public.group_members for select
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.can_review_group(group_id)
  );

create policy "group_members_insert_manage_or_self_join"
  on public.group_members for insert
  with check (
    public.is_admin()
    or public.can_manage_group(group_id)
    or (user_id = auth.uid() and role = 'student')
  );

create policy "group_members_update_manager"
  on public.group_members for update
  using (public.can_manage_group(group_id))
  with check (public.can_manage_group(group_id));

create policy "media_select_owned_or_active"
  on public.media_assets for select
  using (public.is_active_user());

create policy "media_insert_active_user"
  on public.media_assets for insert
  with check (uploaded_by_user_id = auth.uid() and public.is_active_user());

create policy "assignments_select_visible"
  on public.question_assignments for select
  using (
    public.is_admin()
    or public.is_group_member(group_id)
    or public.can_review_group(group_id)
  );

create policy "assignments_insert_reviewers"
  on public.question_assignments for insert
  with check (public.can_review_group(group_id));

create policy "assignments_update_reviewers"
  on public.question_assignments for update
  using (public.can_review_group(group_id))
  with check (public.can_review_group(group_id));

create policy "questions_select_visible"
  on public.questions for select
  using (
    public.is_admin()
    or created_by_user_id = auth.uid()
    or (status = 'approved' and visibility = 'public' and public.is_active_user())
    or (status = 'approved' and visibility = 'group_only' and source_group_id is not null and public.is_group_member(source_group_id))
    or (source_group_id is not null and public.can_review_group(source_group_id))
  );

create policy "questions_insert_active"
  on public.questions for insert
  with check (
    created_by_user_id = auth.uid()
    and public.is_active_user()
    and (
      source_group_id is null
      or public.is_group_member(source_group_id)
      or public.can_review_group(source_group_id)
    )
  );

create policy "questions_update_allowed"
  on public.questions for update
  using (
    public.is_admin()
    or (
      created_by_user_id = auth.uid()
      and status in ('draft', 'needs_changes')
    )
    or (source_group_id is not null and public.can_review_group(source_group_id))
  )
  with check (
    public.is_admin()
    or (
      created_by_user_id = auth.uid()
      and status in ('draft', 'pending_review')
    )
    or (source_group_id is not null and public.can_review_group(source_group_id))
  );

create policy "question_options_visible_via_question"
  on public.question_options for select
  using (exists (select 1 from public.questions q where q.id = question_id));

create policy "question_options_write_creator_or_reviewer"
  on public.question_options for all
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_id
        and (
          q.created_by_user_id = auth.uid()
          or public.is_admin()
          or (q.source_group_id is not null and public.can_review_group(q.source_group_id))
        )
    )
  )
  with check (
    exists (
      select 1 from public.questions q
      where q.id = question_id
        and (
          q.created_by_user_id = auth.uid()
          or public.is_admin()
          or (q.source_group_id is not null and public.can_review_group(q.source_group_id))
        )
    )
  );

create policy "question_text_answers_visible_via_question"
  on public.question_text_answers for select
  using (exists (select 1 from public.questions q where q.id = question_id));

create policy "question_text_answers_write_creator_or_reviewer"
  on public.question_text_answers for all
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_id
        and (
          q.created_by_user_id = auth.uid()
          or public.is_admin()
          or (q.source_group_id is not null and public.can_review_group(q.source_group_id))
        )
    )
  )
  with check (
    exists (
      select 1 from public.questions q
      where q.id = question_id
        and (
          q.created_by_user_id = auth.uid()
          or public.is_admin()
          or (q.source_group_id is not null and public.can_review_group(q.source_group_id))
        )
    )
  );

create policy "review_events_select_visible"
  on public.question_review_events for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.questions q
      where q.id = question_id
        and (
          (q.created_by_user_id = auth.uid() and question_review_events.visibility = 'student_visible')
          or (q.source_group_id is not null and public.can_review_group(q.source_group_id))
        )
    )
  );

create policy "review_events_insert_reviewers"
  on public.question_review_events for insert
  with check (
    actor_id = auth.uid()
    and exists (
      select 1 from public.questions q
      where q.id = question_id
        and (
          public.is_admin()
          or q.created_by_user_id = auth.uid()
          or (q.source_group_id is not null and public.can_review_group(q.source_group_id))
        )
    )
  );

create policy "reports_select_visible"
  on public.question_reports for select
  using (
    public.is_admin()
    or reporter_id = auth.uid()
    or exists (
      select 1 from public.questions q
      where q.id = question_id
        and q.source_group_id is not null
        and public.can_review_group(q.source_group_id)
    )
  );

create policy "reports_insert_active"
  on public.question_reports for insert
  with check (reporter_id = auth.uid() and public.is_active_user());

create policy "reports_update_reviewers"
  on public.question_reports for update
  using (
    public.is_admin()
    or exists (
      select 1 from public.questions q
      where q.id = question_id
        and q.source_group_id is not null
        and public.can_review_group(q.source_group_id)
    )
  );

create policy "quiz_templates_select_visible"
  on public.quiz_templates for select
  using (
    public.is_admin()
    or created_by_user_id = auth.uid()
    or (group_id is not null and public.can_review_group(group_id))
  );

create policy "quiz_templates_insert_teacher"
  on public.quiz_templates for insert
  with check (
    created_by_user_id = auth.uid()
    and (
      public.is_admin()
      or public.is_teacher()
      or (group_id is not null and public.can_review_group(group_id))
    )
  );

create policy "quiz_templates_update_owner"
  on public.quiz_templates for update
  using (public.is_admin() or created_by_user_id = auth.uid())
  with check (public.is_admin() or created_by_user_id = auth.uid());

create policy "quiz_template_questions_by_parent"
  on public.quiz_template_questions for all
  using (
    exists (
      select 1 from public.quiz_templates qt
      where qt.id = quiz_template_id
        and (public.is_admin() or qt.created_by_user_id = auth.uid() or (qt.group_id is not null and public.can_review_group(qt.group_id)))
    )
  )
  with check (
    exists (
      select 1 from public.quiz_templates qt
      where qt.id = quiz_template_id
        and (public.is_admin() or qt.created_by_user_id = auth.uid() or (qt.group_id is not null and public.can_review_group(qt.group_id)))
    )
  );

create policy "live_sessions_select_visible"
  on public.live_sessions for select
  using (
    public.is_admin()
    or created_by_user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
    or (group_id is not null and public.can_review_group(group_id))
  );

create policy "live_sessions_insert_teacher"
  on public.live_sessions for insert
  with check (
    created_by_user_id = auth.uid()
    and (
      public.is_admin()
      or public.is_teacher()
      or (group_id is not null and public.can_review_group(group_id))
    )
  );

create policy "live_sessions_update_manager"
  on public.live_sessions for update
  using (
    public.is_admin()
    or created_by_user_id = auth.uid()
    or (group_id is not null and public.can_review_group(group_id))
  )
  with check (
    public.is_admin()
    or created_by_user_id = auth.uid()
    or (group_id is not null and public.can_review_group(group_id))
  );

create policy "session_pool_visible_via_session"
  on public.session_question_pool for select
  using (
    exists (
      select 1 from public.live_sessions ls
      where ls.id = session_id
        and (
          public.is_admin()
          or ls.created_by_user_id = auth.uid()
          or (ls.group_id is not null and public.is_group_member(ls.group_id))
          or (ls.group_id is not null and public.can_review_group(ls.group_id))
        )
    )
  );

create policy "participants_select_visible"
  on public.participants for select
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.live_sessions ls
      where ls.id = session_id
        and ls.group_id is not null
        and public.can_review_group(ls.group_id)
    )
  );

create policy "participants_insert_self_or_guest"
  on public.participants for insert
  with check (
    (
      participant_type = 'account'
      and user_id = auth.uid()
      and exists (
        select 1 from public.live_sessions ls
        where ls.id = session_id
          and ls.status in ('waiting', 'live')
          and ls.group_id is not null
          and public.is_group_member(ls.group_id)
      )
    )
    or (
      participant_type = 'guest'
      and user_id is null
      and exists (
        select 1 from public.live_sessions ls
        where ls.id = session_id
          and ls.status in ('waiting', 'live')
          and ls.allow_guests
      )
    )
  );

create policy "participants_update_manager"
  on public.participants for update
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.live_sessions ls
      where ls.id = session_id
        and ls.group_id is not null
        and public.can_review_group(ls.group_id)
    )
  );

create policy "attempts_select_visible"
  on public.attempts for select
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.live_sessions ls
      where ls.id = live_session_id
        and ls.group_id is not null
        and public.can_review_group(ls.group_id)
    )
  );

create policy "attempts_insert_self"
  on public.attempts for insert
  with check (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.participants p
      where p.id = participant_id and p.user_id = auth.uid()
    )
  );

create policy "attempts_update_visible"
  on public.attempts for update
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.live_sessions ls
      where ls.id = live_session_id
        and ls.group_id is not null
        and public.can_review_group(ls.group_id)
    )
  );

create policy "attempt_snapshots_select_via_attempt"
  on public.attempt_question_snapshots for select
  using (exists (select 1 from public.attempts a where a.id = attempt_id));

create policy "attempt_snapshots_insert_via_attempt"
  on public.attempt_question_snapshots for insert
  with check (exists (select 1 from public.attempts a where a.id = attempt_id));

create policy "answers_select_via_attempt"
  on public.answers for select
  using (
    exists (
      select 1
      from public.attempt_question_snapshots aqs
      join public.attempts a on a.id = aqs.attempt_id
      where aqs.id = attempt_question_snapshot_id
    )
  );

create policy "answers_insert_update_via_own_attempt"
  on public.answers for all
  using (
    exists (
      select 1
      from public.attempt_question_snapshots aqs
      join public.attempts a on a.id = aqs.attempt_id
      where aqs.id = attempt_question_snapshot_id
        and (a.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.attempt_question_snapshots aqs
      join public.attempts a on a.id = aqs.attempt_id
      where aqs.id = attempt_question_snapshot_id
        and (a.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "answer_review_events_select_visible"
  on public.answer_review_events for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.answers ans
      join public.attempt_question_snapshots aqs on aqs.id = ans.attempt_question_snapshot_id
      join public.attempts a on a.id = aqs.attempt_id
      left join public.live_sessions ls on ls.id = a.live_session_id
      where ans.id = answer_id
        and (
          a.user_id = auth.uid()
          or (ls.group_id is not null and public.can_review_group(ls.group_id))
        )
    )
  );

create policy "answer_review_events_insert_reviewers"
  on public.answer_review_events for insert
  with check (
    actor_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1
        from public.answers ans
        join public.attempt_question_snapshots aqs on aqs.id = ans.attempt_question_snapshot_id
        join public.attempts a on a.id = aqs.attempt_id
        join public.live_sessions ls on ls.id = a.live_session_id
        where ans.id = answer_id
          and ls.group_id is not null
          and public.can_review_group(ls.group_id)
      )
    )
  );

create policy "practice_history_self"
  on public.question_practice_history for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

create policy "notifications_update_read_own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_insert_admin_only"
  on public.notifications for insert
  with check (public.is_admin());
