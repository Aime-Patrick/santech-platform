"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppointmentCalendar } from "@/features/appointments/hooks/use-appointment-calendar";
import { useAdminAppointments, useCreateAdminAppointment } from "@/features/appointments/hooks/use-appointments";
import type { AppointmentCalendarEvent } from "@/features/appointments/api/get-appointment-calendar";

type CalendarView = "day" | "week" | "month";
type AvailabilityDay = {
  day: string;
  weekday: number;
  enabled: boolean;
  start: string;
  end: string;
};

const weekStartsOn = 1 as const;
const hourStart = 7;
const hourEnd = 20;
const hourHeight = 72;
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const defaultAvailability: AvailabilityDay[] = dayNames.map((day, weekday) => ({
  day,
  weekday,
  enabled: weekday > 0 && weekday < 6,
  start: "09:00",
  end: "17:00",
}));

function atStartOfNextDay(date: Date) {
  return addDays(startOfDay(date), 1);
}

function getRange(anchor: Date, view: CalendarView) {
  if (view === "day")
    return { from: startOfDay(anchor), to: atStartOfNextDay(anchor) };
  if (view === "week") {
    const from = startOfWeek(anchor, { weekStartsOn });
    return { from, to: addDays(from, 7) };
  }
  const from = startOfWeek(startOfMonth(anchor), { weekStartsOn });
  return {
    from,
    to: addDays(endOfWeek(endOfMonth(anchor), { weekStartsOn }), 1),
  };
}

function getVisibleDays(anchor: Date, view: CalendarView) {
  const range = getRange(anchor, view);
  return eachDayOfInterval({ start: range.from, end: subDays(range.to, 1) });
}

