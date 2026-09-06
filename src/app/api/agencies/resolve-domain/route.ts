// app/api/agencies/resolve-domain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../src/lib/prisma";

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get("host")?.toLowerCase();
  if (!host) return NextResponse.json({ slug: null });

  const agency = await prisma.agency.findFirst({
    where: { customDomain: host },
    select: { slug: true },
  });

  return NextResponse.json({ slug: agency?.slug ?? null });
}