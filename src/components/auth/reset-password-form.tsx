"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompletePasswordReset, usePasswordResetToken } from "@/features/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const tokenQuery = usePasswordResetToken(token);
  const mutation = useCompletePasswordReset();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) return;
    mutation.mutate({ token, password });
  }

  const tokenValid = Boolean(token && tokenQuery.data?.valid);
  const tokenUnavailable = !token || (!tokenQuery.isLoading && !tokenQuery.isError && !tokenValid) || tokenQuery.isError;

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[560px] flex-col justify-center">
        <section className="rounded-lg border border-[#e5e6eb] bg-white px-6 py-9 shadow-[0_2px_8px_rgba(10,31,68,0.08)] sm:px-12 sm:py-10">
          <h1 className="text-3xl font-medium tracking-[-0.035em] text-[#243866]">Choose a new password</h1>
          <p className="mt-2 text-base leading-6 text-[#5c6287]">Your reset link expires after 30 minutes and can only be used once.</p>
          {tokenQuery.isLoading ? <p className="mt-7 text-sm text-[#5c6287]">Checking your reset link…</p> : null}
          {tokenUnavailable ? (
            <div className="mt-7 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
              This reset link is invalid, expired, or already used. <Link href="/forgot-password" className="font-semibold underline">Request another link</Link>.
            </div>
          ) : null}
          {tokenValid && !mutation.isSuccess ? (
            <form onSubmit={submit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="normal-case tracking-normal text-sm font-semibold text-[#172554]">New password</Label>
                <Input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="h-[50px] rounded-md border-[#d7d9e3] px-4 focus-visible:ring-[#4a45ff]/30" />
                <p className="text-xs text-[#64748b]">Use 8 to 128 characters.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="normal-case tracking-normal text-sm font-semibold text-[#172554]">Confirm new password</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-[50px] rounded-md border-[#d7d9e3] px-4 focus-visible:ring-[#4a45ff]/30" />
              </div>
              {password && confirmPassword && password !== confirmPassword ? <p role="alert" className="text-sm text-red-700">The passwords do not match.</p> : null}
              {mutation.error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{mutation.error.message}</p> : null}
              <Button type="submit" disabled={mutation.isPending || password !== confirmPassword} className="h-11 w-full bg-[#0a1f44] hover:bg-[#173767]">{mutation.isPending ? "Updating password…" : "Update password"}</Button>
            </form>
          ) : null}
          {mutation.isSuccess ? (
            <div className="mt-7 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900" role="status">
              Password updated. <Link href="/login" className="font-semibold underline">Sign in with your new password</Link>.
            </div>
          ) : null}
          <p className="mt-7 text-sm text-[#5c6287]"><Link href="/login" className="font-semibold text-[#4a45ff] hover:underline">Back to sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
