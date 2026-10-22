"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, X, BookOpen, Clock, Layers } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slugify";

type CreateCourseAction = (formData: FormData) => void | Promise<void>;

interface CourseCreateDrawerProps {
  action: CreateCourseAction;
  trigger?: React.ReactNode;
}

export function CourseCreateDrawer({ action, trigger }: CourseCreateDrawerProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slug = slugify(title);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Server action will redirect on success, or if error, re-enable button
    try {
      // Normal form submission will invoke action
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button className="gap-2">
              <Plus className="size-4" />
              <span>Create Course</span>
            </Button>
          )
        }
      />
      <DrawerContent className="data-[swipe-axis=x]:sm:[--drawer-content-width:32rem] bg-card border-l border-border">
        <DrawerHeader className="border-b border-border p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DrawerTitle className="text-lg font-bold text-foreground">
                Create Course Pathway
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                Set up a new curriculum track, duration, and learning objectives.
              </DrawerDescription>
            </div>
            <DrawerClose
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                />
              }
            >
              <X className="size-4" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <form action={action} onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="create-course-title">Course Title</Label>
              <Input
                id="create-course-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full-Stack Software Engineering"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-course-slug">URL Key (Slug)</Label>
              <Input
                id="create-course-slug"
                value={slug}
                placeholder="full-stack-software-engineering"
                readOnly
                aria-readonly="true"
                tabIndex={-1}
                className="bg-muted text-muted-foreground text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Auto-generated identifier used for routing and pathway links.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-course-level">Skill Level</Label>
                <Input
                  id="create-course-level"
                  name="level"
                  placeholder="e.g. Intermediate"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-course-duration">Duration (Weeks)</Label>
                <Input
                  id="create-course-duration"
                  name="durationWeeks"
                  type="number"
                  min="1"
                  max="104"
                  placeholder="12"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-course-summary">Short Summary</Label>
              <Input
                id="create-course-summary"
                name="summary"
                maxLength={240}
                placeholder="Build dependable digital products from a real problem to a working release."
              />
              <p className="text-[11px] text-muted-foreground">
                Brief one-liner shown on curriculum overview cards. Max 240 chars.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-course-description">Detailed Description</Label>
              <Textarea
                id="create-course-description"
                name="description"
                rows={4}
                placeholder="Explain what learners will build, the technologies covered, and prerequisites."
              />
            </div>
          </div>

          <DrawerFooter className="border-t border-border p-6">
            <div className="flex items-center justify-end gap-2">
              <DrawerClose
                render={
                  <Button variant="outline" type="button" disabled={isSubmitting}>
                    Cancel
                  </Button>
                }
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Draft Course"}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
