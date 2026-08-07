// src/app/api/travelers/route.ts
// v2: no checkbox flags sent from the client anymore. includeX booleans are derived
// server-side from whether each array actually has rows.
// agencyId is always taken from the session, never trusted from the client body.

import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.packageBooking.findMany({
    where: { agencyId: session.user.agencyId },
    include: {
      hotels: true,
      transportSegments: true,
      flightSegments: true,
      visaEntries: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const hotels = Array.isArray(body.hotels) ? body.hotels : [];
  const transports = Array.isArray(body.transports) ? body.transports : [];
  const flights = Array.isArray(body.flights) ? body.flights : [];
  const visas = Array.isArray(body.visas) ? body.visas : [];

  if (hotels.length === 0 && transports.length === 0 && flights.length === 0 && visas.length === 0) {
    return NextResponse.json(
      { error: "Add at least one item (hotel, transport, flight, or visa)." },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.packageBooking.create({
      data: {
        agencyId: session.user.agencyId,
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo,
        referenceNo: body.referenceNo || null,
        currency: body.currency,

        // derived server-side from actual row counts, never trusted from the client
        includeHotels: hotels.length > 0,
        includeTransports: transports.length > 0,
        includeFlights: flights.length > 0,
        includeVisas: visas.length > 0,

        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || null,
        note: body.note || null,

        hotels:
          hotels.length > 0
            ? {
                create: hotels.map((row: any) => ({
                  hotelName: row.hotelName,
                  city: row.city,
                  roomType: row.roomType,
                  checkIn: new Date(row.checkIn),
                  checkOut: new Date(row.checkOut),
                  rooms: Number(row.rooms) || 1,
                  adults: Number(row.adults) || 1,
                  children: Number(row.children) || 0,
                  infants: Number(row.infants) || 0,
                  mealPlan: row.mealPlan || null,
                  confirmationNo: row.confirmationNo || null,
                  buyingCostPerNight: parseFloat(row.buyingCostPerNight) || 0,
                  sellingPricePerNight: parseFloat(row.sellingPricePerNight) || 0,
                })),
              }
            : undefined,

        transportSegments:
          transports.length > 0
            ? {
                create: transports.map((row: any) => ({
                  vehicle: row.vehicle,
                  sector: row.sector,
                  pickupDate: new Date(row.pickupDate),
                  pickupTime: row.pickupTime,
                  qty: Number(row.qty) || 1,
                  buyingCost: parseFloat(row.buyingCost) || 0,
                  sellingPrice: parseFloat(row.sellingPrice) || 0,
                })),
              }
            : undefined,

        // date + time combined the same way as the standalone Flight rebuild —
        // one shared "date" field, separate departure/arrival TIME fields.
        flightSegments:
          flights.length > 0
            ? {
                create: flights.map((row: any) => ({
                  airline: row.airline,
                  flightNo: row.flightNo,
                  pnr: row.pnr || null,
                  departureAirport: row.fromAirport,
                  arrivalAirport: row.toAirport,
                  departureDateTime: new Date(`${row.date}T${row.departureTime || "00:00"}:00`),
                  arrivalDateTime: new Date(`${row.date}T${row.arrivalTime || "00:00"}:00`),
                  travelClass: row.travelClass || null,
                  adults: Number(row.adults) || 1,
                  children: Number(row.children) || 0,
                  infants: Number(row.infants) || 0,
                  baggage: row.baggage || null,
                  buyingCost: parseFloat(row.buyingCost) || 0,
                  sellingPrice: parseFloat(row.sellingPrice) || 0,
                })),
              }
            : undefined,

        visaEntries:
          visas.length > 0
            ? {
                create: visas.map((row: any) => ({
                  visaCategory: row.visaCategory,
                  applicantName: row.applicantName,
                  passportNumber: row.passportNumber,
                  processingType: row.processingType || null,
                  submissionDate: row.submissionDate ? new Date(row.submissionDate) : null,
                  expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
                  buyingCost: parseFloat(row.buyingCost) || 0,
                  sellingPrice: parseFloat(row.sellingPrice) || 0,
                })),
              }
            : undefined,
      },
      include: {
        hotels: true,
        transportSegments: true,
        flightSegments: true,
        visaEntries: true,
      },
    });

    return NextResponse.json(booking);
  } catch (err) {
    console.error("Critical error in package-booking POST route:", err);
    return NextResponse.json({ error: "Could not create package booking." }, { status: 500 });
  }
}