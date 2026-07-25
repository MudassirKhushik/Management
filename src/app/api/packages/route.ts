import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
 
// GET = "give me all packages" - used by both the public homepage
// AND the portal (if we list them there later)
export async function GET() {
  const packages = await prisma.package.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(packages);
}
 
// POST = "save a new package" - used by the Add Package form
export async function POST(req: Request) {
  const body = await req.json();
 
  const pkg = await prisma.package.create({
    data: {
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl || null, // stays empty if not provided - it's optional
    },
  });
 
  return NextResponse.json(pkg);
}