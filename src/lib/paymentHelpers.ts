// src/lib/paymentHelpers.ts
//
// Shared by /api/payments routes. bookingType + bookingId is a loose pair
// (see Payment model) that can point at any of the five booking types.
// All five now implement Net Total, so the auto-flip works everywhere.

import { prisma } from "@/src/lib/prisma";
import {
  calculateHotelEntryTotals,
  calculateFlightSegmentTotals,
  calculatePackageLineItems,
  sumLineItems,
  calculateFooterTotals,
} from "@/src/lib/pricingCalculations";

export const VALID_BOOKING_TYPES = ["hotel", "transport", "flight", "visa", "package"] as const;
export type BookingType = (typeof VALID_BOOKING_TYPES)[number];

export async function findBookingForOwnershipCheck(bookingType: BookingType, bookingId: string) {
  switch (bookingType) {
    case "hotel":
      return prisma.hotelBooking.findUnique({ where: { id: bookingId } });
    case "transport":
      return prisma.transportBooking.findUnique({ where: { id: bookingId } });
    case "flight":
      return prisma.flightBooking.findUnique({ where: { id: bookingId } });
    case "visa":
      return prisma.visaBooking.findUnique({ where: { id: bookingId } });
    case "package":
      return prisma.packageBooking.findUnique({ where: { id: bookingId } });
    default:
      return null;
  }
}

export async function getBookingNetTotal(bookingType: BookingType, bookingId: string): Promise<number> {
  if (bookingType === "hotel") {
    const booking = await prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotels: true },
    });
    if (!booking) throw new Error("Booking not found");

    const rowTotals = booking.hotels.map((h) => calculateHotelEntryTotals(h));
    const { grossBuying, grossSelling } = sumLineItems(
      rowTotals.map((t) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal }))
    );
    // Left in SAR on purpose — this is what the client actually owes, and
    // the exchangeRate is only for the agency's internal PKR reporting.
    return calculateFooterTotals({
      grossBuying,
      grossSelling,
      discount: booking.discount,
      vatPercent: booking.vatPercent,
    }).netTotal;
  }

  if (bookingType === "transport") {
    const booking = await prisma.transportBooking.findUnique({
      where: { id: bookingId },
      include: { segments: true },
    });
    if (!booking) throw new Error("Booking not found");

    const { grossBuying, grossSelling } = sumLineItems(
      booking.segments.map((s) => ({ buyingCost: s.buyingCost, sellingPrice: s.sellingPrice }))
    );
    return calculateFooterTotals({
      grossBuying,
      grossSelling,
      discount: booking.discount,
      vatPercent: booking.vatPercent,
    }).netTotal;
  }

  if (bookingType === "flight") {
    const booking = await prisma.flightBooking.findUnique({
      where: { id: bookingId },
      include: { segments: true },
    });
    if (!booking) throw new Error("Booking not found");

    const rowTotals = booking.segments.map((s) => calculateFlightSegmentTotals(s));
    const { grossBuying, grossSelling } = sumLineItems(
      rowTotals.map((t) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal }))
    );
    return calculateFooterTotals({
      grossBuying,
      grossSelling,
      discount: booking.discount,
      vatPercent: booking.vatPercent,
    }).netTotal;
  }

  if (bookingType === "visa") {
    const booking = await prisma.visaBooking.findUnique({
      where: { id: bookingId },
      include: { entries: true },
    });
    if (!booking) throw new Error("Booking not found");

    const { grossBuying, grossSelling } = sumLineItems(
      booking.entries.map((e) => ({ buyingCost: e.buyingCost, sellingPrice: e.sellingPrice }))
    );
    return calculateFooterTotals({
      grossBuying,
      grossSelling,
      discount: booking.discount,
      vatPercent: booking.vatPercent,
    }).netTotal;
  }

  if (bookingType === "package") {
    const booking = await prisma.packageBooking.findUnique({
      where: { id: bookingId },
      include: { hotels: true, transportSegments: true, flightSegments: true, visaEntries: true },
    });
    if (!booking) throw new Error("Booking not found");

    // Hotel lines get converted to PKR by exchangeRate inside this helper;
    // everything else is already PKR. Result is one PKR net total.
    const lines = calculatePackageLineItems(booking, booking.exchangeRate);
    const { grossBuying, grossSelling } = sumLineItems(lines);
    return calculateFooterTotals({
      grossBuying,
      grossSelling,
      discount: booking.discount,
      vatPercent: booking.vatPercent,
    }).netTotal;
  }

  throw new Error(`Unknown bookingType "${bookingType}"`);
}

export async function updateBookingPaymentStatus(bookingType: BookingType, bookingId: string, newStatus: string) {
  const data = { paymentStatus: newStatus };
  switch (bookingType) {
    case "hotel":
      await prisma.hotelBooking.update({ where: { id: bookingId }, data });
      break;
    case "transport":
      await prisma.transportBooking.update({ where: { id: bookingId }, data });
      break;
    case "flight":
      await prisma.flightBooking.update({ where: { id: bookingId }, data });
      break;
    case "visa":
      await prisma.visaBooking.update({ where: { id: bookingId }, data });
      break;
    case "package":
      await prisma.packageBooking.update({ where: { id: bookingId }, data });
      break;
  }
}