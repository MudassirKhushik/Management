// src/app/api/payments/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../auth"; // adjust relative depth to match your project if needed
import { prisma } from "@/src/lib/prisma";
import {
  VALID_BOOKING_TYPES,
  BookingType,
  findBookingForOwnershipCheck,
  getBookingNetTotal,
  updateBookingPaymentStatus,
} from "@/src/lib/paymentHelpers";
import { sumPayments, computeAutoPaymentStatus } from "@/src/lib/pricingCalculations";

// GET /api/payments?bookingType=hotel&bookingId=xxxx — payment history for one booking
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookingType = searchParams.get("bookingType") as BookingType | null;
  const bookingId = searchParams.get("bookingId");

  if (!bookingType || !bookingId || !VALID_BOOKING_TYPES.includes(bookingType)) {
    return NextResponse.json({ error: "bookingType and bookingId are required" }, { status: 400 });
  }

  const booking = await findBookingForOwnershipCheck(bookingType, bookingId);
  if (!booking || (booking as any).agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payments = await prisma.payment.findMany({
    where: { bookingType, bookingId },
    include: { bankAccount: true },
    orderBy: { paidOn: "desc" },
  });

  return NextResponse.json(payments);
}

// POST — record a new payment. agencyId always comes from the session.
// After creating, recomputes total paid vs Net Total and auto-flips the
// booking's paymentStatus (Pending / Partially Paid / Paid). No "Cancelled"
// state — cancelling a booking means deleting it instead.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const bookingType = body.bookingType as BookingType;
    const bookingId = body.bookingId as string;

    if (!bookingType || !bookingId || !VALID_BOOKING_TYPES.includes(bookingType)) {
      return NextResponse.json({ error: "bookingType and bookingId are required" }, { status: 400 });
    }
    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json({ error: "amount must be greater than 0" }, { status: 400 });
    }
    if (!body.paidOn) {
      return NextResponse.json({ error: "paidOn date is required" }, { status: 400 });
    }

    const booking = await findBookingForOwnershipCheck(bookingType, bookingId);
    if (!booking || (booking as any).agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If a bank account was picked, verify it belongs to this agency too —
    // never trust a client-supplied bankAccountId blindly.
    if (body.bankAccountId) {
      const account = await prisma.bankAccount.findUnique({ where: { id: body.bankAccountId } });
      if (!account || account.agencyId !== session.user.agencyId) {
        return NextResponse.json({ error: "Invalid bank account" }, { status: 400 });
      }
    }

    const payment = await prisma.payment.create({
      data: {
        agencyId: session.user.agencyId,
        bookingType,
        bookingId,
        amount: parseFloat(body.amount),
        paidOn: new Date(body.paidOn),
        bankAccountId: body.bankAccountId || null,
        note: body.note || null,
      },
      include: { bankAccount: true },
    });

    // Auto-flip paymentStatus — only wired for "hotel" in Phase 1; other
    // booking types skip this step until their phase implements
    // getBookingNetTotal, but the payment itself is still recorded fine.
    try {
      const netTotal = await getBookingNetTotal(bookingType, bookingId);
      const allPayments = await prisma.payment.findMany({ where: { bookingType, bookingId } });
      const totalPaid = sumPayments(allPayments);
      const newStatus = computeAutoPaymentStatus(totalPaid, netTotal);
      await updateBookingPaymentStatus(bookingType, bookingId, newStatus);
    } catch (err) {
      // Net-total calc not implemented for this booking type yet (Phase 2-5)
      // — that's expected right now, not an error worth failing the request over.
      console.warn("Skipped payment-status auto-flip:", (err as Error).message);
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}