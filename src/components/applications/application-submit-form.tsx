"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitApplication } from "@/features/applications";
export function ApplicationSubmitForm({ courses }: { courses: Array<{ id: string; title: string }> }) {
 const mutation=useSubmitApplication();
 function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form=event.currentTarget; mutation.mutate(new FormData(form), { onSuccess:()=>form.reset() }); }
 return <form onSubmit={submit} encType="multipart/form-data" className="grid gap-5 p-6 lg:grid-cols-2"><label className="grid gap-2"><Label>Application type</Label><select name="type" defaultValue="TRAINING" className="h-11 rounded-lg border bg-white px-3 text-sm"><option value="TRAINING">Training</option><option value="FELLOWSHIP">Fellowship</option><option value="JOB">Job</option></select></label><label className="grid gap-2"><Label>Course, if applicable</Label><select name="courseId" defaultValue="" className="h-11 rounded-lg border bg-white px-3 text-sm"><option value="">Select a course</option>{courses.map(course=><option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label className="grid gap-2 lg:col-span-2"><Label>Cover letter or statement</Label><Textarea name="coverLetter" className="min-h-36" required /></label><label className="grid gap-2 lg:col-span-2"><Label>Supporting files (optional)</Label><Input name="files" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /></label>{mutation.error?<p className="text-sm text-red-600 lg:col-span-2">{mutation.error.message}</p>:null}<div className="flex justify-end lg:col-span-2"><Button type="submit" disabled={mutation.isPending} className="bg-[#123568]">{mutation.isPending?"Submitting...":"Submit application"}</Button></div></form>;
}