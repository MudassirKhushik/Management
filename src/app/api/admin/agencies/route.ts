import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "../../../../../auth";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return null;
  return session;
}

// GET = list every agency, with its one login's email attached
export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agencies = await prisma.agency.findMany({
    orderBy: { createdAt: "desc" },
    include: { users: { select: { email: true } } },
  });
  return NextResponse.json(agencies);
}

// POST = create a brand new agency + its one login, in one step
export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const slug = (body.slug || "").trim().toLowerCase();

  const existing = await prisma.agency.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "That agency slug is already taken." }, { status: 400 });
  }

  const agency = await prisma.agency.create({
    data: { slug, name: body.name },
  });

  await prisma.user.create({
    data: {
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 10),
      agencyId: agency.id,
      isSuperAdmin: false,
    },
  });

  return NextResponse.json(agency);
}