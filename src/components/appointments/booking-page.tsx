"use client";

import * as React from "react";
import {
  useAppointmentSlots,
  useCreatePublicBooking,
  usePublicAppointment,
} from "@/features/appointments/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function BookingPage({ slug }: { slug: string }) {
  const [from, setFrom] = React.useState(dateKey(new Date()));
  const [selected, setSelected] = React.useState<string>();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const appointment = usePublicAppointment(slug);
  const slots = useAppointmentSlots(slug, from);
  const booking = useCreatePublicBooking(slug);
  const grouped = React.useMemo(
    () =>
      Object.groupBy?.(slots.data?.data.slots ?? [], (slot) => slot.date) ?? {},
    [slots.data],
  );
  if (appointment.isLoading)
    return (
      <main className="mx-auto max-w-6xl p-8 text-slate-500">
        Loading schedule…
      </main>
    );
  if (appointment.isError || !appointment.data?.data)
    return (
      <main className="mx-auto max-w-6xl p-8">
        This booking link is unavailable.
      </main>
    );
  const details = appointment.data.data;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-[#0a1f44] sm:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounde-md border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#0a1f44] text-lg font-semibold text-white">
              S
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">SAN TECH</p>
              <h1 className="mt-1 text-2xl font-semibold">{details.title}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {details.durationMinutes} minutes ·{" "}
                {details.locationLabel ?? "Online appointment"}
              </p>
            </div>
          </div>
          {details.description ? (
            <p className="mt-5 max-w-2xl text-slate-600">
              {details.description}
            </p>
          ) : null}
        </header>
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
          <section>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Select a time</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {details.timezone}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setFrom(
                    dateKey(
                      new Date(Date.parse(from + "T12:00:00Z") + 7 * 86400000),
                    ),
                  )
                }
              >
                Next 7 days
              </Button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(grouped).map(([date, daySlots]) => (
                <div
                  key={date}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="mb-3 text-sm font-semibold">
                    {new Intl.DateTimeFormat("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(date + "T12:00:00Z"))}
                  </p>
                  <div className="grid gap-2">
                    {(daySlots as any[]).map((slot) => (
                      <Button
                        key={slot.startsAt}
                        variant={
                          selected === slot.startsAt ? "default" : "outline"
                        }
                        className="w-full"
                        onClick={() => setSelected(slot.startsAt)}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {slots.isLoading ? (
              <p className="mt-6 text-sm text-slate-500">
                Refreshing available times…
              </p>
            ) : null}
            {!slots.isLoading && !Object.keys(grouped).length ? (
              <p className="mt-8 rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                No times are available in this window.
              </p>
            ) : null}
          </section>
          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold">Your details</h2>
            <div className="mt-5 grid gap-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <Button
                disabled={!selected || !name || !email || booking.isPending}
                onClick={() =>
                  booking.mutate({
                    startsAt: selected!,
                    attendeeName: name,
                    attendeeEmail: email,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    notes,
                  })
                }
              >
                {booking.isPending ? "Booking…" : "Confirm appointment"}
              </Button>
              {booking.isSuccess ? (
                <p className="text-sm text-emerald-700">
                  Your appointment is confirmed.
                </p>
              ) : null}
              {booking.isError ? (
                <p className="text-sm text-red-600">
                  {(booking.error as Error).message}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
