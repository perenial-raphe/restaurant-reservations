import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

export default async function MyReservationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <p>Unauthorized</p>;
  }

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
  });

  return (
    <section>
      <h1>My Reservations</h1>
      {reservations.length === 0 ? (
        <p>No reservations yet.</p>
      ) : (
        <ul style={{ padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
          {reservations.map((r) => (
            <li key={r.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
              <strong>{new Date(r.date).toLocaleString()}</strong>
              <div>Party Size: {r.partySize}</div>
              {r.specialRequests ? <div>Notes: {r.specialRequests}</div> : null}
              <div style={{ opacity: 0.6, fontSize: 12 }}>Booked: {r.createdAt.toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}