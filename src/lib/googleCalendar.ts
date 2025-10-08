import { google } from "googleapis";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY_RAW = process.env.GOOGLE_PRIVATE_KEY;
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || "UTC";

if (!CALENDAR_ID) {
  console.warn("GOOGLE_CALENDAR_ID is not set. Calendar events will be skipped.");
}
if (!CLIENT_EMAIL || !PRIVATE_KEY_RAW) {
  console.warn("Google service account credentials are not fully set. Calendar events will be skipped.");
}

const PRIVATE_KEY = PRIVATE_KEY_RAW?.replace(/\\n/g, "\n");

function getCalendarClient() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) return null;
  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

function sanitizeEventId(input: string) {
  return ("resv-" + input.toLowerCase()).replace(/[^a-z0-9-]/g, "-");
}

export async function createReservationEvent(opts: {
  reservationId: string;
  start: Date;
  durationMinutes?: number;
  partySize: number;
  customerEmail?: string | null;
  specialRequests?: string | null;
}) {
  const calendar = getCalendarClient();
  if (!calendar || !CALENDAR_ID) return null;

  const duration = opts.durationMinutes ?? Number(process.env.RESERVATION_DURATION_MINUTES || 90);
  const end = new Date(opts.start.getTime() + duration * 60_000);

  const summary = `Table for ${opts.partySize}`;
  const description = [
    `Reservation ID: ${opts.reservationId}`,
    opts.customerEmail ? `Customer: ${opts.customerEmail}` : null,
    opts.specialRequests ? `Requests: ${opts.specialRequests}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const eventId = sanitizeEventId(opts.reservationId);

  try {
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      sendUpdates: "all",
      requestBody: {
        id: eventId,
        summary,
        description,
        start: { dateTime: opts.start.toISOString(), timeZone: BUSINESS_TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: BUSINESS_TIMEZONE },
        attendees: opts.customerEmail ? [{ email: opts.customerEmail }] : undefined,
      },
    });
    return res.data.id || eventId;
  } catch (e: any) {
    if (e?.code === 409) {
      return eventId;
    }
    console.error("Failed to create Google Calendar event:", e);
    return null;
  }
}