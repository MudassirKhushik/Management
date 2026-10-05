import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../../../auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, paymentId } = await params;

  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor || vendor.agencyId !== session.user.agencyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.vendorPayment.findUnique({ where: { id: paymentId } });
  if (!existing || existing.vendorId !== id) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const body = await request.json();
  if (!body.amount || parseFloat(body.amount) <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const payment = await prisma.vendorPayment.update({
    where: { id: paymentId },
    data: {
      amount: parseFloat(body.amount),
      paidOn: body.paidOn ? new Date(body.paidOn) : existing.paidOn,
      note: body.note ?? existing.note,
    },
  });

  return NextResponse.json(payment);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, paymentId } = await params;

  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor || vendor.agencyId !== session.user.agencyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.vendorPayment.findUnique({ where: { id: paymentId } });
  if (!existing || existing.vendorId !== id) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  await prisma.vendorPayment.delete({ where: { id: paymentId } });
  return NextResponse.json({ success: true });
}