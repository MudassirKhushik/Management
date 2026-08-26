import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../auth"; // Adjust this relative path if needed to match your project

// ==========================================
// 1. GET HANDLER: Fetch all hotel bookings
// ==========================================
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.hotelBooking.findMany({
      where: { agencyId: session.user.agencyId },
      include: { hotels: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Database connection error on GET /api/hotel-bookings:", error);
    return NextResponse.json([]);
  }
}

// ==========================================
// 2. POST HANDLER: Create a new hotel booking
// ==========================================
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const booking = await prisma.hotelBooking.create({
      data: {
        agencyId: session.user.agencyId,
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo || null,
        // FIXED — was reading body.clientRefNo, a field that never existed on
        // the form (the form sends "referenceNo", same as every other booking
        // type). Reference numbers were silently never saved via Add before this.
        referenceNo: body.referenceNo || null,
        currency: body.currency || "PKR",
        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || "Cash",
        note: body.note || null,
        vendorName: body.vendorName || null,
        paymentStatus: body.paymentStatus || "Pending",
        hotels: {
          create: (body.hotels || []).map((row: any) => ({
            hotelName: row.hotelName,
            city: row.city,
            roomType: row.roomType,
            checkIn: new Date(row.checkIn),
            checkOut: new Date(row.checkOut),
            rooms: parseInt(row.rooms) || 1,
            adults: parseInt(row.adults) || 1,
            children: parseInt(row.children) || 0,
            infants: parseInt(row.infants) || 0,
            mealPlan: row.mealPlan || "RO",
            confirmationNo: row.confirmationNo || null,
            buyingCostPerNight: parseFloat(row.buyingCostPerNight) || 0,
            sellingPricePerNight: parseFloat(row.sellingPricePerNight) || 0,
          })),
        },
      },
      include: { hotels: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Critical error in hotel-bookings POST route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}