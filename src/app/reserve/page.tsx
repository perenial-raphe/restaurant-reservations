"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReservePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    datetime: "",
    partySize: 2,
    specialRequests: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);

    const body = {
      date: new Date(form.datetime).toISOString(),
      partySize: Number(form.partySize),
      specialRequests: form.specialRequests || undefined,
    };

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Failed to create reservation");
      return;
    }
    setOk("Reservation created!");
    setTimeout(() => router.push("/reservations"), 800);
  };

  return (
    <section>
      <h1>Reserve a Table</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>
          Date & Time
          <input
            type="datetime-local"
            required
            value={form.datetime}
            onChange={(e) => setForm((f) => ({ ...f, datetime: e.target.value }))}
          />
        </label>
        <label>
          Party Size
          <input
            type="number"
            min={1}
            max={20}
            required
            value={form.partySize}
            onChange={(e) => setForm((f) => ({ ...f, partySize: Number(e.target.value) }))}
          />
        </label>
        <label>
          Special Requests (optional)
          <textarea
            rows={3}
            value={form.specialRequests}
            onChange={(e) => setForm((f) => ({ ...f, specialRequests: e.target.value }))}
          />
        </label>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        {ok && <p style={{ color: "green" }}>{ok}</p>}
        <button disabled={loading} type="submit">
          {loading ? "Booking..." : "Book Table"}
        </button>
      </form>
    </section>
  );
}