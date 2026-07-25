import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
 
// GET = "give me all inquiries" - used by the Notifications page
export async function GET() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: { package: true }, // pulls in the related package's title too
  });
  return NextResponse.json(inquiries);
}
 
// POST = "save a new inquiry" - used by the public Book Package form
export async function POST(req: Request) {
  const body = await req.json();
 
  const inquiry = await prisma.inquiry.create({
    data: {
      packageId: body.packageId,
      phone: body.phone,
      peopleCount: Number(body.peopleCount),
    },
  });
 
  return NextResponse.json(inquiry);
}