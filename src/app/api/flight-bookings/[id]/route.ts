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
  const booking = await prisma.flightBooking.findUnique({
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
  const existing = await prisma.flightBooking.findUnique({ where: { id } });

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
    reservationDate,
    username,
    paymentType,
    surcharge,
    discount,
    vatPercent,
    specialRequirements,
    note,
    segments,
  } = body;

  await prisma.flightSegment.deleteMany({ where: { flightBookingId: id } });

  const updated = await prisma.flightBooking.update({
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
      reservationDate: reservationDate ? new Date(reservationDate) : null,
      username,
      paymentType,
      surcharge: surcharge ?? 0,
      discount: discount ?? 0,
      vatPercent: vatPercent ?? 0,
      specialRequirements,
      note,
      segments: {
        create: segments.map((s: any) => ({
          date: new Date(s.date),
          airline: s.airline,
          flightNo: s.flightNo,
          pnr: s.pnr,
          fromAirport: s.fromAirport,
          toAirport: s.toAirport,
          departureTime: s.departureTime,
          arrivalTime: s.arrivalTime,
          travelClass: s.travelClass,
          adults: s.adults ?? 1,
          children: s.children ?? 0,
          infants: s.infants ?? 0,
          baggage: s.baggage,
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
  const existing = await prisma.flightBooking.findUnique({ where: { id } });

  if (!existing || existing.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.flightBooking.delete({ where: { id } });

  return NextResponse.json({ success: true });
}