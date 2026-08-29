// src/app/api/admin/agencies/[id]/route.ts
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return null;
  return session;
}

// GET = fetch a single agency's current details, for the Edit page to prefill
export async function GET(req: Request, { params }: RouteParams) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const agency = await prisma.agency.findUnique({
    where: { id },
    include: { users: { select: { email: true } } },
  });

  if (!agency) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(agency);
}

// PUT = edit an existing agency's details, and/or toggle isActive / publicSiteEnabled
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.agency.update({
    where: { id },
    data: {
      // only set fields that were actually sent — toggle buttons only send one
      // field at a time and shouldn't blank out everything else
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.city !== undefined ? { city: body.city } : {}),
      ...(body.primaryColor !== undefined ? { primaryColor: body.primaryColor } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      ...(typeof body.publicSiteEnabled === "boolean"
        ? { publicSiteEnabled: body.publicSiteEnabled }
        : {}),
      // slug intentionally NOT editable here — changing it breaks existing
      // public links (yourdomain.com/oldslug) that may already be shared.
    },
  });

  return NextResponse.json(updated);
}

// DELETE = deactivate (soft delete) if the agency has any real business data
// worth preserving (bookings of any type, or inquiries). Only fully removes
// the agency — including its settings-only data (website packages, media,
// bank accounts, users) — when there's truly nothing to lose.
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [
    hotelCount,
    transportCount,
    flightCount,
    visaCount,
    packageBookingCount,
    inquiryCount,
  ] = await prisma.$transaction([
    prisma.hotelBooking.count({ where: { agencyId: id } }),
    prisma.transportBooking.count({ where: { agencyId: id } }),
    prisma.flightBooking.count({ where: { agencyId: id } }),
    prisma.visaBooking.count({ where: { agencyId: id } }),
    prisma.packageBooking.count({ where: { agencyId: id } }),
    prisma.inquiry.count({ where: { agencyId: id } }),
  ]);

  const hasRealData =
    hotelCount > 0 ||
    transportCount > 0 ||
    flightCount > 0 ||
    visaCount > 0 ||
    packageBookingCount > 0 ||
    inquiryCount > 0;

  if (hasRealData) {
    const agency = await prisma.agency.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ mode: "deactivated", agency });
  }

  // No bookings or inquiries — safe to fully remove. Still need to clear
  // settings-only data first (website packages, media, bank accounts,
  // users), since Prisma enforces these foreign keys even for an agency
  // that has zero bookings but still has, say, a logo or a bank account set.
  await prisma.package.deleteMany({ where: { agencyId: id } });
  await prisma.media.deleteMany({ where: { agencyId: id } });
  await prisma.bankAccount.deleteMany({ where: { agencyId: id } });
  await prisma.user.deleteMany({ where: { agencyId: id } });
  await prisma.agency.delete({ where: { id } });

  return NextResponse.json({ mode: "deleted" });
}