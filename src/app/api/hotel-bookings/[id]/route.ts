import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/src/lib/prisma";

// GET one booking
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await prisma.hotelBooking.findUnique({
    where: { id },
    include: { hotels: true },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}

// PUT — edit booking (replaces hotel rows)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.hotelBooking.findUnique({ where: { id } });

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
    vatNumber,
    optionDate,
    totalAmount,
    subAmount,
    hotels,
  } = body;

  // delete old hotel rows, recreate new ones — simplest way to
  // handle add/remove rows on edit without diffing
  await prisma.hotelBookingEntry.deleteMany({ where: { hotelBookingId: id } });

  const updated = await prisma.hotelBooking.update({
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
      vatNumber,
      optionDate: optionDate ? new Date(optionDate) : null,
      totalAmount,
      subAmount,
      hotels: {
        create: hotels.map((h: any) => ({
          hotelName: h.hotelName,
          city: h.city,
          roomType: h.roomType,
          checkIn: new Date(h.checkIn),
          checkOut: new Date(h.checkOut),
          rooms: h.rooms ?? 1,
          adults: h.adults ?? 1,
          children: h.children ?? 0,
          meals: h.meals,
          dayRate: h.dayRate,
          mlRate: h.mlRate ?? 0,
          confirmationNo: h.confirmationNo,
        })),
      },
    },
    include: { hotels: true },
  });

  return NextResponse.json(updated);
}

// DELETE booking
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.hotelBooking.findUnique({ where: { id } });

  if (!existing || existing.agencyId !== session.user.agencyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.hotelBooking.delete({ where: { id } });

  return NextResponse.json({ success: true });
}