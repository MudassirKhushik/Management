// src/app/api/hotel-bookings/[id]/pdf/route.ts
//
// GET /api/hotel-bookings/[id]/pdf?type=invoice   (default)
// GET /api/hotel-bookings/[id]/pdf?type=voucher
//
// react-pdf needs Node APIs, not the Edge runtime — this line is required.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../../auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { HotelBookingDocument } from "@/src/lib/pdf/HotelBookingDocument";
import React from "react";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const variant: "invoice" | "voucher" = searchParams.get("type") === "voucher" ? "voucher" : "invoice";

  const booking = await prisma.hotelBooking.findUnique({
    where: { id },
    include: { hotels: true },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } });
  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  try {
    // FIX 1: Cast the dynamic element to 'any' to satisfy @react-pdf/renderer's strict Document element type
    const buffer = await renderToBuffer(
      React.createElement(HotelBookingDocument, { booking, agency, variant }) as any
    );

    // FIX 2: Convert Node.js Buffer to a standard Web API Uint8Array for NextResponse compliance
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${variant}-${booking.referenceNo || booking.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Error rendering hotel booking PDF:", err);
    return NextResponse.json({ error: "Could not generate PDF." }, { status: 500 });
  }
}
