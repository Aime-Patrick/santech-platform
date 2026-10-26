"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAdminAppointment, createPublicBooking, getAdminAppointments, getAppointmentSlots, getPublicAppointment } from "../api/appointments-api";
export function usePublicAppointment(slug: string) { return useQuery({ queryKey: ["public-appointment", slug], queryFn: () => getPublicAppointment(slug), enabled: Boolean(slug), staleTime: 60_000 }); }
export function useAppointmentSlots(slug: string, from: string) { return useQuery({ queryKey: ["appointment-slots", slug, from], queryFn: () => getAppointmentSlots(slug, from), enabled: Boolean(slug && from), refetchInterval: 60_000 }); }
export function useCreatePublicBooking(slug: string) { const queryClient = useQueryClient(); return useMutation({ mutationFn: (body: { startsAt: string; attendeeName: string; attendeeEmail: string; timezone: string; notes?: string }) => createPublicBooking(slug, body), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointment-slots", slug] }) }); }

export function useAdminAppointments() { return useQuery({ queryKey: ["admin-appointments"], queryFn: getAdminAppointments }); }
export function useCreateAdminAppointment() { const queryClient = useQueryClient(); return useMutation({ mutationFn: createAdminAppointment, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-appointments"] }) }); }