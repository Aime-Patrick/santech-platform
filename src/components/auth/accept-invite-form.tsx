"use client";

import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InvitationDetails = { email: string; firstName: string; lastName: string; roles: string[]; expiresAt: string };

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setError("This invitation link is missing its token."); setLoading(false); return; }
    fetch(`/api/auth/invitations/verify?token=${encodeURIComponent(token)}`)
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body as InvitationDetails; })
      .then((body) => { setDetails(body); setFirstName(body.firstName); setLastName(body.lastName); })
      .catch((verificationError) => setError(verificationError instanceof Error ? verificationError.message : "This invitation is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, firstName, lastName, password }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "The invitation could not be accepted.");
      router.replace("/dashboard");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "The invitation could not be accepted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[560px] flex-col justify-center">
        <section className="rounded-lg border border-[#e5e6eb] bg-white px-6 py-9 shadow-[0_2px_8px_rgba(10,31,68,0.08)] sm:px-12 sm:py-10">
          <div className="text-center"><Image src="/santech.png" alt="SAN TECH" width={130} height={108} className="mx-auto h-[92px] w-auto object-contain" priority /><h1 className="mt-6 text-3xl font-medium tracking-[-0.035em] text-[#243866] sm:text-4xl">Complete your SAN TECH account</h1><p className="mt-2 text-base text-[#5c6287]">Set your password to enter the platform.</p></div>
          {loading ? <div className="mt-12 space-y-3"><div className="h-12 animate-pulse rounded-md bg-slate-100" /><div className="h-12 animate-pulse rounded-md bg-slate-100" /></div> : details ? <form onSubmit={onSubmit} className="mt-10 space-y-6"><div className="rounded-md border border-[#dbe4ef] bg-[#f7fbfe] px-4 py-3"><p className="text-xs font-black uppercase tracking-[0.15em] text-[#00a3e0]">Invitation for</p><p className="mt-1 font-semibold text-[#0a1f44]">{details.email}</p><p className="mt-1 text-xs text-[#6e7b91]">Access: {details.roles.join(" · ")}</p></div><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2"><Label htmlFor="accept-first-name" className="normal-case tracking-normal text-sm font-semibold text-[#343952]">First name</Label><Input id="accept-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required className="h-12 rounded-md border-[#d7d9e3] bg-white px-4 text-base focus:border-[#4a45ff]" /></label><label className="grid gap-2"><Label htmlFor="accept-last-name" className="normal-case tracking-normal text-sm font-semibold text-[#343952]">Last name</Label><Input id="accept-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required className="h-12 rounded-md border-[#d7d9e3] bg-white px-4 text-base focus:border-[#4a45ff]" /></label></div><label className="grid gap-2"><Label htmlFor="accept-password" className="normal-case tracking-normal text-sm font-semibold text-[#343952]">Password<span className="text-red-500">*</span></Label><div className="relative"><Input id="accept-password" type={showPassword ? "text" : "password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 rounded-md border-[#d7d9e3] bg-white px-4 pr-12 text-base focus:border-[#4a45ff]" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9294b2]">{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div><span className="text-xs text-[#7a809b]">Use at least 8 characters.</span></label><label className="grid gap-2"><Label htmlFor="accept-confirm-password" className="normal-case tracking-normal text-sm font-semibold text-[#343952]">Confirm password<span className="text-red-500">*</span></Label><Input id="accept-confirm-password" type={showPassword ? "text" : "password"} minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="h-12 rounded-md border-[#d7d9e3] bg-white px-4 text-base focus:border-[#4a45ff]" /></label>{error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}<Button type="submit" disabled={submitting} className="h-11 w-full rounded-md bg-[#4a45ff] hover:bg-[#3934db]">{submitting ? "Creating account…" : "Create account"}</Button></form> : <div className="mt-10 rounded-md border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700" role="alert">{error}</div>}
        </section>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#69708f]"><CheckCircle2 className="size-4" /> Your access is managed by SAN TECH.</div>
      </div>
    </main>
  );
}
