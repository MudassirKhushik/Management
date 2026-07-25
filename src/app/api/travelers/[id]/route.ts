import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
 
// PUT = "update this one traveler" (used by the Edit page)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
 
// DELETE = "remove this one traveler" (used by the Delete button)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.traveler.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
 
// GET = "give me just this one traveler's details" (used by the Edit page to pre-fill the form)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const traveler = await prisma.traveler.findUnique({ where: { id } });
  return NextResponse.json(traveler);
}
 