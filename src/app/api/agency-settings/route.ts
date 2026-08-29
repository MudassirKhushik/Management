// src/app/api/agency-settings/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agency = await prisma.agency.findUnique({
    where: { id: session.user.agencyId },
    include: {
      media: { orderBy: { position: "asc" } },
      bankAccounts: { orderBy: { position: "asc" } },
    },
  });
  if (!agency) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const packageCount = await prisma.package.count({ where: { agencyId: agency.id } });

  return NextResponse.json({
    name: agency.name,
    logoUrl: agency.logoUrl,
    aboutImageUrl: agency.aboutImageUrl,
    primaryColor: agency.primaryColor,
    cancellationPolicy: agency.cancellationPolicy,
    noShowPolicy: agency.noShowPolicy,
    importantContact: agency.importantContact,
    bankAccounts: agency.bankAccounts,
    carousel: agency.media.filter((m) => m.section === "carousel"),
    gallery: agency.media.filter((m) => m.section === "gallery"),
    packageCount,
    packageLimit: 20,
  });
}

// PUT — the singular policy fields only. Bank accounts now have their own
// dedicated routes (/api/bank-accounts) since there can be several of them.
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updated = await prisma.agency.update({
    where: { id: session.user.agencyId },
    data: {
      cancellationPolicy: body.cancellationPolicy || null,
      noShowPolicy: body.noShowPolicy || null,
      importantContact: body.importantContact || null,
    },
  });

  return NextResponse.json(updated);
}