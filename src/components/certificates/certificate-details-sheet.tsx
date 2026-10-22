"use client";

import * as React from "react";
import { useState } from "react";
import {
  Award,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  User,
  X,
  FileCheck2,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type CertificateRecord = {
  id: string;
  certificateNo: string;
  verificationId: string;
  status: string;
  issuedAt: Date | string;
  revokedAt: Date | string | null;
  secureUrl: string | null;
  learner: { firstName: string; lastName: string; email: string };
  course: { title: string };
};

interface CertificateDetailsSheetProps {
  certificate: CertificateRecord;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function CertificateDetailsSheet({
  certificate,
  trigger,
  children,
}: CertificateDetailsSheetProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const revokedDate = certificate.revokedAt
    ? new Date(certificate.revokedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify/${certificate.verificationId}`
    : `/verify/${certificate.verificationId}`;

  const copyVerifyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button variant="ghost" size="sm" className="text-xs">
              View
            </Button>
          )
        }
      >
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-md bg-card border-l border-border flex flex-col">
        <SheetHeader className="border-b border-border p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={certificate.status === "ISSUED" ? "default" : "destructive"}
                  className="text-[11px]"
                >
                  {certificate.status}
                </Badge>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {certificate.certificateNo}
                </span>
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                Certificate Details
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Verified learning credential and public attestation record.
              </SheetDescription>
            </div>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                />
              }
            >
              <X className="size-4" />
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Certificate Badge Visual Preview Box */}
          <div className="rounded-xl border border-border bg-muted/20 p-5 text-center space-y-2">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Award className="size-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">{certificate.course.title}</h4>
            <p className="text-xs text-muted-foreground">
              Presented to{" "}
              <strong className="text-foreground">
                {certificate.learner.firstName} {certificate.learner.lastName}
              </strong>
            </p>
            <p className="text-[11px] text-muted-foreground">Issued on {issuedDate}</p>
          </div>

          {/* Details list */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Credential Information
            </h5>

            <div className="rounded-lg border border-border divide-y divide-border text-xs">
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium text-foreground">
                  {certificate.learner.firstName} {certificate.learner.lastName}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{certificate.learner.email}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Course Track</span>
                <span className="font-medium text-foreground">{certificate.course.title}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-muted-foreground">Issue Date</span>
                <span className="font-medium text-foreground">{issuedDate}</span>
              </div>
              {revokedDate && (
                <div className="flex justify-between p-3 bg-destructive/10">
                  <span className="text-destructive font-medium">Revoked Date</span>
                  <span className="font-medium text-destructive">{revokedDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Verification section */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Public Verification
            </h5>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-mono text-muted-foreground truncate">
                    {verifyUrl}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyVerifyLink}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <div className="pt-1">
                <a
                  href={`/verify/${certificate.verificationId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                >
                  <span>Open Public Verification Page</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Document Asset */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Document Asset
            </h5>
            {certificate.secureUrl ? (
              <a
                href={certificate.secureUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <FileCheck2 className="size-3.5" />
                  <span>Download SVG Certificate Asset</span>
                </div>
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-3">
                Digital attestation verified. PDF/SVG cloud export activates when Cloudinary storage is connected.
              </p>
            )}
          </div>
        </div>

        <SheetFooter className="border-t border-border p-4">
          <SheetClose render={<Button variant="outline" className="w-full">Close</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
