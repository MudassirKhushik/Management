import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

const PACKAGE_LIMIT = 20;

// GET is PUBLIC on purpose - visitors browsing an agency's site aren't
// logged in. So instead of reading the agency from a session, we read
// it from a `?agencySlug=` in the URL, which the public page provides.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agencySlug = searchParams.get("agencySlug");

  if (!agencySlug) {
    return NextResponse.json({ error: "agencySlug is required" }, { status: 400 });
  }

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency || !agency.isActive) {
    return NextResponse.json([]); // unknown/inactive agency = just show no packages
  }

  const packages = await prisma.package.findMany({
    where: { agencyId: agency.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(packages);
}

// POST is PROTECTED - only a logged-in agency can add ITS OWN package.
// Capped at PACKAGE_LIMIT per agency — checked server-side so the limit
// can't be bypassed even if the Add page's client-side check is skipped.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingCount = await prisma.package.count({ where: { agencyId: session.user.agencyId } });
  if (existingCount >= PACKAGE_LIMIT) {
    return NextResponse.json(
      { error: `You've reached the maximum of ${PACKAGE_LIMIT} packages. Remove one before adding another.` },
      { status: 400 }
    );
  }

  const body = await req.json();
  const pkg = await prisma.package.create({
    data: {
      agencyId: session.user.agencyId,
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl || null,
    },
  });
  return NextResponse.json(pkg);
}