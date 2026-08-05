import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/src/lib/prisma";

// GET one
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await prisma.visaBooking.findUnique({
    where: { id },
    include: { entries: true },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}

// PUT — edit (replaces entries)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.visaBooking.findUnique({ where: { id } });

  if (!existing || existing.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    agentName,
    agentNo,
    nationality,
    guestName,
    contactName,
    mobileNo,
    clientRefNo,
    groupNo,
    localRefNo,
    reservationNo,
    totalAmount,
    subAmount,
    entries,
  } = body;

  await prisma.visaEntry.deleteMany({ where: { visaBookingId: id } });

  const updated = await prisma.visaBooking.update({
    where: { id },
    data: {
      agentName,
      agentNo,
      nationality,
      guestName,
      contactName,
      mobileNo,
      clientRefNo,
      groupNo,
      localRefNo,
      reservationNo,
      totalAmount,
      subAmount,
      entries: {
        create: entries.map((e: any) => ({
          applicantName: e.applicantName,
          visaType: e.visaType,
          processingType: e.processingType,
          issueDate: e.issueDate ? new Date(e.issueDate) : null,
          expiryDate: e.expiryDate ? new Date(e.expiryDate) : null,
          visaFee: e.visaFee,
          serviceCharge: e.serviceCharge ?? 0,
          confirmationNo: e.confirmationNo,
        })),
      },
    },
    include: { entries: true },
  });

  return NextResponse.json(updated);
}

// DELETE
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.visaBooking.findUnique({ where: { id } });

  if (!existing || existing.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.visaBooking.delete({ where: { id } });

  return NextResponse.json({ success: true });
}