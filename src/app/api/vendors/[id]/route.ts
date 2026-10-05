import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../auth";
import { getVendorTotalOwed, getVendorLedger, sumVendorPayments, vendorBalanceTier } from "@/src/lib/vendorHelpers";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const agencyId = session.user.agencyId;

  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor || vendor.agencyId !== agencyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { totalBuying } = await getVendorTotalOwed(agencyId, id);
  const totalPaid = await sumVendorPayments(id);
  const ledger = await getVendorLedger(agencyId, id);

  return NextResponse.json({
    ...vendor,
    totalOwed: totalBuying,
    totalPaid,
    remaining: totalBuying - totalPaid,
    tier: vendorBalanceTier(totalBuying, totalPaid),
    ledger: ledger.entries,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.vendor.findUnique({ where: { id } });
  if (!existing || existing.agencyId !== session.user.agencyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  try {
    // vendorCode is never accepted from the body — immutable once generated
    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: body.name?.trim() || existing.name,
        phone: body.phone ?? existing.phone,
        email: body.email ?? existing.email,
        country: body.country ?? existing.country,
        address: body.address ?? existing.address,
        isActive: body.isActive ?? existing.isActive,
      },
    });
    return NextResponse.json(vendor);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A vendor with this name already exists." }, { status: 409 });
    }
    console.error("Failed to update vendor:", err);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.vendor.findUnique({ where: { id } });
  if (!existing || existing.agencyId !== session.user.agencyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { lines } = await getVendorTotalOwed(session.user.agencyId, id);
  if (lines.length > 0) {
    await prisma.vendor.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ deactivated: true });
  }

  await prisma.vendor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}