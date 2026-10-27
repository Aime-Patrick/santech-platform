import { MessageSquare } from "lucide-react";
import { requirePermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CourseFeedbackModeration } from "@/components/courses/course-feedback-moderation";

export default async function CourseFeedbackPage() {
  await requirePermission("courses.update");
  const [reviews, comments] = await Promise.all([
    prisma.courseReview.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { course: { select: { title: true } }, learner: { select: { firstName: true, lastName: true, email: true } } } }),
    prisma.courseComment.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { course: { select: { title: true } }, learner: { select: { firstName: true, lastName: true, email: true } } } }),
  ]);
  const items = [...reviews.map((item: (typeof reviews)[number]) => ({ ...item, kind: "review" as const })), ...comments.map((item: (typeof comments)[number]) => ({ ...item, kind: "comment" as const }))];
  return <section className="space-y-6"><PageHeader title="Course feedback" description="Review learner ratings, reviews, and comments before they appear publicly." actions={<MessageSquare className="size-5 text-primary" />} /><CourseFeedbackModeration initialItems={items} /></section>;
}
