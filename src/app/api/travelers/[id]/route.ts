import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
 
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
 
  const traveler = await prisma.traveler.findUnique({ where: { id } });
  // Not just "does it exist" - does it belong to THIS agency?
  if (!traveler || traveler.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
 
  return NextResponse.json(traveler);
}
 
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
 
  const existing = await prisma.traveler.findUnique({ where: { id } });
  if (!existing || existing.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
 
  const body = await req.json();
  const updated = await prisma.traveler.update({
    where: { id },
    data: {
      name: body.name,
      peopleCount: Number(body.peopleCount),
      price: Number(body.price),
    },
  });
  return NextResponse.json(updated);
}
 
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
 
  const existing = await prisma.traveler.findUnique({ where: { id } });
  if (!existing || existing.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
 
  await prisma.traveler.delete({ where: { id } });
  return NextResponse.json({ success: true });
}