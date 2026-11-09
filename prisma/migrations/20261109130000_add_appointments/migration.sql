-- Create appointment schedules and bookings.
CREATE TYPE "AppointmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "AppointmentBookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

CREATE TABLE "AppointmentType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali',
    "locationLabel" TEXT,
    "locationUrl" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'DRAFT',
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "AppointmentType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppointmentAvailability" (
    "id" TEXT NOT NULL,
    "appointmentTypeId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    CONSTRAINT "AppointmentAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppointmentBooking" (
    "id" TEXT NOT NULL,
    "appointmentTypeId" TEXT NOT NULL,
    "attendeeId" TEXT,
    "attendeeName" TEXT NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "notes" TEXT,
    "status" "AppointmentBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppointmentBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppointmentType_slug_key" ON "AppointmentType"("slug");
CREATE INDEX "AppointmentType_hostId_status_idx" ON "AppointmentType"("hostId", "status");
CREATE UNIQUE INDEX "AppointmentAvailability_appointmentTypeId_weekday_startMinute_endMinute_key"
    ON "AppointmentAvailability"("appointmentTypeId", "weekday", "startMinute", "endMinute");
CREATE INDEX "AppointmentAvailability_appointmentTypeId_weekday_idx"
    ON "AppointmentAvailability"("appointmentTypeId", "weekday");
CREATE UNIQUE INDEX "AppointmentBooking_appointmentTypeId_startsAt_key"
    ON "AppointmentBooking"("appointmentTypeId", "startsAt");
CREATE INDEX "AppointmentBooking_attendeeEmail_startsAt_idx"
    ON "AppointmentBooking"("attendeeEmail", "startsAt");
CREATE INDEX "AppointmentBooking_appointmentTypeId_startsAt_status_idx"
    ON "AppointmentBooking"("appointmentTypeId", "startsAt", "status");

ALTER TABLE "AppointmentAvailability"
    ADD CONSTRAINT "AppointmentAvailability_appointmentTypeId_fkey"
    FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentBooking"
    ADD CONSTRAINT "AppointmentBooking_appointmentTypeId_fkey"
    FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
