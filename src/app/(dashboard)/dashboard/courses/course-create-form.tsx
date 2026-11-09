"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slugify";
import { useCreateCourse } from "@/features/courses";

export function CourseCreateForm({ programs }: { programs: Array<{ id: string; title: string }> }) {
  const mutation = useCreateCourse();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const slug = slugify(title);

  return (
    <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(new FormData(event.currentTarget), { onSuccess: () => router.refresh() }); }} className="grid gap-4 border-t border-slate-100 p-5 md:grid-cols-2">
      <label className="grid gap-2">
        <Label htmlFor="course-title">Title</Label>
        <Input id="course-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Full-Stack Software Engineering" required />
      </label>
      <label className="grid gap-2">
        <Label htmlFor="course-program">Program</Label>
        <select id="course-program" name="programId" defaultValue="" required className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="" disabled>Select a program</option>
          {programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}
        </select>
      </label>
      <label className="grid gap-2">
        <Label htmlFor="course-slug">URL key</Label>
        <Input id="course-slug" value={slug} placeholder="full-stack-software-engineering" readOnly aria-readonly="true" tabIndex={-1} className="bg-slate-100 text-slate-500" />
        <span className="text-xs text-slate-500">Generated automatically from the course title.</span>
      </label>
      <label className="grid gap-2">
        <Label htmlFor="course-level">Level</Label>
        <Input id="course-level" name="level" placeholder="Beginner to intermediate" />
      </label>
      <label className="grid gap-2">
        <Label htmlFor="course-duration">Duration in weeks</Label>
        <Input id="course-duration" name="durationWeeks" type="number" min="1" max="104" placeholder="12" />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <Label htmlFor="course-summary">Short summary</Label>
        <Input id="course-summary" name="summary" maxLength={240} placeholder="Build dependable digital products from a real problem to a working release." />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <Label htmlFor="course-description">Description</Label>
        <Textarea id="course-description" name="description" placeholder="Explain what learners will build and how the pathway works." />
      </label>
      {mutation.error ? <p role="alert" className="text-sm text-destructive md:col-span-2">{mutation.error.message}</p> : null}
      <div className="flex justify-end md:col-span-2">
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create draft course"}</Button>
      </div>
    </form>
  );
}
