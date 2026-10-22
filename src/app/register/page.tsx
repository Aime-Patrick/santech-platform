"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to create your account.");
      router.replace("/dashboard");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create your account."); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[560px] flex-col justify-center">
        <section className="rounded-lg border border-[#e5e6eb] bg-white px-6 py-9 shadow-[0_2px_8px_rgba(10,31,68,0.08)] sm:px-12 sm:py-10">
          <div className="text-center"><Image src="/santech.png" alt="SAN TECH" width={130} height={108} className="mx-auto h-[76px] w-auto object-contain" priority /><h1 className="mt-5 text-3xl font-medium tracking-[-0.035em] text-[#243866]">Create your learner account</h1><p className="mt-2 text-base text-[#5c6287]">Use one SAN TECH account for courses, materials, and progress.</p></div>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} required autoComplete="given-name" /></div><div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} required autoComplete="family-name" /></div></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required autoComplete="email" /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required minLength={8} autoComplete="new-password" /><p className="text-xs text-[#5c6287]">At least 8 characters.</p></div>
            <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} required minLength={8} autoComplete="new-password" /></div>
            {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <Button type="submit" disabled={loading} className="h-11 w-full rounded-md bg-[#4a45ff] text-sm hover:bg-[#3934db]">{loading ? "Creating account…" : "Create learner account"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#5c6287]">Already have an account? <Link href="/login" className="font-semibold text-[#4a45ff] hover:underline">Log in</Link></p>
        </section>
      </div>
    </main>
  );
}
