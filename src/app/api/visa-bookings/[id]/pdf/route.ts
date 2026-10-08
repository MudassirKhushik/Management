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

// Custom domain wins if the agency has one connected, since each agency can
// now be on its own domain. Falls back to NEXT_PUBLIC_BASE_URL, then the
// request's own origin — same precedence used by every other PDF route.
function resolveBaseUrl(reqUrl: string, agency: { customDomain?: string | null }): string {
  if (agency.customDomain) {
    const domain = agency.customDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${domain}`;
  }
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
    include: { entries: { include: { vendor: true } } },
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

  let verifyQrDataUri: string | null = null;
  if (variant === "voucher") {
    try {
      const verifyUrl = `${resolveBaseUrl(req.url, agency)}/verify/${agency.slug}`;
      verifyQrDataUri = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 });
    } catch (err) {
      console.error("Failed to generate verification QR code:", err);
    }
  }

  try {
    const buffer = await renderToBuffer(
      React.createElement(VisaBookingDocument, {
        booking: { ...booking, payments },
        agency,
        variant,
        verifyQrDataUri,
        showBreakdown: booking.showBreakdown,
      }) as any
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${variant}-${booking.voucherNumber || id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Error rendering visa booking PDF:", err);
    return NextResponse.json({ error: "Could not generate PDF." }, { status: 500 });
  }
}
