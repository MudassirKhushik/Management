// src/app/api/agencies/public/route.ts
//
// PUBLIC route — no auth check, intended for the public agency site's client
// components (page.tsx, which is "use client" and can't call prisma directly).
// Only returns display-safe fields. Never add bank/policy fields to this route.

import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("agencySlug") || "").trim().toLowerCase();

  if (!slug) {
    return NextResponse.json({ error: "agencySlug is required" }, { status: 400 });
  }

  const agency = await prisma.agency.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      city: true,
      primaryColor: true,
      logoUrl: true,
      isActive: true,
      publicSiteEnabled: true,
    },
  });

  if (!agency || !agency.isActive || !agency.publicSiteEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(agency);
}