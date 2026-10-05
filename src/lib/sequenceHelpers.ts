// src/lib/sequenceHelpers.ts
//
// One counter per agency per purpose. Generates short, human-readable,
// auto-incrementing codes — H-100, VN-1000, LGR-100 — never reused, never
// editable once assigned. Call this exactly once, at creation time, and
// store the result; never regenerate on edit.

import { prisma } from "@/src/lib/prisma";

export const SEQUENCE_CONFIG = {
  hotel: { prefix: "H", start: 100 },
  transport: { prefix: "T", start: 100 },
  flight: { prefix: "F", start: 100 },
  visa: { prefix: "V", start: 100 },
  package: { prefix: "FP", start: 100 },
  vendor: { prefix: "VN", start: 1000 },
  ledger: { prefix: "LGR", start: 100 },
} as const;

export type SequenceKey = keyof typeof SEQUENCE_CONFIG;

export async function getNextSequenceNumber(agencyId: string, key: SequenceKey): Promise<string> {
  const config = SEQUENCE_CONFIG[key];

  const code = await prisma.$transaction(async (tx) => {
    const existing = await tx.agencySequence.findUnique({
      where: { agencyId_key: { agencyId, key } },
    });

    if (!existing) {
      await tx.agencySequence.create({ data: { agencyId, key, nextNumber: config.start + 1 } });
      return config.start;
    }

    await tx.agencySequence.update({
      where: { agencyId_key: { agencyId, key } },
      data: { nextNumber: existing.nextNumber + 1 },
    });
    return existing.nextNumber;
  });

  return `${config.prefix}-${code}`;
}