import { CourseMutationForm } from "@/components/courses/course-mutation-form";
import Link from "next/link";
import { LessonCompleteButton } from "@/components/courses/lesson-complete-button";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";
import { hasPermission, requirePermission } from "@/lib/authorization/permissions";
import { getCourseById, getLearnerEnrollment } from "@/lib/services/course-service";
import {
  getCompletedLessonIds,
  getCourseCohorts,
  getCourseEnrollments,
} from "@/lib/services/learning-service";
import { listInstructors } from "@/lib/services/instructor-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CourseFeedback } from "@/components/courses/course-feedback";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const actor = await requirePermission("courses.view");
  const course = await getCourseById(courseId);
  if (!course) notFound();

  const canManage = hasPermission(actor, "courses.update");
  const canManageLessons = hasPermission(actor, "lessons.manage");
  const canManageCohorts = hasPermission(actor, "cohorts.manage");
  const canApply = hasPermission(actor, "enrollments.apply");

  const enrollment = canApply ? await getLearnerEnrollment(course.id, actor.id) : null;
  const canLearn = enrollment && ["APPROVED", "ACTIVE", "COMPLETED"].includes(enrollment.status);

  const [completedLessonRecords, cohorts, courseEnrollments, instructors] = await Promise.all([
    canLearn ? getCompletedLessonIds(course.id, actor.id) : Promise.resolve([]),
    canManageCohorts ? getCourseCohorts(course.id) : Promise.resolve([]),
    canManageCohorts ? getCourseEnrollments(course.id) : Promise.resolve([]),
    canManage ? listInstructors() : Promise.resolve([]),
  ]);

  const completedLessonIds = new Set(completedLessonRecords.map((record: { lessonId: string }) => record.lessonId));
  if (course.status !== "PUBLISHED" && !canManage) notFound();

  const completedCount = completedLessonIds.size;
  const totalLessons = course.lessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Navigation bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Back to courses</span>
        </Link>
      </div>

      {/* Main Course Header Card */}
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  course.status === "PUBLISHED"
                    ? "default"
                    : course.status === "DRAFT"
                    ? "secondary"
                    : "outline"
                }
              >
                {course.status}
              </Badge>
              {course.level && (
                <Badge variant="outline" className="font-normal">
                  {course.level}
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {course.title}
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {course.description || course.summary || "This learning pathway is being prepared."}
            </CardDescription>
          </div>

          {canManage && (
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              {course.status !== "PUBLISHED" && (
                <CourseMutationForm kind="status" courseId={course.id}>
                  <input type="hidden" name="status" value="PUBLISHED" />
                  <Button type="submit" size="sm">
                    Publish
                  </Button>
                </CourseMutationForm>
              )}
              {course.status !== "DRAFT" && (
                <CourseMutationForm kind="status" courseId={course.id}>
                  <input type="hidden" name="status" value="DRAFT" />
                  <Button type="submit" size="sm" variant="outline">
                    Move to draft
                  </Button>
                </CourseMutationForm>
              )}
              {course.status !== "ARCHIVED" && (
                <CourseMutationForm kind="status" courseId={course.id}>
                  <input type="hidden" name="status" value="ARCHIVED" />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Archive
                  </Button>
                </CourseMutationForm>
              )}
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="flex flex-wrap items-center gap-6 pt-4 text-xs text-muted-foreground sm:text-sm">
          <div className="inline-flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <span>
              <strong className="font-semibold text-foreground">{course._count.lessons}</strong> lessons
            </span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span>
              <strong className="font-semibold text-foreground">{course._count.enrollments}</strong> learners
            </span>
          </div>
          {course.durationWeeks ? (
            <div className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-muted-foreground" />
              <span>
                <strong className="font-semibold text-foreground">{course.durationWeeks}</strong> weeks
              </span>
            </div>
          ) : null}
          {course.instructors.length > 0 && (
            <div className="inline-flex items-center gap-2">
              <GraduationCap className="size-4 text-muted-foreground" />
              <span>
                Instructor:{" "}
                <strong className="font-semibold text-foreground">
                  {course.instructors
                    .map(({ instructor }) => `${instructor.firstName} ${instructor.lastName}`)
                    .join(", ")}
                </strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        {/* Left Column: Lessons and Cohorts */}
        <div className="space-y-6">
          {/* Lessons sequence */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold">Course Curriculum</CardTitle>
                <CardDescription>Structured lessons and progression for this course</CardDescription>
              </div>
              <Badge variant="outline">{course.lessons.length} total</Badge>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {course.lessons.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No lessons have been added to this course yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {course.lessons.map((lesson) => {
                    const completed = completedLessonIds.has(lesson.id);
                    return (
                      <div key={lesson.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                            completed
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {completed ? (
                            <CheckCircle2 className="size-4 text-primary" />
                          ) : (
                            String(lesson.sortOrder).padStart(2, "0")
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-foreground">{lesson.title}</h3>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {lesson.description || "Lesson content will be accessible in the learning portal."}
                          </p>
                        </div>
                        {canLearn ? (
                          completed ? (
                            <Badge variant="outline" className="self-center font-medium text-primary">
                              Complete
                            </Badge>
                          ) : (
                            <div className="self-center"><LessonCompleteButton lessonId={lesson.id} /></div>
                          )
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cohorts & Operations */}
          {canManageCohorts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Cohorts & Delivery</CardTitle>
                <CardDescription>
                  Manage scheduled groups, track learner allocations, and assign instructors
                </CardDescription>
              </CardHeader>

              <Separator />

              <CardContent className="space-y-6 pt-4">
                {/* Create cohort form */}
                <CourseMutationForm kind="cohort" courseId={course.id} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-end rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-name">Cohort Name</Label>
                    <Input id="cohort-name" name="name" placeholder="Cohort 2027 / Q1" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-start">Starts</Label>
                    <Input id="cohort-start" name="startsAt" type="date" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-end">Ends</Label>
                    <Input id="cohort-end" name="endsAt" type="date" />
                  </div>
                  <Button type="submit" size="sm" className="h-9">
                    Create
                  </Button>
                </CourseMutationForm>

                {/* Assign instructor */}
                {canManage && instructors.length > 0 && (
                  <CourseMutationForm kind="instructor" courseId={course.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="min-w-64 flex-1 space-y-1.5">
                      <Label htmlFor="course-instructor">Assign Instructor</Label>
                      <select
                        id="course-instructor"
                        name="instructorId"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select an instructor
                        </option>
                        {instructors.map((instructor) => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.firstName} {instructor.lastName} {String.fromCharCode(183)} {instructor.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" size="sm" variant="outline" className="h-9">
                      Assign instructor
                    </Button>
                  </CourseMutationForm>
                )}

                {/* Cohorts grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {cohorts.length === 0 ? (
                    <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                      No cohorts scheduled for this course yet.
                    </div>
                  ) : (
                    cohorts.map((cohort) => {
                      const assignedIds = new Set(cohort.members.map(({ learner }) => learner.id));
                      const availableLearners = courseEnrollments.filter(
                        ({ learner }) => !assignedIds.has(learner.id)
                      );

                      return (
                        <div
                          key={cohort.id}
                          className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 space-y-4"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-foreground">{cohort.name}</h4>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {cohort.members.length} member{cohort.members.length === 1 ? "" : "s"}
                                  {cohort.startsAt ? `${String.fromCharCode(183)} Starts ${cohort.startsAt.toLocaleDateString()}` : ""}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {cohort.status}
                              </Badge>
                            </div>

                            <div className="mt-3 space-y-1">
                              {cohort.members.length === 0 ? (
                                <p className="text-xs italic text-muted-foreground">No learners assigned yet</p>
                              ) : (
                                cohort.members.map(({ learner }) => (
                                  <p key={learner.id} className="text-xs text-muted-foreground">
                                    {String.fromCharCode(8226)} {learner.firstName} {learner.lastName}
                                  </p>
                                ))
                              )}
                            </div>
                          </div>

                          {availableLearners.length > 0 && (
                            <CourseMutationForm kind="learner" courseId={course.id} cohortId={cohort.id} className="flex gap-2 pt-2 border-t border-border">
                              <select
                                name="learnerId"
                                className="min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Assign learner
                                </option>
                                {availableLearners.map(({ learner }) => (
                                  <option key={learner.id} value={learner.id}>
                                    {learner.firstName} {learner.lastName}
                                  </option>
                                ))}
                              </select>
                              <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
                                Assign
                              </Button>
                            </CourseMutationForm>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Pathway & Management sidebar */}
        <div className="space-y-6">
          {/* Pathway status card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Your Pathway</CardTitle>
              <CardDescription>Enrollment and progress overview</CardDescription>
            </CardHeader>

            <Separator />

            <CardContent className="space-y-4 pt-4">
              {enrollment ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 className="size-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold capitalize text-foreground">
                        Enrollment {enrollment.status.toLowerCase()}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Applied {enrollment.appliedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {canLearn && totalLessons > 0 && (
                    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex justify-between text-xs font-medium text-foreground">
                        <span>Progress</span>
                        <span>
                          {completedCount} of {totalLessons} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Your application is recorded. Review modules, join scheduled cohorts, and mark lessons complete as you progress.
                  </p>
                </div>
              ) : canApply ? (
                <CourseMutationForm kind="enroll" courseId={course.id} className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Ready to begin?</h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Apply for this course track to join the next cohort and get instructor guidance.
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    Apply for enrollment
                  </Button>
                </CourseMutationForm>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Your account has preview access to this curriculum.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Add lesson form for course managers */}
          {canManageLessons && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Plus className="size-4 text-primary" />
                <CardTitle className="text-base font-semibold">Add Lesson</CardTitle>
              </CardHeader>

              <Separator />

              <CardContent className="pt-4">
                <CourseMutationForm kind="lesson" courseId={course.id} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lesson-title">Lesson Title</Label>
                    <Input
                      id="lesson-title"
                      name="title"
                      placeholder="e.g. Introduction to System Architecture"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lesson-description">Description</Label>
                    <Textarea
                      id="lesson-description"
                      name="description"
                      placeholder="What key concepts will learners discover?"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Add lesson
                  </Button>
                </CourseMutationForm>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <CourseFeedback courseId={course.id} canReview={enrollment?.status === "COMPLETED"} />
    </div>
  );
}



