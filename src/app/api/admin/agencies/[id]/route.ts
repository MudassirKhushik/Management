import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json(); // expects { isActive: true/false }

  const updated = await prisma.agency.update({
    where: { id },
    data: { isActive: body.isActive },
  });

  return NextResponse.json(updated);
}