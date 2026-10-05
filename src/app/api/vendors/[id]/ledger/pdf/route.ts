export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "../../../../../../../auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { VendorLedgerDocument } from "@/src/lib/pdf/VendorLedgerDocument";
import { getVendorLedger } from "@/src/lib/vendorHelpers";
import { getNextSequenceNumber } from "@/src/lib/sequenceHelpers";
import React from "react";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const agencyId = session.user.agencyId;

  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor || vendor.agencyId !== agencyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

  const { entries, totalBought, totalPaid } = await getVendorLedger(agencyId, id);
  const ledgerNumber = await getNextSequenceNumber(agencyId, "ledger");

  try {
    const buffer = await renderToBuffer(
      React.createElement(VendorLedgerDocument, {
        vendor,
        agency,
        entries,
        totalBought,
        totalPaid,
        ledgerNumber,
      }) as any
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="ledger-${vendor.vendorCode || id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Error rendering vendor ledger PDF:", err);
    return NextResponse.json({ error: "Could not generate PDF." }, { status: 500 });
  }
}