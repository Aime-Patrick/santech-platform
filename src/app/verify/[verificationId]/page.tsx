import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { getCertificateByVerificationId } from "@/lib/services/certificate-service";
import { Card } from "@/components/ui/card";

export default async function CertificateVerificationPage({ params }: { params: Promise<{ verificationId: string }> }) {
  const { verificationId } = await params;
  const certificate = await getCertificateByVerificationId(verificationId);
  if (!certificate) notFound();
  const isValid = certificate.status === "ISSUED";
  return <main className="min-h-screen bg-[#edf3fa] px-4 py-12 sm:px-6"><div className="mx-auto max-w-2xl"><Link href="/" className="text-xs font-bold text-[#0a1f44] hover:text-[#00a3e0]">SAN TECH Platform</Link><Card className="mt-6 border-t-4 border-t-[#00a3e0]"><div className="flex items-start gap-4"><span className={`grid size-12 shrink-0 place-items-center rounded-full ${isValid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{isValid ? <BadgeCheck className="size-6" /> : <ShieldCheck className="size-6" />}</span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00a3e0]">Public verification</p><h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#0a1f44]">{isValid ? "Certificate verified" : "Certificate revoked"}</h1><p className="mt-2 text-sm leading-6 text-slate-500">This record confirms the status of a learning certificate.</p></div></div><dl className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2"><div><dt className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Learner</dt><dd className="mt-1 font-bold text-[#0a1f44]">{certificate.learner.firstName} {certificate.learner.lastName}</dd></div><div><dt className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Course</dt><dd className="mt-1 font-bold text-[#0a1f44]">{certificate.course.title}</dd></div><div><dt className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Certificate number</dt><dd className="mt-1 text-sm text-slate-600">{certificate.certificateNo}</dd></div><div><dt className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Issued</dt><dd className="mt-1 text-sm text-slate-600">{certificate.issuedAt.toLocaleDateString()}</dd></div></dl></Card></div></main>;
}
