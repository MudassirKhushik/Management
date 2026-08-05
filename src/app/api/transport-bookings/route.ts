import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/src/lib/prisma";

// GET → list this agency's transport bookings
export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const bookings = await prisma.transportBooking.findMany({
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
    paymentType,
    surcharge,
    discount,
    vatPercent,
    segments,
  } = body;

  if (!agentName || !nationality || !guestName || !segments || segments.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const booking = await prisma.transportBooking.create({
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

  return NextResponse.json(booking, { status: 201 });
}