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
  const booking = await prisma.transportBooking.findUnique({
    where: { id },
    include: { segments: true },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}

// PUT — edit (replaces segments)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.transportBooking.findUnique({ where: { id } });

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
    paymentType,
    surcharge,
    discount,
    vatPercent,
    segments,
  } = body;

  await prisma.transportSegment.deleteMany({ where: { transportBookingId: id } });

  const updated = await prisma.transportBooking.update({
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
      paymentType,
      surcharge: surcharge ?? 0,
      discount: discount ?? 0,
      vatPercent: vatPercent ?? 0,
      segments: {
        create: segments.map((s: any) => ({
          date: new Date(s.date),
          time: s.time,
          fromLoc: s.fromLoc,
          toLoc: s.toLoc,
          vehicle: s.vehicle,
          qty: s.qty ?? 1,
          adults: s.adults ?? 1,
          mlRate: s.mlRate ?? 0,
          rate: s.rate,
        })),
      },
    },
    include: { segments: true },
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
  const existing = await prisma.transportBooking.findUnique({ where: { id } });

  if (!existing || existing.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.transportBooking.delete({ where: { id } });

  return NextResponse.json({ success: true });
}