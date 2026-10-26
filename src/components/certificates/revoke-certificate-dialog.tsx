"use client";
import * as React from "react";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRevokeCertificate } from "@/features/certificates";
export function RevokeCertificateDialog({ certificateId, certificateNo, learnerName, trigger }: { certificateId: string; certificateNo: string; learnerName: string; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const mutation = useRevokeCertificate();
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); mutation.mutate({ certificateId, reason }, { onSuccess: () => { setReason(""); setOpen(false); } }); }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={trigger ? trigger as React.ReactElement : <Button variant="ghost" size="sm" className="text-destructive">Revoke</Button>} /><DialogContent className="sm:max-w-md"><DialogHeader><div className="flex items-center gap-2 text-destructive"><span className="grid size-8 place-items-center rounded-full bg-destructive/10"><AlertTriangle className="size-4" /></span><DialogTitle className="text-base font-semibold">Revoke Certificate</DialogTitle></div><DialogDescription>Revoke <strong>{certificateNo}</strong> issued to <strong>{learnerName}</strong>?</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor={`reason-${certificateId}`}>Reason for revocation</Label><Input id={`reason-${certificateId}`} value={reason} onChange={(event) => setReason(event.target.value)} required /></div><DialogFooter><DialogClose render={<Button variant="outline" type="button" disabled={mutation.isPending}>Cancel</Button>} /><Button type="submit" variant="destructive" disabled={mutation.isPending}>{mutation.isPending ? "Revoking..." : "Confirm Revocation"}</Button></DialogFooter></form></DialogContent></Dialog>;
}