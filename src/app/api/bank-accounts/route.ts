// src/app/api/bank-accounts/route.ts

import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/src/lib/prisma";

// Creates a new blank bank account row, appended after whichever account
// currently has the highest position. The agency fills in the actual
// details afterward via PUT /api/bank-accounts/[id].
export async function POST() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maxPosition = await prisma.bankAccount.aggregate({
    where: { agencyId: session.user.agencyId },
    _max: { position: true },
  });

  const account = await prisma.bankAccount.create({
    data: {
      agencyId: session.user.agencyId,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json(account);
}