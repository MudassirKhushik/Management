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

    const bookings = await prisma.transportBooking.findMany({
      where: { agencyId: session.user.agencyId },
      include: { segments: { include: { vendor: true } } },
      orderBy: { createdAt: "desc" },
    });

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
    const voucherNumber = await getNextSequenceNumber(session.user.agencyId, "transport");

    const booking = await prisma.transportBooking.create({
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
        segments: {
          create: (body.segments || []).map((row: any) => ({
            vendorId: row.vendorId || null,
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
      include: { segments: { include: { vendor: true } } },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error in transport-bookings POST route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}