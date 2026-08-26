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
    include: { media: { orderBy: { position: "asc" } } },
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
    bankAccountName: agency.bankAccountName,
    bankName: agency.bankName,
    bankAccountNo: agency.bankAccountNo,
    bankIban: agency.bankIban,
    bankAddress: agency.bankAddress,
    cancellationPolicy: agency.cancellationPolicy,
    noShowPolicy: agency.noShowPolicy,
    importantContact: agency.importantContact,
    carousel: agency.media.filter((m) => m.section === "carousel"),
    gallery: agency.media.filter((m) => m.section === "gallery"),
    packageCount,
    packageLimit: 20,
  });
}

// PUT — bank/policy text fields only. Logo, About, Carousel, and Gallery
// images go through /api/media/upload instead, since those involve files.
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updated = await prisma.agency.update({
    where: { id: session.user.agencyId },
    data: {
      bankAccountName: body.bankAccountName || null,
      bankName: body.bankName || null,
      bankAccountNo: body.bankAccountNo || null,
      bankIban: body.bankIban || null,
      bankAddress: body.bankAddress || null,
      cancellationPolicy: body.cancellationPolicy || null,
      noShowPolicy: body.noShowPolicy || null,
      importantContact: body.importantContact || null,
    },
  });

  return NextResponse.json(updated);
}