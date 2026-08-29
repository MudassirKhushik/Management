// src/app/api/dashboard/arrivals/route.ts
//
// GET /api/dashboard/arrivals?range=today|tomorrow|upcoming
//
// "Arrivals" isn't one table — it's Hotel check-ins AND check-outs + Flight
// departures + Transport pickups, pulled from BOTH standalone bookings AND
// the entries nested inside Package Bookings, merged into one sorted list.

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../auth";

function dayBounds(offsetDays: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, 23, 59, 59, 999);
  return { start, end };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const agencyId = session.user.agencyId;
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "today";

  let start: Date, end: Date;
  if (range === "today") {
    ({ start, end } = dayBounds(0));
  } else if (range === "tomorrow") {
    ({ start, end } = dayBounds(1));
  } else {
    // upcoming — from the day after tomorrow, next 60 days
    start = dayBounds(2).start;
    end = dayBounds(60).end;
  }

  const events: any[] = [];

  try {
    const [
      hotelCheckIns,
      pkgHotelCheckIns,
      hotelCheckOuts,
      pkgHotelCheckOuts,
      transportSegs,
      pkgTransportSegs,
      flightSegs,
      pkgFlightSegs,
    ] = await Promise.all([
      prisma.hotelBookingEntry.findMany({
        where: { checkIn: { gte: start, lte: end }, hotelBooking: { agencyId } },
        include: { hotelBooking: true },
      }),
      prisma.hotelBookingEntry.findMany({
        where: { checkIn: { gte: start, lte: end }, packageBooking: { agencyId } },
        include: { packageBooking: true },
      }),
      // Check-out — a separate query on the same table, matched on checkOut
      // instead of checkIn. A booking can appear once for its check-in date
      // and once (on a different day) for its check-out date — both are
      // real, distinct events worth surfacing on the dashboard.
      prisma.hotelBookingEntry.findMany({
        where: { checkOut: { gte: start, lte: end }, hotelBooking: { agencyId } },
        include: { hotelBooking: true },
      }),
      prisma.hotelBookingEntry.findMany({
        where: { checkOut: { gte: start, lte: end }, packageBooking: { agencyId } },
        include: { packageBooking: true },
      }),
      prisma.transportSegment.findMany({
        where: { pickupDate: { gte: start, lte: end }, booking: { agencyId } },
        include: { booking: true },
      }),
      prisma.transportSegment.findMany({
        where: { pickupDate: { gte: start, lte: end }, packageBooking: { agencyId } },
        include: { packageBooking: true },
      }),
      prisma.flightSegment.findMany({
        where: { departureDateTime: { gte: start, lte: end }, booking: { agencyId } },
        include: { booking: true },
      }),
      prisma.flightSegment.findMany({
        where: { departureDateTime: { gte: start, lte: end }, packageBooking: { agencyId } },
        include: { packageBooking: true },
      }),
    ]);

    hotelCheckIns.forEach((e) => {
      events.push({
        id: `hotel-checkin-${e.id}`,
        type: "hotel",
        guestName: `${e.hotelBooking?.guestName || "—"} (Check-In)`,
        date: e.checkIn,
        detail: `${e.hotelName}, ${e.city}`,
        href: `/portal/hotel-bookings/${e.hotelBookingId}/edit`,
      });
    });
    pkgHotelCheckIns.forEach((e) => {
      events.push({
        id: `pkg-hotel-checkin-${e.id}`,
        type: "hotel",
        guestName: `${e.packageBooking?.guestName || "—"} (Check-In)`,
        date: e.checkIn,
        detail: `${e.hotelName}, ${e.city} (Package)`,
        href: `/portal/travelers/${e.packageBookingId}/edit`,
      });
    });

    hotelCheckOuts.forEach((e) => {
      events.push({
        id: `hotel-checkout-${e.id}`,
        type: "hotel",
        guestName: `${e.hotelBooking?.guestName || "—"} (Check-Out)`,
        date: e.checkOut,
        detail: `${e.hotelName}, ${e.city}`,
        href: `/portal/hotel-bookings/${e.hotelBookingId}/edit`,
      });
    });
    pkgHotelCheckOuts.forEach((e) => {
      events.push({
        id: `pkg-hotel-checkout-${e.id}`,
        type: "hotel",
        guestName: `${e.packageBooking?.guestName || "—"} (Check-Out)`,
        date: e.checkOut,
        detail: `${e.hotelName}, ${e.city} (Package)`,
        href: `/portal/travelers/${e.packageBookingId}/edit`,
      });
    });

    transportSegs.forEach((s) => {
      events.push({
        id: `transport-${s.id}`,
        type: "transport",
        guestName: s.booking?.guestName || "—",
        date: s.pickupDate,
        detail: `${s.sector} · ${s.pickupTime}`,
        href: `/portal/transport-bookings/${s.transportBookingId}/edit`,
      });
    });
    pkgTransportSegs.forEach((s) => {
      events.push({
        id: `pkg-transport-${s.id}`,
        type: "transport",
        guestName: s.packageBooking?.guestName || "—",
        date: s.pickupDate,
        detail: `${s.sector} · ${s.pickupTime} (Package)`,
        href: `/portal/travelers/${s.packageBookingId}/edit`,
      });
    });

    flightSegs.forEach((f) => {
      events.push({
        id: `flight-${f.id}`,
        type: "flight",
        guestName: f.booking?.guestName || "—",
        date: f.departureDateTime,
        detail: `${f.airline} ${f.flightNo}: ${f.departureAirport} → ${f.arrivalAirport}`,
        href: `/portal/flight-bookings/${f.flightBookingId}/edit`,
      });
    });
    pkgFlightSegs.forEach((f) => {
      events.push({
        id: `pkg-flight-${f.id}`,
        type: "flight",
        guestName: f.packageBooking?.guestName || "—",
        date: f.departureDateTime,
        detail: `${f.airline} ${f.flightNo}: ${f.departureAirport} → ${f.arrivalAirport} (Package)`,
        href: `/portal/travelers/${f.packageBookingId}/edit`,
      });
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(events.slice(0, 50));
  } catch (err) {
    console.error("Error loading arrivals:", err);
    return NextResponse.json([]);
  }
}