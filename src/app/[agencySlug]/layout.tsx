// src/app/[agencySlug]/layout.tsx
import { prisma } from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import SiteHeader from "@/src/components/agency/SiteHeader";
import SiteFooter from "@/src/components/agency/SiteFooter";

export default async function AgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ agencySlug: string }>;
}) {
  const { agencySlug } = await params;

  if (!agencySlug) notFound();

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency || !agency.isActive) notFound();

  // Agency exists and their account is active, but they've turned their
  // public site off (e.g. they already have their own website). Show an
  // honest message rather than a bare 404 — the agency is real, it just
  // isn't publishing a site right now.
  if (!agency.publicSiteEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-black uppercase text-[#121212] mb-2">
            {agency.name}
          </h1>
          <p className="text-[#6B6B6B]">
            This agency's public website is currently unavailable. Please contact them
            directly to book.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ["--tct-red" as string]: agency.primaryColor || "#D2232A" }}>
      <SiteHeader agency={agency} />
      {children}
      <SiteFooter agency={agency} />
    </div>
  );
}