function CalendarToolbar(props: {
  anchor: Date;
  view: CalendarView;
  onAnchorChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onCreate: () => void;
}) {
  const title =
    props.view === "day"
      ? format(props.anchor, "EEEE, MMMM d, yyyy")
      : props.view === "week"
        ? `${format(startOfWeek(props.anchor, { weekStartsOn }), "MMM d")} – ${format(endOfWeek(props.anchor, { weekStartsOn }), "MMM d, yyyy")}`
        : format(props.anchor, "MMMM yyyy");
  const move = (direction: -1 | 1) => {
    const next =
      props.view === "day"
        ? addDays(props.anchor, direction)
        : props.view === "week"
          ? direction > 0
            ? addWeeks(props.anchor, 1)
            : subWeeks(props.anchor, 1)
          : direction > 0
            ? addMonths(props.anchor, 1)
            : subMonths(props.anchor, 1);
    props.onAnchorChange(next);
  };

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="outline"
          className="rounded-full px-5"
          onClick={() => props.onAnchorChange(new Date())}
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous period"
          onClick={() => move(-1)}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next period"
          onClick={() => move(1)}
        >
          <ChevronRight className="size-5" />
        </Button>
        <h2 className="truncate pl-2 text-lg font-semibold text-slate-950 sm:text-xl">
          {title}
        </h2>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {(["day", "week", "month"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => props.onViewChange(item)}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${props.view === item ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <Button onClick={props.onCreate}>
          <Plus className="size-4" /> New schedule
        </Button>
      </div>
    </div>
  );
}

function AvailabilityBlock({ day, startMinute, endMinute }: { day: Date; startMinute: number; endMinute: number }) {
  const top = ((startMinute - hourStart * 60) / 60) * hourHeight;
  const height = Math.max(((endMinute - startMinute) / 60) * hourHeight, 18);
  if (top + height <= 0 || top >= (hourEnd - hourStart) * hourHeight) return null;
  return <div className="pointer-events-none absolute inset-x-1 z-10 rounded-md border border-indigo-200 bg-indigo-50/70" style={{ top: Math.max(top, 0), height: Math.min(height, (hourEnd - hourStart) * hourHeight - Math.max(top, 0)) }}><span className="sr-only">Available appointment time</span></div>;
}
function EventBlock({
  event,
  day,
}: {
  event: AppointmentCalendarEvent;
  day: Date;
}) {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  if (!isSameDay(startsAt, day)) return null;
  const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
  const endMinutes = endsAt.getHours() * 60 + endsAt.getMinutes();
  const top = ((startMinutes - hourStart * 60) / 60) * hourHeight;
  const height = Math.max(((endMinutes - startMinutes) / 60) * hourHeight, 34);
  if (top < 0 || top >= (hourEnd - hourStart) * hourHeight) return null;
  return (
    <button
      type="button"
      title={`${event.appointmentType.title} with ${event.attendeeName}`}
      className="absolute inset-x-1 z-20 overflow-hidden rounded-md border-l-4 border-indigo-600 bg-indigo-100 px-2 py-1 text-left text-xs text-indigo-950 shadow-sm hover:bg-indigo-200"
      style={{ top, height }}
    >
      <span className="block truncate font-semibold">
        {event.appointmentType.title}
      </span>
      <span className="block truncate">
        {format(startsAt, "h:mm a")} · {event.attendeeName}
      </span>
    </button>
  );
}

function TimeGrid(props: {
  days: Date[];
  events: AppointmentCalendarEvent[];
  availability: Array<{ weekday: number; startMinute: number; endMinute: number }>;
  onSelectRange: (start: Date, end: Date, days: Date[]) => void;
}) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTop = ((currentMinutes - hourStart * 60) / 60) * hourHeight;
  const gridHeight = (hourEnd - hourStart) * hourHeight;
  const [drag, setDrag] = React.useState<{
    fromDay: number;
    toDay: number;
    startMinute: number;
    endMinute: number;
  } | null>(null);
  const columnRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const anchorRef = React.useRef<{ day: number; minute: number } | null>(null);
  const pointerRef = React.useRef<{ x: number; y: number } | null>(null);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  // Snaps the pointer position to the closest 15-minute step, measured as an
  // offset from the top of the grid (0 = hourStart).
  const minuteFromClientY = (rect: DOMRect, clientY: number) => {
    const raw = ((clientY - rect.top) / hourHeight) * 60;
    const snapped = Math.round(raw / 15) * 15;
    return Math.min(Math.max(snapped, 0), gridHeight);
  };

  // Which day column sits under this horizontal position (clamped to the
  // nearest column so dragging past the edge keeps extending the range).
  const dayIndexAtX = (clientX: number) => {
    let best = 0;
    let bestDistance = Infinity;
    columnRefs.current.forEach((column, index) => {
      if (!column) return;
      const rect = column.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        best = index;
        bestDistance = -1;
        return;
      }
      if (bestDistance === -1) return;
      const distance =
        clientX < rect.left ? rect.left - clientX : clientX - rect.right;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  };

  const updateSelection = (x: number, y: number) => {
    const origin = anchorRef.current;
    if (!origin) return;
    const dayIndex = dayIndexAtX(x);
    const column = columnRefs.current[dayIndex];
    if (!column) return;
    const minute = minuteFromClientY(column.getBoundingClientRect(), y);
    setDrag({
      fromDay: Math.min(origin.day, dayIndex),
      toDay: Math.max(origin.day, dayIndex),
      startMinute: Math.min(origin.minute, minute),
      endMinute: Math.max(origin.minute, minute),
    });
  };

  // Google Calendar-style edge scrolling: while a drag is in progress, keep
  // the frame loop alive so the grid scrolls when the pointer approaches the
  // top/bottom edge of the viewport — even if the pointer stops moving.
  const autoScroll = () => {
    // The scrollable ancestor is the grid's direct parent; walking up from our
    // own DOM node keeps this independent of props.
    const container = rootRef.current?.parentElement;
    const pointer = pointerRef.current;
    if (container && pointer && anchorRef.current) {
      const rect = container.getBoundingClientRect();
      const edge = 64;
      let delta = 0;
      if (pointer.y < rect.top + edge) {
        delta = -Math.min((rect.top + edge - pointer.y) / edge, 1) * 14;
      } else if (pointer.y > rect.bottom - edge) {
        delta = Math.min((pointer.y - (rect.bottom - edge)) / edge, 1) * 14;
      }
      if (delta !== 0) {
        container.scrollTop += delta;
        // The columns moved with the scroll, so re-derive the selection from
        // the stationary pointer position.
        updateSelection(pointer.x, pointer.y);
      }
    }
    frameRef.current = requestAnimationFrame(autoScroll);
  };

  // Press-and-drag (mouse, pen, or touch): anchor on one slot, drag across
  // hours and day columns to grow the range, release to open the dialog.
  const startDrag = (dayIndex: number, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const day = props.days[dayIndex];
    const column = columnRefs.current[dayIndex];
    if (!day || !column) return;
    const minute = minuteFromClientY(column.getBoundingClientRect(), event.clientY);
    const anchoredAt = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      0,
      hourStart * 60 + minute,
    );
    if (anchoredAt <= now) return; // no scheduling in the past
    // Only suppress default behavior for the mouse; touch scrolling must keep
    // working (a started scroll cancels the drag via pointercancel below).
    if (event.pointerType === "mouse") event.preventDefault();
    anchorRef.current = { day: dayIndex, minute };
    pointerRef.current = { x: event.clientX, y: event.clientY };
    setDrag({
      fromDay: dayIndex,
      toDay: dayIndex,
      startMinute: minute,
      endMinute: minute,
    });

    const onMove = (moveEvent: PointerEvent) => {
      pointerRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      updateSelection(moveEvent.clientX, moveEvent.clientY);
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      anchorRef.current = null;
      pointerRef.current = null;
      setDrag(null);
    };
    const onUp = () => {
      const origin = anchorRef.current;
      const pointer = pointerRef.current;
      cleanup();
      if (!origin || !pointer) return;
      const dayIndex = dayIndexAtX(pointer.x);
      const column = columnRefs.current[dayIndex];
      const minute = column
        ? minuteFromClientY(column.getBoundingClientRect(), pointer.y)
        : origin.minute;
      const startMin = Math.min(origin.minute, minute);
      let endMin = Math.max(origin.minute, minute);
      // A plain click (no drag) defaults to 30 minutes; an intentional drag
      // keeps the exact range the user selected.
      if (endMin <= startMin) endMin = startMin + 30;
      const days = props.days.slice(
        Math.min(origin.day, dayIndex),
        Math.max(origin.day, dayIndex) + 1,
      );
      const first = days[0];
      const last = days[days.length - 1];
      props.onSelectRange(
        new Date(
          first.getFullYear(),
          first.getMonth(),
          first.getDate(),
          0,
          hourStart * 60 + startMin,
        ),
        new Date(
          last.getFullYear(),
          last.getMonth(),
          last.getDate(),
          0,
          hourStart * 60 + endMin,
        ),
        days,
      );
    };
    // The browser took over the gesture (e.g. a touch scroll): abort quietly.
    const onCancel = cleanup;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    frameRef.current = requestAnimationFrame(autoScroll);
  };

  return (
    <div ref={rootRef} className="min-w-[760px] select-none">
      <div
        className="sticky top-0 z-30 grid border-b border-slate-200 bg-white"
        style={{
          gridTemplateColumns: `72px repeat(${props.days.length}, minmax(120px, 1fr))`,
        }}
      >
        <div className="border-r border-slate-200 p-3 text-xs text-slate-400">
          GMT+2
        </div>
        {props.days.map((day) => (
          <div
            key={day.toISOString()}
            className={`border-r border-slate-200 px-2 py-3 text-center ${isSameDay(day, now) ? "text-indigo-700" : "text-slate-700"}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider">
              {format(day, "EEE")}
            </p>
            <p
              className={`mx-auto mt-1 grid size-9 place-items-center rounded-full text-lg ${isSameDay(day, now) ? "bg-indigo-600 text-white" : ""}`}
            >
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `72px repeat(${props.days.length}, minmax(120px, 1fr))`,
        }}
      >
        <div className="border-r border-slate-200">
          {Array.from({ length: hourEnd - hourStart }, (_, index) => (
            <div
              key={index}
              className="relative border-b border-slate-100 pr-2 text-right text-[11px] text-slate-500"
              style={{ height: hourHeight }}
            >
              <span className="relative -top-2">
                {format(new Date(2026, 0, 1, hourStart + index), "h a")}
              </span>
            </div>
          ))}
        </div>
        {props.days.map((day, dayIndex) => (
          <div
            key={day.toISOString()}
            ref={(element) => {
              columnRefs.current[dayIndex] = element;
            }}
            onPointerDown={(event) => startDrag(dayIndex, event)}
            className={`relative border-r border-slate-200 ${isSameDay(day, now) ? "bg-indigo-50/20" : "bg-white"}`}
          >
            {Array.from({ length: hourEnd - hourStart }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Create schedule on ${format(day, "PP")} at ${format(new Date(2026, 0, 1, hourStart + index), "p")}`}
                className="block w-full border-b border-slate-100 text-left hover:bg-indigo-50/70 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                style={{ height: hourHeight }}
                disabled={
                  new Date(
                    day.getFullYear(),
                    day.getMonth(),
                    day.getDate(),
                    hourStart + index + 1,
                  ) <= now
                }
                onClick={(event) => {
                  // Mouse presses are owned by the drag handler above; this
                  // branch only serves keyboard activation (Enter on a focused
                  // slot reports detail === 0).
                  if (event.detail !== 0) return;
                  const slotStart = new Date(
                    day.getFullYear(),
                    day.getMonth(),
                    day.getDate(),
                    hourStart + index,
                  );
                  props.onSelectRange(
                    slotStart,
                    new Date(slotStart.getTime() + 30 * 60_000),
                    [day],
                  );
                }}
              />
            ))}
            {drag && dayIndex >= drag.fromDay && dayIndex <= drag.toDay ? (
              <div
                className="pointer-events-none absolute inset-x-1 z-20 rounded-md border border-indigo-500 bg-indigo-500/20 text-xs font-semibold text-indigo-800 shadow-sm"
                style={{
                  top:
                    dayIndex === drag.fromDay
                      ? (drag.startMinute / 60) * hourHeight
                      : 0,
                  height: Math.max(
                    (dayIndex === drag.toDay
                      ? (drag.endMinute / 60) * hourHeight
                      : gridHeight) -
                      (dayIndex === drag.fromDay
                        ? (drag.startMinute / 60) * hourHeight
                        : 0),
                    20,
                  ),
                  paddingTop: dayIndex === drag.fromDay ? 4 : 0,
                  paddingLeft: 8,
                }}
              >
                {dayIndex === drag.fromDay && drag.endMinute > drag.startMinute
                  ? `${format(new Date(2026, 0, 1, 0, hourStart * 60 + drag.startMinute), "h:mm a")} – ${format(new Date(2026, 0, 1, 0, hourStart * 60 + drag.endMinute), "h:mm a")}`
                  : null}
              </div>
            ) : null}
            {isSameDay(day, now) &&
            currentTop >= 0 &&
            currentTop <= (hourEnd - hourStart) * hourHeight ? (
              <div
                className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                style={{ top: currentTop }}
              >
                <span className="-ml-1 size-2.5 rounded-full bg-rose-500" />
                <span className="h-px flex-1 bg-rose-500" />
              </div>
            ) : null}
            {props.availability.filter((item) => item.weekday === day.getDay()).map((item, index) => <AvailabilityBlock key={`${day.toISOString()}-availability-${index}`} day={day} startMinute={item.startMinute} endMinute={item.endMinute} />)}
            
            {props.events.map((event) => (
              <EventBlock key={event.id} event={event} day={day} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthGrid(props: {
  anchor: Date;
  events: AppointmentCalendarEvent[];
  onSelectDay: (date: Date) => void;
}) {
  const days = getVisibleDays(props.anchor, "month");
  return (
    <div className="min-w-[760px] bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="border-r border-slate-200 p-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const events = props.events.filter((event) =>
            isSameDay(new Date(event.startsAt), day),
          );
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => props.onSelectDay(day)}
              className={`min-h-32 border-b border-r border-slate-200 p-2 text-left hover:bg-indigo-50/60 ${isSameMonth(day, props.anchor) ? "bg-white" : "bg-slate-50/70 text-slate-400"}`}
            >
              <span
                className={`grid size-7 place-items-center rounded-full text-sm ${isSameDay(day, new Date()) ? "bg-indigo-600 font-semibold text-white" : ""}`}
              >
                {format(day, "d")}
              </span>
              <div className="mt-2 space-y-1">
                {events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="truncate rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-900"
                  >
                    <span className="font-semibold">
                      {format(new Date(event.startsAt), "h:mm a")}
                    </span>{" "}
                    {event.appointmentType.title}
                  </div>
                ))}
                {events.length > 3 ? (
                  <p className="px-2 text-xs font-medium text-slate-500">
                    +{events.length - 3} more
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRange: { start: Date; end: Date; days: Date[] } | null;
}) {
  const mutation = useCreateAdminAppointment();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [duration, setDuration] = React.useState("30");
  const [timezone, setTimezone] = React.useState("Africa/Kigali");
  const [availability, setAvailability] =
    React.useState<AvailabilityDay[]>(defaultAvailability);

  React.useEffect(() => {
    if (!props.open || !props.initialRange) return;
    const weekdays = new Set(props.initialRange.days.map((day) => day.getDay()));
    const start = format(props.initialRange.start, "HH:mm");
    const end = format(props.initialRange.end, "HH:mm");
    setAvailability(
      defaultAvailability.map((item) => ({
        ...item,
        enabled: weekdays.has(item.weekday),
        start,
        end,
      })),
    );
    setDuration(
      String(
        Math.max(
          15,
          Math.round(
            (props.initialRange.end.getTime() -
              props.initialRange.start.getTime()) /
              60_000,
          ),
        ),
      ),
    );
  }, [props.open, props.initialRange]);

  const updateDay = (weekday: number, patch: Partial<AvailabilityDay>) =>
    setAvailability((current) =>
      current.map((item) =>
        item.weekday === weekday ? { ...item, ...patch } : item,
      ),
    );
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const resolvedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    mutation.mutate(
      {
        title,
        slug: resolvedSlug,
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
          props.onOpenChange(false);
          setTitle("");
          setDescription("");
          setAvailability(defaultAvailability);
        },
        onError: (error) =>
          console.error(
            error instanceof Error
              ? error.message
              : "Unable to create schedule",
          ),
      },
    );
  };

  React.useEffect(() => {
    if (!props.open) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") props.onOpenChange(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [props.open, props.onOpenChange]);

  if (!props.open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/10 p-4"
      style={{ zIndex: 2147483647 }}
      onMouseDown={() => props.onOpenChange(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-dialog-title"
        className="relative flex h-[calc(100dvh-2rem)] w-full max-w-[1100px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
          <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" onClick={() => props.onOpenChange(false)} className="absolute right-3 top-3 z-10">
            <X className="size-4" />
          </Button>
        <header className="shrink-0 border-b border-slate-200 px-6 py-6 sm:px-8">
          <h2 id="appointment-dialog-title" className="text-lg font-semibold text-slate-950">Create appointment schedule</h2>
          <p className="mt-1 text-sm text-slate-500">
            {props.initialRange
              ? `${props.initialRange.days.length > 1 ? `${format(props.initialRange.days[0], "EEE, MMM d")} – ${format(props.initialRange.days[props.initialRange.days.length - 1], "EEE, MMM d, yyyy")}` : format(props.initialRange.start, "EEEE, MMMM d")} · ${format(props.initialRange.start, "h:mm a")} – ${format(props.initialRange.end, "h:mm a")}`
              : "Create a reusable booking link and define when guests can book."}
          </p>
        </header>
        <form onSubmit={submit} className="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 pb-28 sm:px-8">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="30-minute consultation"
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What should guests know before booking?"
            />
          </div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div>
              <Label>Duration</Label>
              <select
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                {["15", "30", "45", "60"].includes(duration) ? null : (
                  <option value={duration}>{duration} minutes</option>
                )}
              </select>
            </div>
            <div>
              <Label>Timezone</Label>
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option>Africa/Kigali</option>
                <option>UTC</option>
                <option>Europe/London</option>
                <option>America/New_York</option>
              </select>
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>Weekly availability</Label>
              <span className="text-xs text-slate-500">
                Past dates and times remain unavailable
              </span>
            </div>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {availability.map((item) => (
                <div
                  key={item.weekday}
                  className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:gap-3 sm:py-2.5"
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateDay(item.weekday, { enabled: !item.enabled })
                    }
                    className={`text-left text-sm font-medium ${item.enabled ? "text-slate-900" : "text-slate-400"}`}
                  >
                    {item.day}
                  </button>
                  {item.enabled ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <Input
                        type="time"
                        value={item.start}
                        onChange={(event) =>
                          updateDay(item.weekday, { start: event.target.value })
                        }
                        className="h-9 min-w-0"
                      />
                      <span className="shrink-0 text-slate-400">–</span>
                      <Input
                        type="time"
                        value={item.end}
                        onChange={(event) =>
                          updateDay(item.weekday, { end: event.target.value })
                        }
                        className="h-9 min-w-0"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">Unavailable</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      updateDay(item.weekday, { enabled: !item.enabled })
                    }
                  >
                    <Plus
                      className={`size-4 transition-transform ${item.enabled ? "rotate-45" : ""}`}
                    />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-50 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] sm:px-8">
          {mutation.isError ? (
            <p className="mr-auto max-w-md text-sm text-red-600">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to create the schedule. Please try again."}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => props.onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create draft"}
          </Button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

export function AppointmentCalendarWorkspace() {
  const [view, setView] = React.useState<CalendarView>("week");
  const [anchor, setAnchor] = React.useState(() => new Date());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [initialRange, setInitialRange] = React.useState<{
    start: Date;
    end: Date;
    days: Date[];
  } | null>(null);
  const range = React.useMemo(() => getRange(anchor, view), [anchor, view]);
  const query = useAppointmentCalendar(
    range.from.toISOString(),
    range.to.toISOString(),
  );
  const schedulesQuery = useAdminAppointments();
  const availability = React.useMemo(
    () => (schedulesQuery.data?.data ?? []).flatMap((schedule) => schedule.availability),
    [schedulesQuery.data],
  );
  const days = React.useMemo(
    () => getVisibleDays(anchor, view === "day" ? "day" : "week"),
    [anchor, view],
  );
  const createRange = (range: {
    start: Date;
    end: Date;
    days: Date[];
  } | null) => {
    setInitialRange(range);
    setDialogOpen(true);
  };
  const selectMonthDay = (date: Date) => {
    setAnchor(date);
    setView("day");
  };

  return (
    <main className="min-h-full p-4 text-[#0a1f44]">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">
              Appointments
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review bookings and create availability directly from the
              calendar.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
            <Clock3 className="size-4" /> Africa/Kigali
          </div>
        </div>
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <CalendarToolbar
            anchor={anchor}
            view={view}
            onAnchorChange={setAnchor}
            onViewChange={setView}
            onCreate={() => createRange(null)}
          />
          {query.isError ? (
            <div className="m-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
              {query.error instanceof Error
                ? query.error.message
                : "Unable to load calendar"}
            </div>
          ) : null}
          <div className="max-h-[calc(100vh-250px)] min-h-[600px] overflow-auto">
            {view === "month" ? (
              <MonthGrid
                anchor={anchor}
                events={query.data?.data ?? []}
                onSelectDay={selectMonthDay}
              />
            ) : (
              <TimeGrid
                days={days}
                events={query.data?.data ?? []}
                availability={availability}
                onSelectRange={(start, end, selectedDays) =>
                  createRange({ start, end, days: selectedDays })
                }
              />
            )}
          </div>
          {query.isLoading ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/30">
              <span className="rounded-full bg-white px-4 py-2 text-sm shadow">
                Loading calendar…
              </span>
            </div>
          ) : null}
        </section>
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays className="size-4" /> Click, or press and drag — across
          hours or days — to select a time range and create availability. The
          calendar follows your pointer near the edges. Bookings appear
          automatically when guests reserve a slot.
        </p>
      </div>
      <ScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialRange={initialRange}
      />
    </main>
  );
}
