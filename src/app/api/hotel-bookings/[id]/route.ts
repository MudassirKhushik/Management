// src/app/api/hotel-bookings/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/src/lib/prisma";

// GET single booking
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const booking = await prisma.hotelBooking.findUnique({
      where: { id },
      include: { hotels: { include: { vendor: true } } },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Failed to fetch hotel booking:", error);
    return NextResponse.json({ error: "Failed to fetch hotel booking" }, { status: 500 });
  }
}

// PUT: full update
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.hotelBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    if (!body.exchangeRate || parseFloat(body.exchangeRate) <= 0) {
      return NextResponse.json({ error: "Exchange rate is required" }, { status: 400 });
    }

    await prisma.hotelBookingEntry.deleteMany({ where: { hotelBookingId: id } });

    const booking = await prisma.hotelBooking.update({
      where: { id },
      data: {
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo,
        referenceNo: body.referenceNo || null,
        currency: body.currency,
        discount: body.discount || 0,
        vatPercent: body.vatPercent || 0,
        paymentType: body.paymentType || null,
        note: body.note || null,
        paymentStatus: body.paymentStatus || "Pending",
        showBreakdown: !!body.showBreakdown,
        exchangeRate: parseFloat(body.exchangeRate) || 0,
        hotels: {
          create: (body.hotels || []).map((row: any) => ({
            vendorId: row.vendorId || null,
            hotelName: row.hotelName,
            city: row.city,
            roomType: row.roomType,
            checkIn: new Date(row.checkIn),
            checkOut: new Date(row.checkOut),
            rooms: row.rooms,
            adults: row.adults,
            children: row.children,
            infants: row.infants,
            mealPlan: row.mealPlan || null,
            confirmationNo: row.confirmationNo || null,
            buyingRatePerNight: parseFloat(row.buyingRatePerNight) || 0,
            sellingRatePerNight: parseFloat(row.sellingRatePerNight) || 0,
          })),
        },
      },
      include: { hotels: { include: { vendor: true } } },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Failed to update hotel booking:", error);
    return NextResponse.json({ error: "Failed to update hotel booking" }, { status: 500 });
  }
}

// PATCH: quick single-field update (kept for compatibility — not used by
// the Manage page anymore since manual status control was removed, but
// left in place in case anything else still calls it)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.hotelBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const booking = await prisma.hotelBooking.update({
      where: { id },
      data: {
        ...(body.paymentStatus !== undefined ? { paymentStatus: body.paymentStatus } : {}),
        ...(body.showBreakdown !== undefined ? { showBreakdown: !!body.showBreakdown } : {}),
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Failed to patch hotel booking:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.hotelBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.hotelBooking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete hotel booking:", error);
    return NextResponse.json({ error: "Failed to delete hotel booking" }, { status: 500 });
  }
}