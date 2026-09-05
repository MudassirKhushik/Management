// src/app/api/visa-bookings/[id]/pdf/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../../auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { VisaBookingDocument } from "@/src/lib/pdf/VisaBookingDocument";
import React from "react";
import QRCode from "qrcode";

type RouteParams = { params: Promise<{ id: string }> };

// Same rule as the hotel PDF route: use the origin of the incoming request
// so the QR link matches whatever domain actually served the PDF (Vercel URL
// today, custom domain later). NEXT_PUBLIC_BASE_URL wins if explicitly set.
function resolveBaseUrl(reqUrl: string): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return new URL(reqUrl).origin;
}

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

  const agency = await prisma.agency.findUnique({
    where: { id: session.user.agencyId },
    include: { bankAccounts: { orderBy: { position: "asc" } } },
  });
  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  const payments = await prisma.payment.findMany({
    where: { bookingType: "visa", bookingId: id },
    include: { bankAccount: true },
    orderBy: { paidOn: "asc" },
  });

  // Voucher-only — it's the document the client actually carries.
  // The type prefix keeps hotel and visa IDs from colliding on /verify.
  let verifyQrDataUri: string | null = null;
  if (variant === "voucher") {
    try {
        const verifyUrl = `${resolveBaseUrl(req.url)}/verify/${agency.slug}`;
      verifyQrDataUri = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
    } catch (err) {
      console.error("Failed to generate verification QR code:", err);
      // Not fatal — the voucher still renders, just without the QR block.
    }
  }

  try {
    const buffer = await renderToBuffer(
      React.createElement(VisaBookingDocument, {
        booking: { ...booking, payments },
        agency,
        variant,
        verifyQrDataUri,
      }) as any
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