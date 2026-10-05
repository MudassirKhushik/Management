import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../../auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor || vendor.agencyId !== session.user.agencyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payments = await prisma.vendorPayment.findMany({ where: { vendorId: id }, orderBy: { paidOn: "desc" } });
  return NextResponse.json(payments);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor || vendor.agencyId !== session.user.agencyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  if (!body.amount || parseFloat(body.amount) <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const payment = await prisma.vendorPayment.create({
    data: {
      agencyId: session.user.agencyId,
      vendorId: id,
      amount: parseFloat(body.amount),
      paidOn: body.paidOn ? new Date(body.paidOn) : new Date(),
      note: body.note || null,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}