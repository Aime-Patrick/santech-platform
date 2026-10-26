"use client";

import * as React from "react";
import { useState } from "react";
import { Award, CheckCircle2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIssueCertificate } from "@/features/certificates";

export type EligibleEnrollment = {
  id: string;
  completedAt: Date | string | null;
  learner: { firstName: string; lastName: string; email: string };
  course: { title: string };
};

export function EligibleCompletionsTable({ eligible }: { eligible: EligibleEnrollment[] }) {
  const mutation = useIssueCertificate();

  if (eligible.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Eligible Completions</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {eligible.length} pending
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Learners who have completed all course requirements and are awaiting certificate issuance.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Learner</TableHead>
              <TableHead>Course Track</TableHead>
              <TableHead className="w-36">Completed</TableHead>
              <TableHead className="w-36 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eligible.map((item) => {
              const completedDate = item.completedAt
                ? new Date(item.completedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Recently";

              const isPending = mutation.isPending;

              return (
                <TableRow key={item.id} className="transition-colors hover:bg-muted/40">
                  <TableCell>
                    <div className="text-xs font-semibold text-foreground">
                      {item.learner.firstName} {item.learner.lastName}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.learner.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground line-clamp-1">
                      {item.course.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {completedDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(item.id); }}>

                      <Button
                        type="submit"
                        size="sm"
                        disabled={isPending}
                        className="h-7 text-xs">
                        {isPending ? "Issuing..." : "Issue Certificate"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
