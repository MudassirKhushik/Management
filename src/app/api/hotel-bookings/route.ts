import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/src/lib/prisma";

// GET → list this agency's own hotel bookings (protected, session-based)
export async function GET() {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const bookings = await prisma.hotelBooking.findMany({
    where: { agencyId: session.user.agencyId },
    include: { hotels: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

// POST → create a new hotel booking, with its hotel rows, in one call
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
    vatNumber,
    optionDate,
    totalAmount,
    subAmount,
    hotels, // array of hotel rows from the form
  } = body;

  // Basic required-field check — keeps bad data out
  if (!agentName || !nationality || !guestName || !hotels || hotels.length === 0) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const booking = await prisma.hotelBooking.create({
    data: {
      agencyId: session.user.agencyId, // NEVER trust a client-sent agencyId
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

  return NextResponse.json(booking, { status: 201 });
}