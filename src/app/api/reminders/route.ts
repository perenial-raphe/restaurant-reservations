import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendReservationReminder } from "@/src/lib/email";

export async function POST() {
  try {
    const hoursBefore = Number(process.env.REMINDER_HOURS_BEFORE || 24);
    const windowMinutes = Number(process.env.REMINDER_WINDOW_MINUTES || 60);

    const now = new Date();
    const start = new Date(now.getTime() + (hoursBefore * 60 - windowMinutes / 2) * 60_000);
    const end = new Date(now.getTime() + (hoursBefore * 60 + windowMinutes / 2) * 60_000);

    const upcoming = await prisma.reservation.findMany({
      where: {
        reminderSent: false,
        date: {
          gte: start,
          lt: end,
        },
      },
      include: { user: true },
      orderBy: { date: "asc" },
      take: 100,
    });

    let sent = 0;
    for (const r of upcoming) {
      const to = r.user.email;
      const ok = await sendReservationReminder({ to, when: r.date, partySize: r.partySize });
      if (ok) {
        await prisma.reservation.update({
          where: { id: r.id },
          data: { reminderSent: true },
        });
        sent++;
      }
    }

    return NextResponse.json({ checked: upcoming.length, remindersSent: sent });
  } catch (e) {
    console.error("Reminder job failed:", e);
    return NextResponse.json({ error: "Reminder job failed" }, { status: 500 });
  }
}