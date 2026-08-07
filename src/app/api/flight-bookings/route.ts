// src/app/api/flight-bookings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../auth";

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
// 1. GET HANDLER: Fetch all flight bookings
// ==========================================
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
    return NextResponse.json([]); // Fail safely to empty array
  }
}

// ==========================================
// 2. POST HANDLER: Create a new flight booking
// ==========================================
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
        agencyId: session.user.agencyId,
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo,
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

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error in flight-bookings POST route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
