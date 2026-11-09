import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slugify";

const courseSchema = z.object({
  title: z.string().trim().min(3).max(120),
  programId: z.string().min(1),
  summary: z.string().trim().max(240),
  description: z.string().trim().max(3000),
  level: z.string().trim().max(40),
  durationWeeks: z.preprocess(
    (value) => value === "" || value === null ? undefined : Number(value),
    z.number().int().positive().max(104).optional(),
  ),
});

export async function POST(request: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "courses.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    programId: formData.get("programId"),
    summary: String(formData.get("summary") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    level: String(formData.get("level") ?? "").trim(),
    durationWeeks: formData.get("durationWeeks"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid title, program, and course details." }, { status: 400 });
  }

  const program = await prisma.catalogItem.findFirst({
    where: { id: parsed.data.programId, category: "Programs", status: { not: "ARCHIVED" } },
    select: { id: true },
  });
  if (!program) {
    return NextResponse.json({ error: "Select an active program before creating a course." }, { status: 400 });
  }

  const slug = slugify(parsed.data.title);
  try {
    const course = await prisma.$transaction(async (transaction) => {
      const lastProgramCourse = await transaction.catalogProgramCourse.findFirst({
        where: { programId: program.id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const sortOrder = (lastProgramCourse?.sortOrder ?? 0) + 1;

      return transaction.course.create({
        data: {
          title: parsed.data.title,
          slug,
          summary: parsed.data.summary || null,
          description: parsed.data.description || null,
          level: parsed.data.level || null,
          durationWeeks: parsed.data.durationWeeks,
          catalogItem: {
            create: {
              title: parsed.data.title,
              slug,
              category: "Courses",
              subtitle: parsed.data.summary || null,
              description: parsed.data.description || null,
              level: parsed.data.level || null,
              durationMin: parsed.data.durationWeeks ?? null,
              durationUnit: parsed.data.durationWeeks ? "weeks" : null,
              durationLabel: parsed.data.durationWeeks ? `${parsed.data.durationWeeks} weeks` : null,
            },
          },
          programCourses: {
            create: {
              sortOrder,
              program: { connect: { id: program.id } },
            },
          },
        },
        select: { id: true, title: true, slug: true },
      });
    });

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A course with this title or URL slug already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create the course. Please try again." }, { status: 500 });
  }
}
