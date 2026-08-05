import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/src/lib/prisma";

// GET → list this agency's flight bookings
export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const bookings = await prisma.flightBooking.findMany({
    where: { agencyId: session.user.agencyId },
    include: { segments: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

// POST → create booking with segments in one call
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
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

  if (!agentName || !nationality || !guestName || !segments || segments.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const booking = await prisma.flightBooking.create({
    data: {
      agencyId: session.user.agencyId,
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

  return NextResponse.json(booking, { status: 201 });
}