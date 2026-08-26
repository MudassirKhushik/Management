// src/app/api/visa-bookings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.visaBooking.findMany({
      where: { agencyId: session.user.agencyId },
      include: { entries: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error on GET /api/visa-bookings:", error);
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
    const entriesList = body.entries || [];

    const booking = await prisma.visaBooking.create({
      data: {
        // Never trust a client-sent agencyId — always derived from session.
        agencyId: session.user.agencyId,
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo,
        referenceNo: body.referenceNo || null,
        currency: body.currency || "USD",
        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || null,
        note: body.note || null,
        vendorName: body.vendorName || null,
        paymentStatus: body.paymentStatus || "Pending",
        entries: {
          create: entriesList.map((row: any) => ({
            visaCategory: row.visaCategory,
            applicantName: row.applicantName,
            passportNumber: row.passportNumber,
            processingType: row.processingType || null,
            submissionDate: row.submissionDate ? new Date(row.submissionDate) : null,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
            buyingCost: parseFloat(row.buyingCost) || 0,
            sellingPrice: parseFloat(row.sellingPrice) || 0,
          })),
        },
      },
      include: { entries: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error in visa-bookings POST route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}