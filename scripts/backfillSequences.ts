// scripts/backfillSequences.ts — one-time backfill, safe to re-run (skips anything already numbered)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TYPES: { model: any; type: string; prefix: string; start: number }[] = [
  { model: prisma.hotelBooking, type: "hotel", prefix: "H", start: 100 },
  { model: prisma.transportBooking, type: "transport", prefix: "T", start: 100 },
  { model: prisma.flightBooking, type: "flight", prefix: "F", start: 100 },
  { model: prisma.visaBooking, type: "visa", prefix: "V", start: 100 },
  { model: prisma.packageBooking, type: "package", prefix: "FP", start: 100 },
];

async function run() {
  for (const t of TYPES) {
    const agencies: { agencyId: string }[] = await t.model.findMany({
      distinct: ["agencyId"], select: { agencyId: true },
    });
    for (const { agencyId } of agencies) {
      const rows = await t.model.findMany({
        where: { agencyId, voucherNumber: null },
        orderBy: { createdAt: "asc" },
      });
      if (rows.length === 0) continue;

      const existingSeq = await prisma.agencySequence.findUnique({
        where: { agencyId_key: { agencyId, key: t.type } },
      });
      let next = existingSeq?.nextNumber ?? t.start;

      for (const row of rows) {
        await t.model.update({ where: { id: row.id }, data: { voucherNumber: `${t.prefix}-${next}` } });
        next += 1;
      }
      await prisma.agencySequence.upsert({
        where: { agencyId_key: { agencyId, key: t.type } },
        create: { agencyId, key: t.type, nextNumber: next },
        update: { nextNumber: next },
      });
      console.log(`${t.type}: backfilled ${rows.length} for agency ${agencyId}, next=${next}`);
    }
  }

  // Vendor codes
  const vendors = await prisma.vendor.findMany({ where: { vendorCode: null }, orderBy: { createdAt: "asc" } });
  const byAgency = new Map<string, typeof vendors>();
  for (const v of vendors) {
    if (!byAgency.has(v.agencyId)) byAgency.set(v.agencyId, []);
    byAgency.get(v.agencyId)!.push(v);
  }
  for (const [agencyId, list] of byAgency) {
    const existingSeq = await prisma.agencySequence.findUnique({
      where: { agencyId_key: { agencyId, key: "vendor" } },
    });
    let next = existingSeq?.nextNumber ?? 1000;
    for (const v of list) {
      await prisma.vendor.update({ where: { id: v.id }, data: { vendorCode: `VN-${next}` } });
      next += 1;
    }
    await prisma.agencySequence.upsert({
      where: { agencyId_key: { agencyId, key: "vendor" } },
      create: { agencyId, key: "vendor", nextNumber: next },
      update: { nextNumber: next },
    });
  }

  console.log("Backfill complete.");
}
run().finally(() => prisma.$disconnect());