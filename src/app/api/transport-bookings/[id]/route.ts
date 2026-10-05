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

    const booking = await prisma.transportBooking.findUnique({
      where: { id },
      include: { segments: { include: { vendor: true } } },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const paid = await prisma.payment.aggregate({
      where: { bookingType: "transport", bookingId: id, agencyId: session.user.agencyId },
      _sum: { amount: true },
    });

    return NextResponse.json({ ...booking, totalPaid: paid._sum.amount || 0 });
  } catch (error: any) {
    console.error("Error in transport-bookings GET [id] route:", error);
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

    const existing = await prisma.transportBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    await prisma.transportSegment.deleteMany({ where: { transportBookingId: id } });

    const booking = await prisma.transportBooking.update({
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
        showBreakdown: !!body.showBreakdown,
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

    try {
      const netTotal = await getBookingNetTotal("transport", id);
      const payments = await prisma.payment.findMany({ where: { bookingType: "transport", bookingId: id } });
      await updateBookingPaymentStatus("transport", id, computeAutoPaymentStatus(sumPayments(payments), netTotal));
    } catch (err) {
      console.warn("Skipped payment-status recompute after edit:", (err as Error).message);
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in transport-bookings PUT [id] route:", error);
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

    const existing = await prisma.transportBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.payment.deleteMany({ where: { bookingType: "transport", bookingId: id } });
    await prisma.transportBooking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in transport-bookings DELETE [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}