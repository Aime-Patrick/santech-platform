"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      if (!response.ok) throw new Error("Invalid credentials");
      const course = new URLSearchParams(window.location.search).get("course");
      if (course) {
        const enrollmentResponse = await fetch("/api/courses/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course }) });
        if (!enrollmentResponse.ok && enrollmentResponse.status !== 409) throw new Error("Your account is signed in, but the enrollment could not be completed.");
      }
      router.replace(course ? "/dashboard/enrollments" : "/dashboard");
    } catch {
      setError("The email or password is not correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[560px] flex-col justify-center">
        <section className="rounded-lg border border-[#e5e6eb] bg-white px-6 py-9 shadow-[0_2px_8px_rgba(10,31,68,0.08)] sm:px-12 sm:py-10">
          <div className="text-center">
            <Image src="/santech.png" alt="SAN TECH" width={130} height={108} className="mx-auto h-[92px] w-auto object-contain" priority />
            <h1 className="mt-6 text-3xl font-medium tracking-[-0.035em] text-[#243866] sm:text-4xl">Welcome to SAN TECH!</h1>
            <p className="mt-2 text-base text-[#5c6287]">Log in to your platform account</p>
          </div>

          <form onSubmit={onSubmit} className="mt-10 space-y-7">
            <div className="space-y-2">
              <Label htmlFor="email" className="normal-case tracking-normal text-sm font-semibold text-[#172554]">Email<span className="text-red-500">*</span></Label>
              <Input id="email" type="email" placeholder="e.g. kai@doe.com" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-[50px] rounded-md border-[#d7d9e3] bg-white px-5 text-base placeholder:text-[#8a8ca8] focus:border-[#4a45ff] focus:ring-[#4a45ff]/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="normal-case tracking-normal text-sm font-semibold text-[#172554]">Password<span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-[50px] rounded-md border-[#d7d9e3] bg-white px-5 pr-12 text-base focus:border-[#4a45ff] focus:ring-[#4a45ff]/20" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9294b2] hover:text-[#4a45ff]">
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-3 text-base text-[#334155]">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="size-6 rounded border-[#bfc3d7] accent-[#4a45ff]" />
              Remember me
            </label>
            {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <Button type="submit" disabled={loading} className="h-10 w-full rounded-md bg-[#4a45ff] text-sm hover:bg-[#3934db]">{loading ? "Logging in…" : "Login"}</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
