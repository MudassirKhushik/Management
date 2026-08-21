// src/app/api/portal/branding-by-email/route.ts
//
// PUBLIC — used only by the login page to preview an agency's logo/color
// before the password is submitted. Never returns anything beyond
// display-safe fields (no password hash, no bank details, nothing sensitive).

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || "").trim();

  if (!email) {
    return NextResponse.json({ found: false });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { agency: true },
  });

  if (!user || user.isSuperAdmin || !user.agency) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    name: user.agency.name,
    logoUrl: user.agency.logoUrl,
    primaryColor: user.agency.primaryColor,
  });
}