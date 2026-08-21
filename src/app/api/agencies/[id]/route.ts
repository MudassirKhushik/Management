// src/app/api/admin/agencies/[id]/route.ts
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return null;
  return session;
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

// DELETE = deactivate (soft delete) by default; hard-delete only if nothing depends on it
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [bookingCounts] = await prisma.$transaction([
    prisma.packageBooking.count({ where: { agencyId: id } }),
  ]);

  if (bookingCounts > 0) {
    const agency = await prisma.agency.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ mode: "deactivated", agency });
  }

  await prisma.user.deleteMany({ where: { agencyId: id } });
  await prisma.agency.delete({ where: { id } });
  return NextResponse.json({ mode: "deleted" });
}