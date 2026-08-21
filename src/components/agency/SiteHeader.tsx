// src/components/agency/SiteHeader.tsx
import Link from "next/link";

type AgencyLite = {
  slug: string;
  name: string;
  city: string | null;
  logoUrl?: string | null;
};

// Splits any agency name into "everything but the last word" (black) + "last word" (red) —
// generic brand-wordmark treatment that works for any agency, not just TravelCraft.
function BrandWordmark({ name }: { name: string }) {
  const words = name.trim().split(/\s+/);
  const last = words.pop() || name;
  return (
    <span className="font-display text-xl font-black uppercase whitespace-nowrap">
      <span style={{ color: "var(--tct-black)" }}>
        {words.join(" ")}
        {words.length ? " " : ""}
      </span>
      <span style={{ color: "var(--tct-red)" }}>{last}</span>
    </span>
  );
}

export default function SiteHeader({ agency }: { agency: AgencyLite }) {
  return (
    <header className="sticky top-0 z-50 border-b-4 bg-white" style={{ borderColor: "var(--tct-black)" }}>
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href={`/${agency.slug}`} className="flex items-center gap-2">
          {agency.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agency.logoUrl} alt={agency.name} className="h-10 w-auto" />
          ) : (
            <BrandWordmark name={agency.name} />
          )}
        </Link>

        <nav className="flex gap-6 text-sm font-semibold uppercase tracking-wide">
          <Link href={`/${agency.slug}#packages`}>Packages</Link>
          <Link href={`/${agency.slug}#about`}>About</Link>
          <Link href={`/${agency.slug}#memories`}>Gallery</Link>
          <Link href={`/${agency.slug}#faq`}>FAQ</Link>
        </nav>
      </div>
    </header>
  );
}