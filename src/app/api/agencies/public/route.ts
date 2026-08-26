// src/app/api/agencies/public/route.ts
//
// PUBLIC on purpose — visitors browsing an agency's site aren't logged in,
// so this reads the agency by ?agencySlug= rather than a session.

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agencySlug = searchParams.get("agencySlug");

  if (!agencySlug) {
    return NextResponse.json({ error: "agencySlug is required" }, { status: 400 });
  }

  const agency = await prisma.agency.findUnique({
    where: { slug: agencySlug },
    include: { media: { orderBy: { position: "asc" } } },
  });

  if (!agency || !agency.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: agency.name,
    slug: agency.slug,
    city: agency.city,
    primaryColor: agency.primaryColor,
    logoUrl: agency.logoUrl,
    aboutImageUrl: agency.aboutImageUrl,
    carousel: agency.media.filter((m) => m.section === "carousel").map((m) => m.url),
    gallery: agency.media.filter((m) => m.section === "gallery").map((m) => m.url),
  });
}