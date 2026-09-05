// src/app/api/transport-bookings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.transportBooking.findMany({
      where: { agencyId: session.user.agencyId },
      include: { segments: true },
      orderBy: { createdAt: "desc" },
    });

    // Manage page needs a Remaining Balance per row. One groupBy for the
    // whole list instead of an N+1 fetch per booking.
    const grouped = await prisma.payment.groupBy({
      by: ["bookingId"],
      where: {
        bookingType: "transport",
        agencyId: session.user.agencyId,
        bookingId: { in: bookings.map((b) => b.id) },
      },
      _sum: { amount: true },
    });
    const paidMap = new Map(grouped.map((g) => [g.bookingId, g._sum.amount || 0]));

    return NextResponse.json(bookings.map((b) => ({ ...b, totalPaid: paidMap.get(b.id) || 0 })));
  } catch (error: any) {
    console.error("Error on GET /api/transport-bookings:", error);
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

    const booking = await prisma.transportBooking.create({
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
        // Always starts Pending — status is never client-supplied, it's
        // derived from the payment ledger's auto-flip from here on.
        paymentStatus: "Pending",
        segments: {
          create: (body.segments || []).map((row: any) => ({
            vehicle: row.vehicle,
            sector: row.sector,
            pickupDate: new Date(row.pickupDate),
            pickupTime: row.pickupTime || "",
            qty: parseInt(row.qty) || 1,
            driverContact: row.driverContact || null,
            buyingCost: parseFloat(row.buyingCost) || 0,
            sellingPrice: parseFloat(row.sellingPrice) || 0,
          })),
        },
      },
      include: { segments: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error in transport-bookings POST route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}