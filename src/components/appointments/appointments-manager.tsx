"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Clock, Plus, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  useAdminAppointments,
  useCreateAdminAppointment,
} from "@/features/appointments/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const defaultAvailability = days.map((day, weekday) => ({
  day,
  weekday,
  enabled: weekday > 0 && weekday < 6,
  start: "09:00",
  end: "17:00",
}));

export function AppointmentsManager() {
  const query = useAdminAppointments();
  const create = useCreateAdminAppointment();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [duration, setDuration] = React.useState("30");
  const [timezone, setTimezone] = React.useState("Africa/Kigali");
  const [availability, setAvailability] = React.useState(defaultAvailability);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date(),
  );

  const updateDay = (
    weekday: number,
    patch: Partial<(typeof defaultAvailability)[number]>,
  ) =>
    setAvailability((current) =>
      current.map((item) =>
        item.weekday === weekday ? { ...item, ...patch } : item,
      ),
    );
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    create.mutate(
      {
        title,
        slug: value,
        description,
        durationMinutes: Number(duration),
        timezone,
        availability: availability
          .filter((item) => item.enabled)
          .map((item) => ({
            weekday: item.weekday,
            startMinute:
              Number(item.start.slice(0, 2)) * 60 + Number(item.start.slice(3)),
            endMinute:
              Number(item.end.slice(0, 2)) * 60 + Number(item.end.slice(3)),
          })),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setSlug("");
          setDescription("");
        },
      },
    );
  };

  return (
    <main className="min-h-full bg-slate-50/60 p-6 text-[#0a1f44] sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-semibold">Appointments</h1>
            <p className="mt-2 text-slate-600">
              Create schedules and share booking links.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New schedule
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[92vh] w-[min(1180px,calc(100vw-2rem))] max-w-none overflow-hidden p-0">
            <div className="grid min-h-[650px] lg:grid-cols-[380px_1fr]">
              <section className="overflow-y-auto border-r border-slate-200 bg-slate-50/80 p-6">
                <DialogHeader>
                  <DialogTitle>Bookable appointment schedule</DialogTitle>
                  <DialogDescription>
                    Set the duration and recurring hours people can book.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-6 grid gap-5">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="30-minute consultation"
                    />
                  </div>
                  <div>
                    <Label>URL slug</Label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="consultation"
                    />
                  </div>
                  <div>
                    <Label>Appointment duration</Label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What should guests know?"
                    />
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option>Africa/Kigali</option>
                      <option>UTC</option>
                      <option>Europe/London</option>
                      <option>America/New_York</option>
                    </select>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label>General availability</Label>
                      <button
                        type="button"
                        className="text-xs font-medium text-indigo-600"
                        onClick={() => setAvailability(defaultAvailability)}
                      >
                        Reset
                      </button>
                    </div>
                    <div className="space-y-2">
                      {availability.map((item) => (
                        <div
                          key={item.weekday}
                          className="grid grid-cols-[42px_1fr_auto] items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateDay(item.weekday, {
                                enabled: !item.enabled,
                              })
                            }
                            className={
                              item.enabled
                                ? "text-sm font-medium text-slate-900"
                                : "text-sm text-slate-400"
                            }
                          >
                            {item.day}
                          </button>
                          {item.enabled ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="time"
                                value={item.start}
                                onChange={(e) =>
                                  updateDay(item.weekday, {
                                    start: e.target.value,
                                  })
                                }
                                className="h-9"
                              />
                              <span className="text-slate-400">–</span>
                              <Input
                                type="time"
                                value={item.end}
                                onChange={(e) =>
                                  updateDay(item.weekday, {
                                    end: e.target.value,
                                  })
                                }
                                className="h-9"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Unavailable
                            </span>
                          )}
                          <button
                            type="button"
                            className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-white"
                            onClick={() =>
                              updateDay(item.weekday, {
                                enabled: !item.enabled,
                              })
                            }
                          >
                            {item.enabled ? (
                              <X className="size-4" />
                            ) : (
                              <Plus className="size-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                    {create.isError ? (
                      <p className="mr-auto max-w-md text-sm text-red-600">
                        {create.error instanceof Error
                          ? create.error.message
                          : "Unable to save the schedule. Please try again."}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={create.isPending}>
                      {create.isPending ? "Saving..." : "Save draft"}
                    </Button>
                  </div>
                </form>
              </section>
              <section className="hidden overflow-auto bg-white p-6 lg:block">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Schedule calendar
                    </p>
                    <h3 className="mt-1 text-xl font-semibold">
                      Choose a date to review
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="size-4" /> {timezone}
                  </div>
                </div>
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={{ before: new Date() }}
                    className="mx-auto [--cell-size:2.5rem]"
                  />
                </div>
                <div className="mt-8 grid grid-cols-7 overflow-hidden rounded-xl border border-slate-200">
                  <div className="border-b border-r border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    GMT
                  </div>
                  {days.map((day) => (
                    <div
                      key={day}
                      className="border-b border-r border-slate-200 bg-slate-50 p-3 text-center text-xs font-semibold"
                    >
                      {day}
                    </div>
                  ))}
                  <div className="border-r border-slate-200 text-xs text-slate-400">
                    {[
                      "8 AM",
                      "9 AM",
                      "10 AM",
                      "11 AM",
                      "12 PM",
                      "1 PM",
                      "2 PM",
                      "3 PM",
                      "4 PM",
                      "5 PM",
                    ].map((time) => (
                      <div
                        key={time}
                        className="h-14 border-b border-slate-100 px-2 pt-1"
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                  {availability.map((item) => (
                    <div
                      key={item.weekday}
                      className="relative border-r border-slate-200"
                    >
                      {Array.from({ length: 10 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-14 border-b border-slate-100"
                        />
                      ))}
                      {item.enabled ? (
                        <div className="absolute inset-x-1 top-14 h-[448px] rounded-lg border border-indigo-200 bg-indigo-100/80 p-2 text-xs font-medium text-indigo-800">
                          {item.start} – {item.end}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </DialogContent>
        </Dialog>
        <div className="grid gap-4 md:grid-cols-2">
          {query.data?.data.map((item) => (
            <article
              key={item.id}
              className="rounde-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-slate-100">
                    <CalendarIcon className="size-5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="text-sm text-slate-500">/book/{item.slug}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
                  {item.status}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                {item.durationMinutes} minutes · {item.timezone} ·{" "}
                {item._count.bookings} bookings
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
