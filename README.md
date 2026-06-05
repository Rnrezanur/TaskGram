# TaskGram

TaskGram is a production-ready personal reminder and to-do website that sends secure Telegram notifications. It uses Next.js App Router, TypeScript, Tailwind CSS, shadcn-style components, Supabase Auth/PostgreSQL/RLS/Edge Functions/Cron, and the Telegram Bot API.

## Build Checklist

- [x] Phase 1: Scaffold Next.js, Tailwind, reusable UI, landing, auth pages
- [x] Phase 2: Supabase clients, authentication actions, protected dashboard layout
- [x] Phase 3: SQL migrations, RLS, reminder CRUD, delivery records
- [x] Phase 4: Telegram secure one-time token linking, webhook, test/disconnect
- [x] Phase 5: Supabase Edge Function for every-minute due reminder processing
- [x] Phase 6: Recurrence, snooze, calendar, notification history, settings, dark mode
- [x] Phase 7: Tests, deployment docs, manual QA checklist

## Features

- Email/password sign-up, login, logout, and password reset through Supabase Auth
- Protected dashboard with summary cards, reminders, calendar, notifications, Telegram, and settings
- Create, edit, complete, archive, delete, snooze, and recur reminders
- Secure Telegram linking with 10-minute one-time tokens stored only as SHA-256 hashes
- Telegram webhook for `/start`, `/help`, `/status`, `/disconnect`, and inline callback buttons
- Automatic due reminder processing with atomic claiming, retries, and duplicate prevention
- Notification delivery history with pending, processing, sent, failed, and cancelled statuses
- Supabase Row Level Security policies for profiles, Telegram connections, reminders, and deliveries
- Light/dark theme support and responsive desktop/mobile navigation

## Screenshots

Add screenshots after deployment:

- Landing page: `public/screenshots/landing.png`
- Dashboard: `public/screenshots/dashboard.png`
- Telegram connection: `public/screenshots/telegram.png`

## Technology Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS, shadcn/ui-style primitives, Lucide React, next-themes, Sonner
- React Hook Form-ready Zod validation and server-side validation
- Supabase PostgreSQL, Auth, Row Level Security, Edge Functions, Cron
- Telegram Bot API webhooks and `sendMessage`
- Vitest for critical scheduling logic

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill `.env.local`:

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
```

4. Run checks:

```bash
npm run typecheck
npm run lint
npm test
```

5. Start the app:

```bash
npm run dev
```

## Supabase Setup

1. Create a Supabase project.
2. In SQL Editor, run `supabase/migrations/0001_initial_schema.sql`.
3. Confirm RLS is enabled on `profiles`, `telegram_connections`, `telegram_link_tokens`, `reminders`, and `notification_deliveries`.
4. Confirm the Auth trigger `on_auth_user_created` creates a profile after sign-up.
5. Store service-role credentials only in server-side environments.

## Telegram BotFather Setup

1. Open BotFather and create a bot with `/newbot`.
2. Copy the bot token into `TELEGRAM_BOT_TOKEN`.
3. Copy the bot username without `@` into `TELEGRAM_BOT_USERNAME`.
4. Generate a strong random `TELEGRAM_WEBHOOK_SECRET`.

Set the webhook after deploying:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "content-type: application/json" \
  -d '{"url":"https://YOUR_DOMAIN.com/api/telegram/webhook","secret_token":"YOUR_TELEGRAM_WEBHOOK_SECRET"}'
```

## Supabase Edge Function and Cron

Deploy the Edge Function:

```bash
supabase functions deploy process-due-reminders
```

Set function secrets:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=... CRON_AUTH_SECRET=... NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN.com
```

Create a Supabase Cron job that runs every minute and calls the Edge Function with:

```http
Authorization: Bearer YOUR_CRON_AUTH_SECRET
```

The function calls `claim_due_notifications`, transitions due records from `pending` or retryable `failed` to `processing`, sends Telegram messages, then records `sent` or `failed`.

## Vercel Deployment

1. Push the repository to GitHub.
2. Open [Vercel](https://vercel.com), click **Add New Project**, and import the GitHub repository.
3. Keep the framework preset as **Next.js**. The included `vercel.json` uses `npm install` and `npm run build`.
4. Add these environment variables in **Project Settings → Environment Variables**:

```env
NEXT_PUBLIC_APP_URL=https://YOUR_VERCEL_DOMAIN.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SECRET_KEY
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_BOT_USERNAME=YOUR_TELEGRAM_BOT_USERNAME_WITHOUT_AT
TELEGRAM_WEBHOOK_SECRET=YOUR_LONG_RANDOM_WEBHOOK_SECRET
SUPABASE_EDGE_FUNCTION_URL=https://YOUR_PROJECT_REF.functions.supabase.co/process-due-reminders
CRON_AUTH_SECRET=YOUR_LONG_RANDOM_CRON_SECRET
ADMIN_EMAILS=your-admin-email@example.com
```

5. Deploy the project.
6. After deployment, set `NEXT_PUBLIC_APP_URL` to the final Vercel production URL if Vercel gave you a different URL, then redeploy.
7. Configure the Telegram webhook to the deployed route:

```powershell
.\scripts\set-telegram-webhook.ps1 `
  -BotToken "YOUR_TELEGRAM_BOT_TOKEN" `
  -AppUrl "https://YOUR_VERCEL_DOMAIN.vercel.app" `
  -WebhookSecret "YOUR_TELEGRAM_WEBHOOK_SECRET"
```

8. Deploy the Supabase Edge Function and Cron job.
9. Create a user, connect Telegram, send a test message, create a reminder, and verify delivery.

The production Telegram webhook URL is:

```text
https://YOUR_VERCEL_DOMAIN.vercel.app/api/telegram/webhook
```

## Manual Testing Checklist

- New user can sign up and gets a profile row.
- User can log in, open `/dashboard`, and log out.
- Unauthenticated users are redirected away from dashboard pages.
- User can create, edit, complete, archive, and delete reminders.
- User cannot read or mutate another user's reminders because of RLS.
- Telegram connection link is generated and opens the bot.
- Expired and used tokens are rejected.
- `/start <token>` connects the correct Telegram chat.
- Test message arrives in Telegram.
- `/disconnect` and website disconnect both deactivate the connection.
- A due reminder sends exactly once and records the Telegram message ID.
- Failed sends store error details and retry up to 3 attempts.
- Snooze creates a future pending notification.
- Recurring reminders schedule the next occurrence without deleting history.
- Telegram inline callbacks cannot modify another user's reminder.

## Troubleshooting

- `Missing environment variable`: confirm the variable exists in `.env.local`, Vercel, or Supabase function secrets.
- Telegram webhook returns 401: confirm `secret_token` matches `TELEGRAM_WEBHOOK_SECRET`.
- Reminders do not send: check Supabase Cron headers, Edge Function logs, active Telegram connection, and pending delivery rows.
- Auth profile missing: rerun the migration and verify the `on_auth_user_created` trigger exists.
- RLS blocks app writes: make sure the request is using the signed-in user's Supabase session, not a public unauthenticated client.
