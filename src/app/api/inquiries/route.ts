import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
 
// GET is PROTECTED - only the owning agency sees its own inquiries
export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
 
  const inquiries = await prisma.inquiry.findMany({
    where: { agencyId: session.user.agencyId },
    orderBy: { createdAt: "desc" },
    include: { package: true },
  });
  return NextResponse.json(inquiries);
}
 
// POST is PUBLIC - any visitor can submit an inquiry, no login needed.
// IMPORTANT: we never take agencyId from the visitor's request - we look
// up which agency owns the package they're booking, server-side. A
// visitor could tamper with the request in their browser, but they
// can't change which agency actually owns that package in our database.
export async function POST(req: Request) {
  const body = await req.json();
 
  const pkg = await prisma.package.findUnique({ where: { id: body.packageId } });
  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
 
  const inquiry = await prisma.inquiry.create({
    data: {
      agencyId: pkg.agencyId,
      packageId: pkg.id,
      phone: body.phone,
      peopleCount: Number(body.peopleCount),
    },
  });
  return NextResponse.json(inquiry);
}