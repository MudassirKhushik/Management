// src/app/api/admin/agencies/route.ts
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) return null;
  return session;
}

// GET = list all agencies, with their one login user's email, for the Admin table
export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agencies = await prisma.agency.findMany({
    include: { users: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(agencies);
}

// POST = create a new agency + its one login user, in a single form submission
export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const slug = (body.slug || "").trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: "Agency slug is required." }, { status: 400 });
  }

  const existing = await prisma.agency.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "An agency with this slug already exists." }, { status: 400 });
  }

  // --- NAYA CHECK: Domain Uniqueness Validation ---
  const customDomain = body.customDomain ? body.customDomain.trim().toLowerCase() : null;
  if (customDomain) {
    const existingDomain = await prisma.agency.findFirst({
      where: { customDomain }
    });
    if (existingDomain) {
      return NextResponse.json({ error: "This custom domain is already assigned to another agency." }, { status: 400 });
    }
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Login email and password are required." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  try {
    const agency = await prisma.agency.create({
      data: {
        slug,
        name: body.name,
        city: body.city || null,
        customDomain, // <-- Database table field me data append kiya
        primaryColor: body.primaryColor || undefined,
        publicSiteEnabled: typeof body.publicSiteEnabled === "boolean" ? body.publicSiteEnabled : true,
        users: {
          create: {
            email: body.email,
            passwordHash,
            isSuperAdmin: false,
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json(agency);
  } catch (err) {
    console.error("Error creating agency:", err);
    return NextResponse.json({ error: "Could not create agency." }, { status: 500 });
  }
}
