"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Award,
  ExternalLink,
  Search,
  X,
  FileCheck2,
  AlertTriangle,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CertificateDetailsSheet, type CertificateRecord } from "./certificate-details-sheet";
import { RevokeCertificateDialog } from "./revoke-certificate-dialog";

type RevokeAction = (certificateId: string, formData: FormData) => void | Promise<void>;

interface CertificateTableProps {
  certificates: CertificateRecord[];
  canRevoke: boolean;
  revokeAction: RevokeAction;
  title?: string;
  description?: string;
}

export function CertificateTable({
  certificates,
  canRevoke,
  revokeAction,
  title = "Certificate Register",
  description = "Official record of verified completion credentials issued across all tracks.",
}: CertificateTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ISSUED" | "REVOKED">("ALL");

  const issuedCount = useMemo(
    () => certificates.filter((c) => c.status === "ISSUED").length,
    [certificates]
  );
  const revokedCount = useMemo(
    () => certificates.filter((c) => c.status === "REVOKED").length,
    [certificates]
  );

  const filtered = useMemo(() => {
    return certificates.filter((cert) => {
      if (statusFilter !== "ALL" && cert.status !== statusFilter) {
        return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchNo = cert.certificateNo.toLowerCase().includes(q);
      const matchCourse = cert.course.title.toLowerCase().includes(q);
      const matchLearner =
        cert.learner.firstName.toLowerCase().includes(q) ||
        cert.learner.lastName.toLowerCase().includes(q) ||
        cert.learner.email.toLowerCase().includes(q);

      return matchNo || matchCourse || matchLearner;
    });
  }, [certificates, search, statusFilter]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Status filter pills */}
          <div className="flex items-center gap-1">
            <Button
              variant={statusFilter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("ALL")}
              className="h-8 gap-1.5 px-2.5 text-xs font-medium"
            >
              <span>All</span>
              <Badge
                variant={statusFilter === "ALL" ? "secondary" : "outline"}
                className="px-1 py-0 text-[10px]"
              >
                {certificates.length}
              </Badge>
            </Button>

            <Button
              variant={statusFilter === "ISSUED" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("ISSUED")}
              className="h-8 gap-1.5 px-2.5 text-xs font-medium"
            >
              <span>Issued</span>
              <Badge
                variant={statusFilter === "ISSUED" ? "secondary" : "outline"}
                className="px-1 py-0 text-[10px]"
              >
                {issuedCount}
              </Badge>
            </Button>

            {revokedCount > 0 && (
              <Button
                variant={statusFilter === "REVOKED" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("REVOKED")}
                className="h-8 gap-1.5 px-2.5 text-xs font-medium"
              >
                <span>Revoked</span>
                <Badge
                  variant={statusFilter === "REVOKED" ? "secondary" : "outline"}
                  className="px-1 py-0 text-[10px]"
                >
                  {revokedCount}
                </Badge>
              </Button>
            )}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search #, learner, course..."
              className="h-8 pl-8 pr-7 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Award className="mx-auto size-8 text-muted-foreground" />
            <h4 className="mt-2 text-sm font-semibold text-foreground">No certificates found</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {search
                ? `No certificates matched "${search}". Try another search query.`
                : "No certificates have been issued under this view yet."}
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                className="mt-3 text-xs"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-36">Certificate #</TableHead>
                <TableHead>Course Track</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead className="w-32">Issued</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cert) => {
                const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <TableRow key={cert.id} className="transition-colors hover:bg-muted/40">
                    {/* Certificate # */}
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      <CertificateDetailsSheet
                        certificate={cert}
                        trigger={
                          <button className="text-left font-mono hover:text-primary hover:underline">
                            {cert.certificateNo}
                          </button>
                        }
                      />
                    </TableCell>

                    {/* Course Title */}
                    <TableCell>
                      <div className="font-medium text-foreground text-sm line-clamp-1">
                        {cert.course.title}
                      </div>
                    </TableCell>

                    {/* Recipient */}
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">
                        {cert.learner.firstName} {cert.learner.lastName}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {cert.learner.email}
                      </div>
                    </TableCell>

                    {/* Issued Date */}
                    <TableCell className="text-xs text-muted-foreground">
                      {issuedDate}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant={cert.status === "ISSUED" ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {cert.status}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Slide-over details sheet */}
                        <CertificateDetailsSheet
                          certificate={cert}
                          trigger={
                            <Button variant="ghost" size="icon-xs" title="View certificate details">
                              <Eye className="size-3.5" />
                              <span className="sr-only">Details</span>
                            </Button>
                          }
                        />

                        {/* Public verify link */}
                        <a
                          href={`/verify/${cert.verificationId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Open public verification page"
                        >
                          <ExternalLink className="size-3.5" />
                          <span className="sr-only">Verify</span>
                        </a>

                        {/* Revoke dialog */}
                        {canRevoke && cert.status === "ISSUED" && (
                          <RevokeCertificateDialog
                            certificateId={cert.id}
                            certificateNo={cert.certificateNo}
                            learnerName={`${cert.learner.firstName} ${cert.learner.lastName}`}
                            action={revokeAction.bind(null, cert.id)}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                Revoke
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
