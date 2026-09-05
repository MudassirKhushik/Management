// src/app/api/flight-bookings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.flightBooking.findMany({
      where: { agencyId: session.user.agencyId },
      include: { segments: true },
      orderBy: { createdAt: "desc" },
    });

    // Manage page needs a Remaining Balance per row. One groupBy for the
    // whole list instead of an N+1 fetch per booking.
    const grouped = await prisma.payment.groupBy({
      by: ["bookingId"],
      where: {
        bookingType: "flight",
        agencyId: session.user.agencyId,
        bookingId: { in: bookings.map((b) => b.id) },
      },
      _sum: { amount: true },
    });
    const paidMap = new Map(grouped.map((g) => [g.bookingId, g._sum.amount || 0]));

    return NextResponse.json(bookings.map((b) => ({ ...b, totalPaid: paidMap.get(b.id) || 0 })));
  } catch (error: any) {
    console.error("Error on GET /api/flight-bookings:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const booking = await prisma.flightBooking.create({
      data: {
        // Never trust a client-sent agencyId — always derived from session.
        agencyId: session.user.agencyId,
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
        // Always starts Pending — status is derived from the ledger.
        paymentStatus: "Pending",
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
            // Form sends an array; stored as one newline-separated column.
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

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error in flight-bookings POST route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}