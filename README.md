# TaskGram

**A production-ready task manager that delivers reliable reminders through Telegram.**

TaskGram combines a responsive productivity dashboard with Telegram notifications, recurring schedules, delivery tracking, secure account linking, and a Telegram Mini App for creating tasks without leaving the chat.

[Live Application](https://task-gram-one.vercel.app) | [Telegram Bot](https://t.me/taskgram_rnrezanur_bot)

## Why TaskGram?

Traditional reminder applications depend on users regularly opening the app or allowing browser notifications. TaskGram delivers reminders through Telegram, a channel users already check throughout the day.

The project demonstrates full-stack product engineering across authentication, authorization, relational data modeling, background processing, external API integration, concurrency control, responsive UI, and production deployment.

## Product Highlights

- Full task lifecycle: create, edit, complete, archive, delete, snooze, search, and filter
- Daily, monthly, single-date, and custom-range task records with completed, incomplete, pending, and completion-rate insights
- Exact completion timestamps in task records, reminder details, and the Telegram workspace
- Searchable personal notes with pinning, colors, editing, and archiving
- Daily income and expense tracking with monthly summaries and category breakdowns
- One-time and recurring reminders with timezone-aware scheduling
- Automated Telegram delivery through Supabase Cron and Edge Functions
- Secure Telegram account linking without asking users for chat IDs
- Telegram inline actions for completing and snoozing reminders
- Explicit incomplete actions from the website, Telegram reminder buttons, and Telegram Mini App
- Telegram Mini App workspace for tasks, records, notes, income, and expenses
- Delivery history with pending, processing, sent, failed, and cancelled states
- Responsive dashboard, calendar view, settings, dark mode, and admin dashboard
- Per-user data isolation through PostgreSQL Row Level Security

## Engineering Highlights

### Reliable Reminder Delivery

Supabase Cron invokes an Edge Function every minute. Due notifications are atomically claimed using PostgreSQL row locking before Telegram delivery.

```text
pending -> processing -> sent
                      -> failed -> retry
```

This design prevents duplicate delivery during overlapping Cron executions and supports up to three retry attempts for temporary failures.

### Accurate Task History

Each scheduled task occurrence has its own history record. Recurring reminders can move to their next due date without overwriting earlier completed or incomplete work, enabling accurate daily and monthly progress reporting.
Task records preserve their original title, details, category, priority, timezone, recurrence type, and result even after the source task is edited or deleted.

### Secure Telegram Linking

TaskGram never asks users to manually enter a Telegram chat ID.

1. An authenticated user requests a connection link.
2. The server generates a cryptographically secure one-time token.
3. Only the SHA-256 token hash is stored.
4. The token expires after ten minutes and can only be used once.
5. Telegram sends the `/start` payload to the verified webhook.
6. The server links the Telegram chat to the correct TaskGram user.

### Telegram Mini App Security

The Telegram Mini App opens a compact TaskGram workspace inside Telegram. Users can create and manage tasks, keep notes, and track income and expenses. Every Mini App API request verifies Telegram-signed `initData` using HMAC before matching the Telegram identity to an active TaskGram connection.

### Authorization and Data Isolation

- Supabase Auth manages user sessions.
- Dashboard routes are protected by the Next.js proxy.
- PostgreSQL RLS ensures users can only access their own profile, reminders, Telegram connection, and delivery history.
- Service-role access is restricted to trusted server routes, webhooks, admin operations, and scheduled functions.
- Admin access is controlled through a server-only email allowlist.

## Architecture

```mermaid
flowchart LR
    User["Web or Telegram User"] --> Next["Next.js on Vercel"]
    User --> Bot["Telegram Bot API"]
    Next --> Auth["Supabase Auth"]
    Next --> DB["Supabase PostgreSQL + RLS"]
    Bot --> Webhook["Telegram Webhook"]
    Webhook --> DB
    Cron["Supabase Cron: every minute"] --> Edge["process-due-reminders Edge Function"]
    Edge --> DB
    Edge --> Bot
    Mini["Telegram Mini App"] --> MiniAPI["Verified Mini App API"]
    MiniAPI --> DB
```

## Technology Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, shadcn-style primitives, Lucide React, next-themes, Sonner |
| Validation | Zod, server-side validation |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | Supabase Row Level Security |
| Background jobs | Supabase Cron, Supabase Edge Functions |
| Messaging | Telegram Bot API, webhooks, inline keyboards, Mini Apps |
| Deployment | Vercel and Supabase |
| Testing | Vitest, TypeScript, ESLint, production build verification |

## Core Workflows

### Reminder Creation

The user selects a local date, time, timezone, reminder offset, and recurrence rule. TaskGram converts the schedule to UTC and creates a unique pending delivery record.

### Recurring Completion

Completing a one-time task permanently completes it and cancels future pending notifications. Completing a recurring task advances it to the next occurrence and schedules the next Telegram notification.

### Telegram Delivery

The Edge Function claims due records, loads the user and reminder context, formats the message in the user's timezone, sends it through Telegram, and records the outcome.

## Project Structure

```text
app/
  admin/                         Protected admin dashboard
  api/telegram/                  Webhook and Mini App APIs
  dashboard/                     Authenticated product experience
  telegram/workspace/            Telegram Mini App workspace
components/
  dashboard/                     Navigation and dashboard components
  reminders/                     Task cards, actions, badges, and forms
  telegram/                      Connection and Mini App components
lib/
  actions/                       Server actions
  supabase/                      Browser, server, and proxy clients
  telegram/                      API, token, message, and Mini App security
supabase/
  migrations/                    Schema, indexes, triggers, RLS, claim function
  functions/process-due-reminders/
scripts/                         Telegram webhook and Mini App setup helpers
tests/                           Scheduling tests
```

## Local Development

### Prerequisites

- Node.js 20 or newer
- A Supabase project
- A Telegram bot created through BotFather

### Installation

```bash
git clone https://github.com/Rnrezanur/TaskGram.git
cd TaskGram
npm install
```

Create `.env.local` from `.env.example` and add the required values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=

SUPABASE_EDGE_FUNCTION_URL=
CRON_AUTH_SECRET=
ADMIN_EMAILS=
```

Run the project:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup

Run the migration from the Supabase SQL Editor:

```text
supabase/migrations/0001_initial_schema.sql
```

The migration creates:

- user profiles and automatic profile creation
- Telegram connections and one-time link tokens
- reminders and notification delivery history
- constraints and indexes
- RLS policies
- the atomic `claim_due_notifications` function

Run all migrations in order, including:

```text
supabase/migrations/0002_notes_and_finance.sql
```

## Telegram Setup

Create a bot through BotFather and add its token and username to the environment.

Set the production webhook:

```powershell
.\scripts\set-telegram-webhook.ps1 `
  -BotToken "YOUR_TELEGRAM_BOT_TOKEN" `
  -AppUrl "https://YOUR_DOMAIN" `
  -WebhookSecret "YOUR_TELEGRAM_WEBHOOK_SECRET"
```

Configure the Telegram Mini App menu button:

```powershell
.\scripts\set-telegram-mini-app.ps1 `
  -BotToken "YOUR_TELEGRAM_BOT_TOKEN" `
  -AppUrl "https://YOUR_DOMAIN"
```

## Edge Function and Cron Setup

Link the Supabase project and deploy the function:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy process-due-reminders --no-verify-jwt
```

Set Edge Function secrets:

```bash
npx supabase secrets set TELEGRAM_BOT_TOKEN=YOUR_TOKEN
npx supabase secrets set CRON_AUTH_SECRET=YOUR_SECRET
npx supabase secrets set NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
```

Schedule the Edge Function every minute:

```sql
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'process-due-reminders-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.functions.supabase.co/process-due-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_AUTH_SECRET',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Vercel Deployment

1. Import the GitHub repository into Vercel.
2. Keep the Next.js framework preset and root directory.
3. Add every variable from `.env.example`.
4. Set `NEXT_PUBLIC_APP_URL` to the final production URL.
5. Set `ADMIN_EMAILS` to a comma-separated list of administrator emails.
6. Deploy and configure the Telegram webhook and Mini App menu button.

## Quality Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The project is maintained against strict TypeScript checks, zero-warning linting, scheduling tests, and production build verification.

## Security Considerations

- Telegram and Supabase service-role secrets never reach browser code.
- Telegram webhook requests require the configured secret header.
- Mini App requests require valid Telegram-signed `initData`.
- One-time connection tokens are hashed, expiring, and single-use.
- RLS protects every user-facing database table.
- Notification claiming uses atomic database locking.
- Input is validated on trusted server boundaries.

## Future Improvements

- Push and email notification channels
- Team workspaces and shared task assignment
- Natural-language task creation
- Analytics for task completion and routine consistency
- Expanded integration and end-to-end test coverage

## Author

Built by **Md Rezanur Bin Shamim** as a full-stack productivity and messaging integration project.

This repository demonstrates the ability to design, implement, secure, deploy, and operate a real-world application across frontend, backend, database, scheduled processing, and third-party APIs.
