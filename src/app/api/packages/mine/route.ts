import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";

// This is the PORTAL-side listing - it reads the agency from the
// login session, unlike the public /api/packages route which reads
// the agency from a URL slug (since public visitors aren't logged in).
export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packages = await prisma.package.findMany({
    where: { agencyId: session.user.agencyId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(packages);
}