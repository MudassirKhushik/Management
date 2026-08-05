import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
 
export async function POST(req: Request) {
  const { agencySlug } = await req.json();
  const slug = (agencySlug || "").trim().toLowerCase();
 
  const agency = await prisma.agency.findUnique({ where: { slug } });
 
  if (!agency || !agency.isActive) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
 
  return NextResponse.json({ valid: true });
}