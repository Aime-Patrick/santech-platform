"use client";

import Link from "next/link";
import { BookOpen, Users, Clock3, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type CourseCardData = {
  id: string;
  title: string;
  summary: string | null;
  level: string | null;
  status: string;
  durationWeeks?: number | null;
  _count: { lessons: number; enrollments: number; cohorts?: number };
  instructors: Array<{ instructor: { firstName: string; lastName: string } }>;
};

interface CourseCardProps {
  course: CourseCardData;
}

export function CourseCard({ course }: CourseCardProps) {
  const instructorNames = course.instructors
    .map((i) => `${i.instructor.firstName} ${i.instructor.lastName}`)
    .join(", ");

  return (
    <Link href={`/dashboard/courses/${course.id}`} className="group block h-full">
      <Card className="flex h-full flex-col justify-between overflow-hidden transition-all hover:bg-muted/20">
        <CardHeader className="space-y-2.5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant={
                  course.status === "PUBLISHED"
                    ? "default"
                    : course.status === "DRAFT"
                    ? "secondary"
                    : "outline"
                }
                className="text-[11px]"
              >
                {course.status}
              </Badge>
              {course.level && (
                <Badge variant="outline" className="text-[11px] font-normal">
                  {course.level}
                </Badge>
              )}
            </div>
            {course.durationWeeks ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock3 className="size-3" />
                {course.durationWeeks}w
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {course.summary || "No summary provided for this course pathway."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="pb-3 pt-0">
          {instructorNames ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GraduationCap className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">
                Instructor: <strong className="font-medium text-foreground">{instructorNames}</strong>
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Instructor pending assignment
            </div>
          )}
        </CardContent>

        <div className="mt-auto">
          <Separator />
          <CardFooter className="flex items-center justify-between bg-muted/10 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-muted-foreground" />
                <span>
                  <strong className="font-semibold text-foreground">{course._count.lessons}</strong> lessons
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5 text-muted-foreground" />
                <span>
                  <strong className="font-semibold text-foreground">{course._count.enrollments}</strong> enrolled
                </span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 font-medium text-primary text-xs group-hover:underline">
              View
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}
