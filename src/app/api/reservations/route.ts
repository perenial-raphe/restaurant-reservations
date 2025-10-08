import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { createReservationEvent } from "@/src/lib/googleCalendar";
import { sendReservationConfirmation } from "@/src/lib/email";

const createReservationSchema = z.object({
  date: z.string().datetime().transform((s) => new Date(s)),
  partySize: z.number().int().min(1).max(20),
  specialRequests: z.string().max(500).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ reservations });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = createReservationSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const { date, partySize, specialRequests } = parsed.data;

    const startHour = new Date(date);
    startHour.setMinutes(0, 0, 0);
    const endHour = new Date(startHour);
    endHour.setHours(endHour.getHours() + 1);

    const count = await prisma.reservation.count({
      where: {
        date: {
          gte: startHour,
          lt: endHour,
        },
      },
    });

    if (count >= 10) {
      return NextResponse.json({ error: "No availability for this time slot" }, { status: 409 });
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: session.user.id,
        date,
        partySize,
        specialRequests,
      },
    });

    const eventId = await createReservationEvent({
      reservationId: reservation.id,
      start: reservation.date,
      partySize: reservation.partySize,
      customerEmail: session.user.email || null,
      specialRequests: reservation.specialRequests || null,
    });

    if (eventId) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { googleEventId: eventId },
      });
    }

    if (session.user.email) {
      await sendReservationConfirmation({
        to: session.user.email,
        when: reservation.date,
        partySize: reservation.partySize,
        specialRequests: reservation.specialRequests || undefined,
      });
    }

    return NextResponse.json({ reservation: { ...reservation, googleEventId: eventId ?? null } }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}