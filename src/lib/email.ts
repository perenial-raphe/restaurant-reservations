import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = (process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@example.com";
const FROM_NAME = process.env.FROM_NAME || "Reservations";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP env vars not fully set. Emails will be skipped.");
    return null;
  }
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendReservationConfirmation(params: {
  to: string;
  when: Date;
  partySize: number;
  specialRequests?: string | null;
}) {
  const tx = getTransporter();
  if (!tx) return false;

  const subject = "Your reservation is confirmed";
  const whenStr = params.when.toLocaleString();

  const text = [
    `Thanks for booking!`,
    ``,
    `When: ${whenStr}`,
    `Party size: ${params.partySize}`,
    params.specialRequests ? `Special requests: ${params.specialRequests}` : null,
    ``,
    `We look forward to hosting you.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await tx.sendMail({
      from: { name: FROM_NAME, address: FROM_EMAIL },
      to: params.to,
      subject,
      text,
    });
    return true;
  } catch (e) {
    console.error("Failed to send confirmation email:", e);
    return false;
  }
}

export async function sendReservationReminder(params: {
  to: string;
  when: Date;
  partySize: number;
}) {
  const tx = getTransporter();
  if (!tx) return false;

  const subject = "Reminder: Your reservation is coming up";
  const whenStr = params.when.toLocaleString();

  const text = [
    `This is a friendly reminder of your upcoming reservation.`,
    ``,
    `When: ${whenStr}`,
    `Party size: ${params.partySize}`,
    ``,
    `See you soon!`,
  ].join("\n");

  try {
    await tx.sendMail({
      from: { name: FROM_NAME, address: FROM_EMAIL },
      to: params.to,
      subject,
      text,
    });
    return true;
  } catch (e) {
    console.error("Failed to send reminder email:", e);
    return false;
  }
}