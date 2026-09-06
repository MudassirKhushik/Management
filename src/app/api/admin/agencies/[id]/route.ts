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

  // --- NAYA CHECK: Edit mode me duplicate domain protection ---
  if (body.customDomain !== undefined) {
    const cleanDomain = body.customDomain ? body.customDomain.trim().toLowerCase() : null;
    if (cleanDomain) {
      const duplicateDomain = await prisma.agency.findFirst({
        where: {
          customDomain: cleanDomain,
          NOT: { id } // Apni id chor kar baki check karo
        }
      });
      if (duplicateDomain) {
        return NextResponse.json({ error: "This custom domain is already used by another agency." }, { status: 400 });
      }
    }
  }

  const updated = await prisma.agency.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.city !== undefined ? { city: body.city } : {}),
      ...(body.primaryColor !== undefined ? { primaryColor: body.primaryColor } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      ...(typeof body.publicSiteEnabled === "boolean" ? { publicSiteEnabled: body.publicSiteEnabled } : {}),
      // --- NAYA UPDATE: Custom domain ko data structure me include kiya ---
      ...(body.customDomain !== undefined ? { customDomain: body.customDomain ? body.customDomain.trim().toLowerCase() : null } : {}),
    },
  });

  return NextResponse.json(updated);
}

// DELETE = deactivate (soft delete) if the agency has any real business data...
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

  await prisma.package.deleteMany({ where: { agencyId: id } });
  await prisma.media.deleteMany({ where: { agencyId: id } });
  await prisma.bankAccount.deleteMany({ where: { agencyId: id } });
  await prisma.user.deleteMany({ where: { agencyId: id } });
  await prisma.agency.delete({ where: { id } });

  return NextResponse.json({ mode: "deleted" });
}
