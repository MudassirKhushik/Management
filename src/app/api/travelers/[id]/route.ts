// src/app/api/travelers/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../auth";
import { buildSectionCreates } from "../route";
import { getBookingNetTotal, updateBookingPaymentStatus } from "@/src/lib/paymentHelpers";
import { sumPayments, computeAutoPaymentStatus } from "@/src/lib/pricingCalculations";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.packageBooking.findUnique({
      where: { id },
      include: { hotels: true, transportSegments: true, flightSegments: true, visaEntries: true },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const paid = await prisma.payment.aggregate({
      where: { bookingType: "package", bookingId: id, agencyId: session.user.agencyId },
      _sum: { amount: true },
    });

    return NextResponse.json({ ...booking, totalPaid: paid._sum.amount || 0 });
  } catch (error: any) {
    console.error("Error in travelers GET [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.packageBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    if (body.includeHotels && (!body.exchangeRate || parseFloat(body.exchangeRate) <= 0)) {
      return NextResponse.json(
        { error: "Exchange rate is required when the package includes hotels." },
        { status: 400 }
      );
    }

    // Wipe all four section types, then recreate from the payload — same
    // delete-and-recreate approach the standalone booking types use.
    await prisma.hotelBookingEntry.deleteMany({ where: { packageBookingId: id } });
    await prisma.transportSegment.deleteMany({ where: { packageBookingId: id } });
    await prisma.flightSegment.deleteMany({ where: { packageBookingId: id } });
    await prisma.visaEntry.deleteMany({ where: { packageBookingId: id } });

    const booking = await prisma.packageBooking.update({
      where: { id },
      data: {
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo || "",
        referenceNo: body.referenceNo || null,
        currency: body.currency || "PKR",
        exchangeRate: parseFloat(body.exchangeRate) || 1,
        includeHotels: !!body.includeHotels,
        includeTransports: !!body.includeTransports,
        includeFlights: !!body.includeFlights,
        includeVisas: !!body.includeVisas,
        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || null,
        note: body.note || null,
        vendorName: body.vendorName || null,
        // paymentStatus deliberately NOT from the body — recomputed below.
        ...buildSectionCreates(body),
      },
      include: { hotels: true, transportSegments: true, flightSegments: true, visaEntries: true },
    });

    // Editing sections/discount/VAT/exchangeRate changes Net Total, which
    // changes what the same payments add up to. Re-derive or the badge goes
    // stale until the next payment is recorded.
    try {
      const netTotal = await getBookingNetTotal("package", id);
      const payments = await prisma.payment.findMany({ where: { bookingType: "package", bookingId: id } });
      await updateBookingPaymentStatus("package", id, computeAutoPaymentStatus(sumPayments(payments), netTotal));
    } catch (err) {
      console.warn("Skipped payment-status recompute after edit:", (err as Error).message);
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in travelers PUT [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.packageBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Entry rows cascade via their FKs; payments don't (loose pair), so
    // clear those explicitly or they become orphans that still count.
    await prisma.payment.deleteMany({ where: { bookingType: "package", bookingId: id } });
    await prisma.packageBooking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in travelers DELETE [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}