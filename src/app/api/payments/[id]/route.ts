// src/app/api/payments/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../../auth"; // adjust relative depth to match your project if needed
import { prisma } from "@/src/lib/prisma";
import {
  BookingType,
  getBookingNetTotal,
  updateBookingPaymentStatus,
} from "@/src/lib/paymentHelpers";
import { sumPayments, computeAutoPaymentStatus } from "@/src/lib/pricingCalculations";

async function reflipStatus(bookingType: BookingType, bookingId: string) {
  try {
    const netTotal = await getBookingNetTotal(bookingType, bookingId);
    const remaining = await prisma.payment.findMany({ where: { bookingType, bookingId } });
    const totalPaid = sumPayments(remaining);
    const newStatus = computeAutoPaymentStatus(totalPaid, netTotal);
    await updateBookingPaymentStatus(bookingType, bookingId, newStatus);
  } catch (err) {
    console.warn("Skipped payment-status auto-flip:", (err as Error).message);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    if (body.bankAccountId) {
      const account = await prisma.bankAccount.findUnique({ where: { id: body.bankAccountId } });
      if (!account || account.agencyId !== session.user.agencyId) {
        return NextResponse.json({ error: "Invalid bank account" }, { status: 400 });
      }
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        amount: body.amount !== undefined ? parseFloat(body.amount) : existing.amount,
        paidOn: body.paidOn ? new Date(body.paidOn) : existing.paidOn,
        bankAccountId: body.bankAccountId !== undefined ? body.bankAccountId || null : existing.bankAccountId,
        note: body.note !== undefined ? body.note || null : existing.note,
      },
      include: { bankAccount: true },
    });

    await reflipStatus(existing.bookingType as BookingType, existing.bookingId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update payment:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.payment.delete({ where: { id } });

    await reflipStatus(existing.bookingType as BookingType, existing.bookingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}