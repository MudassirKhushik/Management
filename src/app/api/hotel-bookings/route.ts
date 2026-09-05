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

    // Phase 1: attach totalPaid per booking in one grouped query instead of
    // an N+1 fetch per row — the Manage page's Remaining Balance column
    // reads this directly rather than calling /api/payments per booking.
    const paidTotals = await prisma.payment.groupBy({
      by: ["bookingId"],
      where: { bookingType: "hotel", bookingId: { in: bookings.map((b) => b.id) } },
      _sum: { amount: true },
    });
    const paidMap = new Map(paidTotals.map((p) => [p.bookingId, p._sum.amount || 0]));
    const withTotals = bookings.map((b) => ({ ...b, totalPaid: paidMap.get(b.id) || 0 }));

    return NextResponse.json(withTotals);
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

    // Item 5 (round 3): exchange rate is required now — a booking with no
    // rate has no way to compute the agency's converted revenue/profit.
    if (!body.exchangeRate || parseFloat(body.exchangeRate) <= 0) {
      return NextResponse.json({ error: "Exchange rate is required" }, { status: 400 });
    }

    const booking = await prisma.hotelBooking.create({
      data: {
        agencyId: session.user.agencyId,
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo || null,
        referenceNo: body.referenceNo || null,
        currency: body.currency || "PKR",
        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || "Cash",
        note: body.note || null,
        vendorName: body.vendorName || null,
        paymentStatus: body.paymentStatus || "Pending",
        exchangeRate: parseFloat(body.exchangeRate) || 0,
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
            // Phase 1a — replaces buyingCostPerNight/sellingPricePerNight
            adultBuyingPricePerNight: parseFloat(row.adultBuyingPricePerNight) || 0,
            adultSellingPricePerNight: parseFloat(row.adultSellingPricePerNight) || 0,
            childBuyingPricePerNight: parseFloat(row.childBuyingPricePerNight) || 0,
            childSellingPricePerNight: parseFloat(row.childSellingPricePerNight) || 0,
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