import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { CourseMaterialType } from "@prisma/client";
export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) { const actor=await getCurrentUser(); if(!actor)return NextResponse.json({error:"Unauthenticated"},{status:401}); if(!hasPermission(actor,"courses.view"))return NextResponse.json({error:"Forbidden"},{status:403}); const {courseId}=await params; return NextResponse.json({data:await prisma.courseMaterial.findMany({where:{courseId},orderBy:[{sortOrder:"asc"},{createdAt:"asc"}]})}); }
export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) { const actor=await getCurrentUser(); if(!actor)return NextResponse.json({error:"Unauthenticated"},{status:401}); if(!hasPermission(actor,"lessons.manage"))return NextResponse.json({error:"Forbidden"},{status:403}); const {courseId}=await params; const body=await request.json() as {lessonId?:string;title?:string;description?:string;type?:string;url?:string;publicId?:string;mimeType?:string;durationSec?:number;sortOrder?:number;isPublished?:boolean;metadata?:unknown}; if(!body.title?.trim()||!body.url?.trim()||!body.type||!Object.values(CourseMaterialType).includes(body.type as CourseMaterialType))return NextResponse.json({error:"Title, type, and URL are required"},{status:400}); const material=await prisma.courseMaterial.create({data:{courseId,lessonId:body.lessonId||null,title:body.title.trim(),description:body.description?.trim()||null,type:body.type as CourseMaterialType,url:body.url.trim(),publicId:body.publicId||null,mimeType:body.mimeType||null,durationSec:body.durationSec||null,sortOrder:body.sortOrder??0,isPublished:body.isPublished??false,metadata:body.metadata as never}}); return NextResponse.json({data:material},{status:201}); }

export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "lessons.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { courseId } = await params;
  const body = await request.json() as { id?: string; title?: string; description?: string; type?: string; url?: string; lessonId?: string | null; isPublished?: boolean; sortOrder?: number };
  if (!body.id) return NextResponse.json({ error: "Material id is required" }, { status: 400 });
  const existing = await prisma.courseMaterial.findFirst({ where: { id: body.id, courseId } });
  if (!existing) return NextResponse.json({ error: "Material not found" }, { status: 404 });
  const material = await prisma.courseMaterial.update({ where: { id: body.id }, data: {
    ...(body.title !== undefined ? { title: body.title.trim() } : {}),
    ...(body.description !== undefined ? { description: body.description.trim() || null } : {}),
    ...(body.url !== undefined ? { url: body.url.trim() } : {}),
    ...(body.lessonId !== undefined ? { lessonId: body.lessonId || null } : {}),
    ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
    ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
    ...(body.type && Object.values(CourseMaterialType).includes(body.type as CourseMaterialType) ? { type: body.type as CourseMaterialType } : {}),
  }});
  return NextResponse.json({ data: material });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!hasPermission(actor, "lessons.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { courseId } = await params;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Material id is required" }, { status: 400 });
  const existing = await prisma.courseMaterial.findFirst({ where: { id, courseId } });
  if (!existing) return NextResponse.json({ error: "Material not found" }, { status: 404 });
  await prisma.courseMaterial.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
