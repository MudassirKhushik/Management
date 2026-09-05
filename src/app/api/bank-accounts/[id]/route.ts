// src/app/api/bank-accounts/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../../auth"; // adjust relative depth to match your project if needed
import { prisma } from "@/src/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const updated = await prisma.bankAccount.update({
      where: { id },
      data: {
        accountName: body.accountName ?? existing.accountName,
        bankName: body.bankName ?? existing.bankName,
        accountNo: body.accountNo ?? existing.accountNo,
        iban: body.iban ?? existing.iban,
        address: body.address ?? existing.address,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update bank account:", error);
    return NextResponse.json({ error: "Failed to update bank account" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Payments referencing this account keep bankAccountId set to it via the
    // relation; if you delete an account that has payment history attached,
    // Postgres will block it (FK constraint) unless you've set onDelete —
    // current schema doesn't cascade, so this fails safely rather than
    // silently orphaning payment records. Surface a clear message instead
    // of a raw DB error.
    await prisma.bankAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "This account has payments recorded against it and can't be deleted." },
        { status: 409 }
      );
    }
    console.error("Failed to delete bank account:", error);
    return NextResponse.json({ error: "Failed to delete bank account" }, { status: 500 });
  }
}
