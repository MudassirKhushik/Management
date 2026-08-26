// src/app/api/visa-bookings/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../auth";

type RouteParams = { params: Promise<{ id: string }> };

// GET single booking
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.visaBooking.findUnique({
      where: { id },
      include: { entries: true },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in visa-bookings GET [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PUT: full update
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.visaBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    await prisma.visaEntry.deleteMany({ where: { visaBookingId: id } });

    const booking = await prisma.visaBooking.update({
      where: { id },
      data: {
        agentName: body.agentName,
        guestName: body.guestName,
        nationality: body.nationality,
        mobileNo: body.mobileNo || "",
        referenceNo: body.referenceNo || null,
        currency: body.currency || "USD",
        discount: parseFloat(body.discount) || 0,
        vatPercent: parseFloat(body.vatPercent) || 0,
        paymentType: body.paymentType || null,
        note: body.note || null,
        vendorName: body.vendorName || null,
        paymentStatus: body.paymentStatus || "Pending",
        entries: {
          create: (body.entries || []).map((row: any) => ({
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
      include: { entries: true },
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in visa-bookings PUT [id] route:", error);
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

    const existing = await prisma.visaBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const booking = await prisma.visaBooking.update({
      where: { id },
      data: {
        ...(body.paymentStatus !== undefined ? { paymentStatus: body.paymentStatus } : {}),
      },
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error in visa-bookings PATCH [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.visaBooking.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.visaBooking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in visa-bookings DELETE [id] route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}