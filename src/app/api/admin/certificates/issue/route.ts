import { NextResponse } from "next/server";
import { issueCertificate } from "@/app/(dashboard)/dashboard/certificates/actions";
export async function POST(request: Request) { const body = await request.json().catch(() => null); if (!body?.enrollmentId) return NextResponse.json({ error: "Enrollment is required." }, { status: 400 }); try { await issueCertificate(String(body.enrollmentId)); return NextResponse.json({ ok: true }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to issue certificate." }, { status: 400 }); } }
