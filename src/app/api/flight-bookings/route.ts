// src/app/api/flight-bookings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../auth";

// Combines a "YYYY-MM-DD" date string and "HH:MM" time string into a real
// Date. Departure and arrival are combined separately now (not from one
// shared date) so overnight/long-haul flights land on the correct day.
function combineDateTime(dateStr: string, timeStr: string): Date {
  if (!dateStr) return new Date();
  const baseDate = dateStr.slice(0, 10);
  const baseTime = timeStr || "00:00";
  return new Date(`${baseDate}T${baseTime}:00`);
}

// GET — list all flight bookings for the logged-in agency
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

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error on GET /api/flight-bookings:", error);
    return NextResponse.json([]);
  }
}

// POST — create a new flight booking
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const segmentsList = body.segments || [];

    const booking = await prisma.flightBooking.create({
      data: {
        // Never trust a client-sent agencyId — always derived from session.
        agencyId: session.user.agencyId,
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo || null,
        referenceNo: body.referenceNo || null,
        currency: body.currency || "USD",
        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || null,
        note: body.note || null,
        vendorName: body.vendorName || null,
        paymentStatus: body.paymentStatus || "Pending",
        segments: {
          create: segmentsList.map((s: any) => ({
            airline: s.airline,
            flightNo: s.flightNo,
            pnr: s.pnr || null,
            departureAirport: s.departureAirport,
            arrivalAirport: s.arrivalAirport,
            departureDateTime: combineDateTime(s.departureDate, s.departureTime),
            arrivalDateTime: combineDateTime(s.arrivalDate || s.departureDate, s.arrivalTime),
            travelClass: s.travelClass || null,
            adults: parseInt(s.adults) || 1,
            children: parseInt(s.children) || 0,
            infants: parseInt(s.infants) || 0,
            baggage: s.baggage || null,
            buyingCost: parseFloat(s.buyingCost) || 0,
            sellingPrice: parseFloat(s.sellingPrice) || 0,
          })),
        },
      },
      include: { segments: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Critical error in flight-bookings POST route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}