import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
 
export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
 
  const travelers = await prisma.traveler.findMany({
    where: { agencyId: session.user.agencyId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(travelers);
}
 
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
 
  const body = await req.json();
  const traveler = await prisma.traveler.create({
    data: {
      agencyId: session.user.agencyId, // taken from the session, never from the request body
      name: body.name,
      peopleCount: Number(body.peopleCount),
      price: Number(body.price),
    },
  });
  return NextResponse.json(traveler);
}