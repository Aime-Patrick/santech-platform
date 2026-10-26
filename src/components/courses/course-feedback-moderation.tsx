"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useModerateFeedback } from "@/features/course-feedback";

type Item = {
  id: string;
  kind: "review" | "comment";
  body: string;
  title?: string | null;
  rating?: number;
  status: string;
  course: { title: string };
  learner: { firstName: string; lastName: string; email: string };
};

export function CourseFeedbackModeration({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const moderationMutation = useModerateFeedback();

  function update(item: Item, status: "PUBLISHED" | "REJECTED") {
    moderationMutation.mutate(
      { kind: item.kind, id: item.id, status },
      { onSuccess: () => setItems((current) => current.filter((entry) => entry.id !== item.id)) },
    );
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No feedback is waiting for moderation.
        </p>
      ) : (
        items.map((item) => {
          const isBusy = moderationMutation.isPending && moderationMutation.variables?.id === item.id;
          return (
            <article key={item.kind + "-" + item.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.kind} · {item.course.title}
                  </p>
                  <h2 className="mt-1 font-semibold">{item.learner.firstName} {item.learner.lastName}</h2>
                  <p className="text-xs text-muted-foreground">{item.learner.email}</p>
                </div>
                {item.rating ? <span className="text-amber-600">{"★".repeat(item.rating)}</span> : null}
              </div>
              {item.title ? <p className="mt-4 font-medium">{item.title}</p> : null}
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" disabled={isBusy} onClick={() => update(item, "PUBLISHED")}>Publish</Button>
                <Button size="sm" variant="outline" disabled={isBusy} onClick={() => update(item, "REJECTED")}>Reject</Button>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}