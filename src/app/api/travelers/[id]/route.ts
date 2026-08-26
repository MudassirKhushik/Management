// src/app/api/travelers/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.packageBooking.findUnique({
      where: { id },
      include: {
        hotels: true,
        transportSegments: true,
        flightSegments: true,
        visaEntries: true,
      },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in travelers GET [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.packageBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

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

    // Clear all previous line items across every service type before
    // re-creating them — same "delete then recreate" pattern used by every
    // other booking type's PUT route.
    await prisma.hotelBookingEntry.deleteMany({ where: { packageBookingId: id } });
    await prisma.transportSegment.deleteMany({ where: { packageBookingId: id } });
    await prisma.flightSegment.deleteMany({ where: { packageBookingId: id } });
    await prisma.visaEntry.deleteMany({ where: { packageBookingId: id } });

    const booking = await prisma.packageBooking.update({
      where: { id },
      data: {
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo || "",
        referenceNo: body.referenceNo || null,
        currency: body.currency || "USD",

        includeHotels: hotels.length > 0,
        includeTransports: transports.length > 0,
        includeFlights: flights.length > 0,
        includeVisas: visas.length > 0,

        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || null,
        note: body.note || null,
        vendorName: body.vendorName || null,
        paymentStatus: body.paymentStatus || "Pending",

        hotels: {
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
        },

        transportSegments: {
          create: transports.map((row: any) => ({
            vehicle: row.vehicle,
            sector: row.sector,
            pickupDate: new Date(row.pickupDate),
            pickupTime: row.pickupTime,
            qty: Number(row.qty) || 1,
            buyingCost: parseFloat(row.buyingCost) || 0,
            sellingPrice: parseFloat(row.sellingPrice) || 0,
          })),
        },

        flightSegments: {
          create: flights.map((row: any) => ({
            airline: row.airline,
            flightNo: row.flightNo,
            pnr: row.pnr || null,
            departureAirport: row.departureAirport,
            arrivalAirport: row.arrivalAirport,
            departureDateTime: new Date(`${row.departureDate}T${row.departureTime || "00:00"}:00`),
            arrivalDateTime: new Date(`${row.arrivalDate || row.departureDate}T${row.arrivalTime || "00:00"}:00`),
            travelClass: row.travelClass || null,
            adults: Number(row.adults) || 1,
            children: Number(row.children) || 0,
            infants: Number(row.infants) || 0,
            baggage: row.baggage || null,
            buyingCost: parseFloat(row.buyingCost) || 0,
            sellingPrice: parseFloat(row.sellingPrice) || 0,
          })),
        },

        visaEntries: {
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
        },
      },
      include: {
        hotels: true,
        transportSegments: true,
        flightSegments: true,
        visaEntries: true,
      },
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in travelers PUT [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: quick single-field update (Manage page's inline Payment Status dropdown)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.packageBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const booking = await prisma.packageBooking.update({
      where: { id },
      data: {
        ...(body.paymentStatus !== undefined ? { paymentStatus: body.paymentStatus } : {}),
      },
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in travelers PATCH [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.packageBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.packageBooking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in travelers DELETE [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}