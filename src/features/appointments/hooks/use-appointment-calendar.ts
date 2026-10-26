"use client";

import { useQuery } from "@tanstack/react-query";
import { getAppointmentCalendar } from "../api/get-appointment-calendar";
import { appointmentKeys } from "../query-keys";

export function useAppointmentCalendar(from: string, to: string) {
  return useQuery({
    queryKey: appointmentKeys.calendar(from, to),
    queryFn: () => getAppointmentCalendar({ from, to }),
    enabled: Boolean(from && to),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
