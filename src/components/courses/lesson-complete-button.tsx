"use client";
import { Button } from "@/components/ui/button";
import { useCompleteLesson } from "@/features/courses";
export function LessonCompleteButton({ lessonId }: { lessonId: string }) { const mutation=useCompleteLesson(); return <Button type="button" size="sm" variant="outline" disabled={mutation.isPending} onClick={()=>mutation.mutate(lessonId)}>{mutation.isPending?"Saving...":"Mark complete"}</Button>; }