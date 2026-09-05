// src/app/api/bank-accounts/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../auth"; // adjust relative depth to match your project if needed
import { prisma } from "@/src/lib/prisma";

// GET — list this agency's bank accounts, ordered for display
export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.bankAccount.findMany({
    where: { agencyId: session.user.agencyId },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(accounts);
}

// POST — add a new bank account. agencyId always comes from the session,
// never from client input.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // The Settings page's "+ Add Bank Account" button POSTs with no body at
    // all (it creates a blank row, then the per-account card edits it via
    // PUT) — request.json() throws on an empty body, so parse defensively.
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const count = await prisma.bankAccount.count({ where: { agencyId: session.user.agencyId } });

    const account = await prisma.bankAccount.create({
      data: {
        agencyId: session.user.agencyId,
        accountName: body.accountName || null,
        bankName: body.bankName || null,
        accountNo: body.accountNo || null,
        iban: body.iban || null,
        address: body.address || null,
        position: count,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Failed to create bank account:", error);
    return NextResponse.json({ error: "Failed to create bank account" }, { status: 500 });
  }
}
