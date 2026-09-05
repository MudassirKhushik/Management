// src/app/api/visa-bookings/[id]/route.ts

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

    const booking = await prisma.visaBooking.findUnique({
      where: { id },
      include: { entries: true },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const paid = await prisma.payment.aggregate({
      where: { bookingType: "visa", bookingId: id, agencyId: session.user.agencyId },
      _sum: { amount: true },
    });

    return NextResponse.json({ ...booking, totalPaid: paid._sum.amount || 0 });
  } catch (error: any) {
    console.error("Error in visa-bookings GET [id] route:", error);
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

    const existing = await prisma.visaBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    await prisma.visaEntry.deleteMany({ where: { visaBookingId: id } });

    const booking = await prisma.visaBooking.update({
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
        vendorName: body.vendorName || null,
        // paymentStatus is deliberately NOT taken from the body — it's
        // recomputed below from the ledger instead.
        entries: {
          create: (body.entries || []).map((row: any) => ({
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
      include: { entries: true },
    });

    // Editing entries/discount/VAT changes Net Total, which can change what
    // the same set of payments adds up to — e.g. a booking that was "Paid"
    // becomes "Partially Paid" after a price increase. Re-derive here, or
    // the badge silently goes stale until the next payment is recorded.
    try {
      const netTotal = await getBookingNetTotal("visa", id);
      const payments = await prisma.payment.findMany({ where: { bookingType: "visa", bookingId: id } });
      await updateBookingPaymentStatus("visa", id, computeAutoPaymentStatus(sumPayments(payments), netTotal));
    } catch (err) {
      console.warn("Skipped payment-status recompute after edit:", (err as Error).message);
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in visa-bookings PUT [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH removed — it only existed to serve the Manage page's manual status
// dropdown, and status is no longer manually settable anywhere.

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.visaBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Payments point at bookings via a loose (bookingType, bookingId) pair,
    // so there's no FK cascade to clean them up — do it explicitly or they
    // become orphan rows that still count toward agency totals.
    await prisma.payment.deleteMany({ where: { bookingType: "visa", bookingId: id } });
    await prisma.visaBooking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in visa-bookings DELETE [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}