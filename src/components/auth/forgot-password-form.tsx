"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestPasswordReset } from "@/features/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const mutation = useRequestPasswordReset();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(email.trim());
  }

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[560px] flex-col justify-center">
        <section className="rounded-lg border border-[#e5e6eb] bg-white px-6 py-9 shadow-[0_2px_8px_rgba(10,31,68,0.08)] sm:px-12 sm:py-10">
          <h1 className="text-3xl font-medium tracking-[-0.035em] text-[#243866]">Reset your password</h1>
          <p className="mt-2 text-base leading-6 text-[#5c6287]">Enter the email address on your SAN TECH Platform account. We’ll send a reset link if the account is eligible.</p>
          {mutation.isSuccess ? (
            <div className="mt-7 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900" role="status">
              {mutation.data.message} Check your inbox and spam folder.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="normal-case tracking-normal text-sm font-semibold text-[#172554]">Email address</Label>
                <Input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-[50px] rounded-md border-[#d7d9e3] px-4 focus-visible:ring-[#4a45ff]/30" />
              </div>
              {mutation.error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{mutation.error.message}</p> : null}
              <Button type="submit" disabled={mutation.isPending} className="h-11 w-full bg-[#0a1f44] hover:bg-[#173767]">{mutation.isPending ? "Sending link…" : "Send reset link"}</Button>
            </form>
          )}
          <p className="mt-7 text-sm text-[#5c6287]"><Link href="/login" className="font-semibold text-[#4a45ff] hover:underline">Back to sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
