import { BookingPage } from "@/components/appointments/booking-page";

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BookingPage slug={slug} />;
}
