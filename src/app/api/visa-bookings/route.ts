// src/app/api/visa-bookings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../auth";
import { getNextSequenceNumber } from "@/src/lib/sequenceHelpers";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.visaBooking.findMany({
      where: { agencyId: session.user.agencyId },
      include: { entries: { include: { vendor: true } } },
      orderBy: { createdAt: "desc" },
    });

    const grouped = await prisma.payment.groupBy({
      by: ["bookingId"],
      where: {
        bookingType: "visa",
        agencyId: session.user.agencyId,
        bookingId: { in: bookings.map((b) => b.id) },
      },
      _sum: { amount: true },
    });
    const paidMap = new Map(grouped.map((g) => [g.bookingId, g._sum.amount || 0]));

    return NextResponse.json(
      bookings.map((b) => ({ ...b, totalPaid: paidMap.get(b.id) || 0 }))
    );
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
    const voucherNumber = await getNextSequenceNumber(session.user.agencyId, "visa");

    const booking = await prisma.visaBooking.create({
      data: {
        agencyId: session.user.agencyId,
        voucherNumber,
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
        showBreakdown: !!body.showBreakdown,
        paymentStatus: "Pending",
        entries: {
          create: entriesList.map((row: any) => ({
            vendorId: row.vendorId || null,
            visaCategory: row.visaCategory,
            applicantName: row.applicantName,
            passportNumber: row.passportNumber,
            companyName: row.companyName || null,
            processingType: row.processingType || null,
            submissionDate: row.submissionDate ? new Date(row.submissionDate) : null,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
            buyingCost: parseFloat(row.buyingCost) || 0,
            sellingPrice: parseFloat(row.sellingPrice) || 0,
          })),
        },
      },
      include: { entries: { include: { vendor: true } } },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error in visa-bookings POST route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
