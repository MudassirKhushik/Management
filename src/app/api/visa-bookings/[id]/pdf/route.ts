// src/app/api/visa-bookings/[id]/pdf/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../../auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { VisaBookingDocument } from "@/src/lib/pdf/VisaBookingDocument";
import React from "react";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const variant: "invoice" | "voucher" = searchParams.get("type") === "voucher" ? "voucher" : "invoice";

  const booking = await prisma.visaBooking.findUnique({
    where: { id },
    include: { entries: true },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } });
  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  try {
    const buffer = await renderToBuffer(
      React.createElement(VisaBookingDocument, { booking, agency, variant }) as any
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${variant}-${booking.referenceNo || booking.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Error rendering visa booking PDF:", err);
    return NextResponse.json({ error: "Could not generate PDF." }, { status: 500 });
  }
}