# QuizUstoz

Uzbek tilida ingliz tili o'rganayotganlar uchun classroom-first quiz platforma.

Spec: [outputs/english-quiz-platform-mvp-spec.md](outputs/english-quiz-platform-mvp-spec.md)

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- Supabase Auth, Postgres, RLS, Realtime

## Setup

1. Dependencies install:

   ```bash
   pnpm install
   ```

2. Environment:

   ```bash
   cp .env.example .env.local
   ```

   Fill:

   ```txt
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

3. Supabase migration:

   ```bash
   supabase db push
   ```

   Migration file:

   ```txt
   supabase/migrations/0001_initial_mvp_schema.sql
   ```

4. Dev server:

   ```bash
   pnpm dev
   ```

## Current Implementation

Included now:

- App scaffold
- Landing page
- Role dashboard shells
- Placeholder feature routes
- Supabase browser/server clients
- Middleware session refresh
- Initial MVP database schema migration
- Initial RLS helper functions and policies

Not wired yet:

- Login/register server actions
- Group creation actions
- Assignment forms
- Question editor/review queue
- Quiz builder/live session runtime
- Realtime notifications UI

## Build Order

1. Auth actions + admin seed flow
2. Groups + invite code
3. Assignments
4. Student question creation
5. Review queue
6. Quiz builder
7. Live sessions
8. Results and analytics
9. Self practice
10. Notifications and CSV export
# quiz-repo
