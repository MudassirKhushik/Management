import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET = "give me the list of travelers" (used by Manage Travelers later)
export async function GET() {
  const travelers = await prisma.traveler.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(travelers);
}

// POST = "save a new traveler" (used by our Add Traveler form)
export async function POST(req: Request) {
  const body = await req.json();

  const traveler = await prisma.traveler.create({
    data: {
      name: body.name,
      peopleCount: Number(body.peopleCount),
      price: Number(body.price),
    },
  });

  return NextResponse.json(traveler);
}