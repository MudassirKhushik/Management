// src/app/api/flight-bookings/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

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

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in flight-bookings GET [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// UTILITY: Combine date and time into full Date
// ==========================================
function combineDateTime(dateStr: string, timeStr: string): Date {
  if (!dateStr) return new Date();
  const baseDate = dateStr.slice(0, 10); // format: YYYY-MM-DD
  const baseTime = timeStr || "00:00";   // format: HH:MM
  return new Date(`${baseDate}T${baseTime}:00`);
}

// ==========================================
// PUT HANDLER: Update a flight booking
// ==========================================
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
    const segmentsList = body.segments || [];

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
        segments: {
          create: segmentsList.map((s: any) => ({
            airline: s.airline,
            flightNo: s.flightNo,
            pnr: s.pnr,
            departureAirport: s.fromAirport,
            arrivalAirport: s.toAirport,
            
            // 🛠️ Combine date + time fields to satisfy schema required arguments:
            departureDateTime: combineDateTime(s.date, s.departureTime),
            arrivalDateTime: combineDateTime(s.date, s.arrivalTime),
            
            travelClass: s.travelClass,
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

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in flight-bookings PUT [id] route:", error);
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

    const existing = await prisma.flightBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.flightBooking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in flight-bookings DELETE [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
