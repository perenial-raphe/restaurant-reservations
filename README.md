# Restaurant Reservations (Next.js + Prisma + NextAuth)

A minimal full-stack app with user signup/login and table reservations, plus Google Calendar integration and email confirmations/reminders.

## Stack

- Next.js 14 (App Router)
- NextAuth (Credentials provider)
- Prisma ORM with SQLite
- TypeScript
- Google Calendar integration (service account)
- Email delivery via SMTP (Nodemailer)
- Optional scheduled reminders (cron)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your `.env` from the example and fill values:
   ```bash
   cp .env.example .env
   ```

3. Apply Prisma migrations and generate the client:
   ```bash
   npm run prisma:migrate -- --name init
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Google Calendar integration

We use a Google service account to insert events into your restaurant’s Google Calendar.

Steps:
1. In Google Cloud Console, create a project and enable the "Google Calendar API".
2. Create a Service Account and generate a JSON key. Note the `client_email` and `private_key`.
3. Share your restaurant calendar with the service account’s email (as if it’s a user), at least "Make changes to events".
4. Put these into `.env`:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (replace newlines with `\n` if using `.env`)
   - `GOOGLE_CALENDAR_ID` (Calendar settings → Integrate calendar → Calendar ID)
   - `BUSINESS_TIMEZONE` (e.g., `America/New_York`)
   - Optional: `RESERVATION_DURATION_MINUTES` (default 90)

On creating a reservation, the app will:
- Create an event on your calendar for the configured duration
- Add the customer email as an attendee (if available)

## Email confirmations and reminders

- SMTP is configured via environment variables (see `.env.example`).
- On booking, a confirmation email is sent (best-effort).
- Scheduled reminders:
  - Endpoint: `POST /api/reminders`
  - Looks for reservations ~24 hours away and sends a reminder email.
  - Configure a cron (e.g., Vercel Cron) to call this hourly.

Suggested Vercel Cron (vercel.json):
```json
{
  "crons": [
    { "path": "/api/reminders", "schedule": "0 * * * *" }
  ]
}
```

Env for reminders:
- `REMINDER_HOURS_BEFORE` (default 24)
- `REMINDER_WINDOW_MINUTES` (default 60)

## Notes

- Protected routes: `/reserve`, `/reservations`
- Basic availability rule: max 10 reservations per hour
- Adjust business logic and models in `prisma/schema.prisma` and API routes.
