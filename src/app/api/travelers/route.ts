// src/app/api/travelers/route.ts
//
// PackageBooking = the combined wizard. Section toggles decide which entry
// types get rows; every entry model is shared with its standalone booking
// via nullable dual FKs.

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.packageBooking.findMany({
      where: { agencyId: session.user.agencyId },
      include: { hotels: true, transportSegments: true, flightSegments: true, visaEntries: true },
      orderBy: { createdAt: "desc" },
    });

    const grouped = await prisma.payment.groupBy({
      by: ["bookingId"],
      where: {
        bookingType: "package",
        agencyId: session.user.agencyId,
        bookingId: { in: bookings.map((b) => b.id) },
      },
      _sum: { amount: true },
    });
    const paidMap = new Map(grouped.map((g) => [g.bookingId, g._sum.amount || 0]));

    return NextResponse.json(bookings.map((b) => ({ ...b, totalPaid: paidMap.get(b.id) || 0 })));
  } catch (error: any) {
    console.error("Error on GET /api/travelers:", error);
    return NextResponse.json([]);
  }
}

// Shared by POST and PUT — the nested-create payload for all four sections.
// Sections that are toggled off create nothing, so unchecking a box and
// saving genuinely removes those rows.
export function buildSectionCreates(body: any) {
  return {
    hotels: {
      create: body.includeHotels
        ? (body.hotels || []).map((row: any) => ({
            hotelName: row.hotelName,
            city: row.city,
            roomType: row.roomType,
            checkIn: new Date(row.checkIn),
            checkOut: new Date(row.checkOut),
            rooms: parseInt(row.rooms) || 1,
            adults: parseInt(row.adults) || 1,
            children: parseInt(row.children) || 0,
            infants: parseInt(row.infants) || 0,
            mealPlan: row.mealPlan || null,
            confirmationNo: row.confirmationNo || null,
            adultBuyingPricePerNight: parseFloat(row.adultBuyingPricePerNight) || 0,
            adultSellingPricePerNight: parseFloat(row.adultSellingPricePerNight) || 0,
            childBuyingPricePerNight: parseFloat(row.childBuyingPricePerNight) || 0,
            childSellingPricePerNight: parseFloat(row.childSellingPricePerNight) || 0,
          }))
        : [],
    },
    transportSegments: {
      create: body.includeTransports
        ? (body.transportSegments || []).map((row: any) => ({
            vehicle: row.vehicle,
            sector: row.sector,
            pickupDate: new Date(row.pickupDate),
            pickupTime: row.pickupTime || "",
            qty: parseInt(row.qty) || 1,
            driverContact: row.driverContact || null,
            buyingCost: parseFloat(row.buyingCost) || 0,
            sellingPrice: parseFloat(row.sellingPrice) || 0,
          }))
        : [],
    },
    flightSegments: {
      create: body.includeFlights
        ? (body.flightSegments || []).map((row: any) => ({
            airline: row.airline,
            flightNo: row.flightNo,
            pnr: row.pnr || null,
            departureAirport: row.departureAirport,
            arrivalAirport: row.arrivalAirport,
            departureDateTime: new Date(row.departureDateTime),
            arrivalDateTime: new Date(row.arrivalDateTime),
            travelClass: row.travelClass || null,
            adults: parseInt(row.adults) || 0,
            children: parseInt(row.children) || 0,
            infants: parseInt(row.infants) || 0,
            baggage: row.baggage || null,
            passengerNames: Array.isArray(row.passengerNames)
              ? row.passengerNames.map((n: string) => n.trim()).filter(Boolean).join("\n") || null
              : row.passengerNames || null,
            adultBuyingPricePerLeg: parseFloat(row.adultBuyingPricePerLeg) || 0,
            adultSellingPricePerLeg: parseFloat(row.adultSellingPricePerLeg) || 0,
            childBuyingPricePerLeg: parseFloat(row.childBuyingPricePerLeg) || 0,
            childSellingPricePerLeg: parseFloat(row.childSellingPricePerLeg) || 0,
            infantBuyingPricePerLeg: parseFloat(row.infantBuyingPricePerLeg) || 0,
            infantSellingPricePerLeg: parseFloat(row.infantSellingPricePerLeg) || 0,
          }))
        : [],
    },
    visaEntries: {
      create: body.includeVisas
        ? (body.visaEntries || []).map((row: any) => ({
            visaCategory: row.visaCategory,
            applicantName: row.applicantName,
            passportNumber: row.passportNumber,
            companyName: row.companyName || null,
            processingType: row.processingType || null,
            submissionDate: row.submissionDate ? new Date(row.submissionDate) : null,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
            buyingCost: parseFloat(row.buyingCost) || 0,
            sellingPrice: parseFloat(row.sellingPrice) || 0,
          }))
        : [],
    },
  };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Hotel rows are entered in SAR, so a package containing hotels needs a
    // real rate or their contribution to the PKR total will be wrong.
    if (body.includeHotels && (!body.exchangeRate || parseFloat(body.exchangeRate) <= 0)) {
      return NextResponse.json(
        { error: "Exchange rate is required when the package includes hotels." },
        { status: 400 }
      );
    }

    const booking = await prisma.packageBooking.create({
      data: {
        agencyId: session.user.agencyId,
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo || "",
        referenceNo: body.referenceNo || null,
        currency: body.currency || "PKR",
        exchangeRate: parseFloat(body.exchangeRate) || 1,
        includeHotels: !!body.includeHotels,
        includeTransports: !!body.includeTransports,
        includeFlights: !!body.includeFlights,
        includeVisas: !!body.includeVisas,
        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || null,
        note: body.note || null,
        vendorName: body.vendorName || null,
        paymentStatus: "Pending",
        ...buildSectionCreates(body),
      },
      include: { hotels: true, transportSegments: true, flightSegments: true, visaEntries: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error in travelers POST route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}