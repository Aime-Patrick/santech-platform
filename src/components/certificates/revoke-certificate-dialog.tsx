"use client";

import * as React from "react";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RevokeAction = (formData: FormData) => void | Promise<void>;

interface RevokeCertificateDialogProps {
  certificateId: string;
  certificateNo: string;
  learnerName: string;
  action: RevokeAction;
  trigger?: React.ReactNode;
}

export function RevokeCertificateDialog({
  certificateId,
  certificateNo,
  learnerName,
  action,
  trigger,
}: RevokeCertificateDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              Revoke
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2 text-destructive">
            <span className="grid size-8 place-items-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-4" />
            </span>
            <DialogTitle className="text-base font-semibold">Revoke Certificate</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to revoke credential <strong className="text-foreground">{certificateNo}</strong> issued to{" "}
            <strong className="text-foreground">{learnerName}</strong>? This will permanently invalidate the certificate on the public verification portal.
          </DialogDescription>
        </DialogHeader>

        <form action={action} onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor={`reason-${certificateId}`} className="text-xs font-medium">
              Reason for Revocation
            </Label>
            <Input
              id={`reason-${certificateId}`}
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Credential issued in error, or course requirements unmet"
              className="text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <DialogClose
              render={
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  Cancel
                </Button>
              }
            />
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Revoking..." : "Confirm Revocation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
