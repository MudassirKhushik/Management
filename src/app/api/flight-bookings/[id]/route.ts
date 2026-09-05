// src/app/api/flight-bookings/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../auth";
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

    const booking = await prisma.flightBooking.findUnique({
      where: { id },
      include: { segments: true },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const paid = await prisma.payment.aggregate({
      where: { bookingType: "flight", bookingId: id, agencyId: session.user.agencyId },
      _sum: { amount: true },
    });

    return NextResponse.json({ ...booking, totalPaid: paid._sum.amount || 0 });
  } catch (error: any) {
    console.error("Error in flight-bookings GET [id] route:", error);
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

    const existing = await prisma.flightBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    await prisma.flightSegment.deleteMany({ where: { flightBookingId: id } });

    const booking = await prisma.flightBooking.update({
      where: { id },
      data: {
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo || "",
        referenceNo: body.referenceNo || null,
        currency: body.currency || "PKR",
        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || null,
        note: body.note || null,
        vendorName: body.vendorName || null,
        // paymentStatus deliberately NOT taken from the body — recomputed
        // from the ledger below.
        segments: {
          create: (body.segments || []).map((row: any) => ({
            airline: row.airline,
            flightNo: row.flightNo,
            pnr: row.pnr || null,
            departureAirport: row.departureAirport,
            arrivalAirport: row.arrivalAirport,
            departureDateTime: new Date(row.departureDateTime),
            arrivalDateTime: new Date(row.arrivalDateTime),
            travelClass: row.travelClass || null,
            adults: parseInt(row.adults) || 0,
            children: parseInt(row.children) || 0,
            infants: parseInt(row.infants) || 0,
            baggage: row.baggage || null,
            passengerNames: Array.isArray(row.passengerNames)
              ? row.passengerNames.map((n: string) => n.trim()).filter(Boolean).join("\n") || null
              : row.passengerNames || null,
            adultBuyingPricePerLeg: parseFloat(row.adultBuyingPricePerLeg) || 0,
            adultSellingPricePerLeg: parseFloat(row.adultSellingPricePerLeg) || 0,
            childBuyingPricePerLeg: parseFloat(row.childBuyingPricePerLeg) || 0,
            childSellingPricePerLeg: parseFloat(row.childSellingPricePerLeg) || 0,
            infantBuyingPricePerLeg: parseFloat(row.infantBuyingPricePerLeg) || 0,
            infantSellingPricePerLeg: parseFloat(row.infantSellingPricePerLeg) || 0,
          })),
        },
      },
      include: { segments: true },
    });

    // Editing segments/discount/VAT changes Net Total, which can change
    // what the same payments add up to. Re-derive, or the badge goes stale
    // until the next payment is recorded.
    try {
      const netTotal = await getBookingNetTotal("flight", id);
      const payments = await prisma.payment.findMany({ where: { bookingType: "flight", bookingId: id } });
      await updateBookingPaymentStatus("flight", id, computeAutoPaymentStatus(sumPayments(payments), netTotal));
    } catch (err) {
      console.warn("Skipped payment-status recompute after edit:", (err as Error).message);
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in flight-bookings PUT [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// No PATCH — payment status is never manually set anywhere.

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.flightBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Payments point at bookings via a loose (bookingType, bookingId) pair,
    // so there's no FK cascade — clean them up explicitly.
    await prisma.payment.deleteMany({ where: { bookingType: "flight", bookingId: id } });
    await prisma.flightBooking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in flight-bookings DELETE [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}