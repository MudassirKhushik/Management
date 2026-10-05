import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../auth";
import { getVendorTotalOwed, sumVendorPayments, vendorBalanceTier } from "@/src/lib/vendorHelpers";
import { getNextSequenceNumber } from "@/src/lib/sequenceHelpers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = session.user.agencyId;

  const vendors = await prisma.vendor.findMany({ where: { agencyId }, orderBy: { name: "asc" } });

  const withBalances = await Promise.all(
    vendors.map(async (v) => {
      const { totalBuying } = await getVendorTotalOwed(agencyId, v.id);
      const totalPaid = await sumVendorPayments(v.id);
      return {
        ...v,
        totalOwed: totalBuying,
        totalPaid,
        remaining: totalBuying - totalPaid,
        tier: vendorBalanceTier(totalBuying, totalPaid),
      };
    })
  );

  return NextResponse.json(withBalances);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = session.user.agencyId;

  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });

  try {
    const vendorCode = await getNextSequenceNumber(agencyId, "vendor");
    const vendor = await prisma.vendor.create({
      data: {
        agencyId,
        vendorCode,
        name: body.name.trim(),
        phone: body.phone || null,
        email: body.email || null,
        country: body.country || null,
        address: body.address || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    });
    return NextResponse.json(vendor, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A vendor with this name already exists." }, { status: 409 });
    }
    console.error("Failed to create vendor:", err);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}