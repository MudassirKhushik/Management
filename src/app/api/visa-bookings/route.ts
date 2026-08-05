import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/src/lib/prisma";

// GET → list this agency's visa bookings
export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const bookings = await prisma.visaBooking.findMany({
    where: { agencyId: session.user.agencyId },
    include: { entries: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

// POST → create booking with visa entries in one call
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
    totalAmount,
    subAmount,
    entries,
  } = body;

  if (!agentName || !nationality || !guestName || !entries || entries.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const booking = await prisma.visaBooking.create({
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

  return NextResponse.json(booking, { status: 201 });
}