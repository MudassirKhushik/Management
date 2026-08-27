import { auth, signOut } from "../../../../auth";
import { prisma } from "@/src/lib/prisma";
import { NavLink } from "@/src/components/portal/NavLink";
import { PortalHeader } from "@/src/components/portal/PortalHeader";
import { PortalFooter } from "@/src/components/portal/PortalFooter";
import { AgencyThemeProvider } from "@/src/hooks/useAgencyTheme";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Read live from the database rather than trusting the session's cached
  // snapshot — session.user.agencyLogoUrl/agencyColor are set once at
  // login and DON'T update when the agency changes their logo/color via
  // Settings. JWT sessions don't retroactively refresh, so without this,
  // every branding change would require a manual log-out/log-in to show.
  const dbAgency = session?.user?.agencyId
    ? await prisma.agency.findUnique({
        where: { id: session.user.agencyId },
        select: { name: true, slug: true, city: true, primaryColor: true, logoUrl: true },
      })
    : null;

  const agency = {
    name: dbAgency?.name || session?.user?.agencyName || "",
    slug: dbAgency?.slug || session?.user?.agencySlug || "",
    city: dbAgency?.city ?? null,
    primaryColor: dbAgency?.primaryColor || (session?.user as any)?.agencyColor || null,
    logoUrl: dbAgency?.logoUrl || (session?.user as any)?.agencyLogoUrl || null,
  };

  return (
    <AgencyThemeProvider agency={agency}>
      <div className="flex min-h-screen" style={{ ["--agency-color" as string]: agency.primaryColor || "#D2232A" }}>
        <aside className="w-64 flex flex-col shrink-0 bg-[#0E0E0E] text-white sticky top-0 h-screen">
          {/* Logo — fixed, never scrolls */}
          <div className="px-6 pt-7 pb-5 flex items-center gap-3 border-b border-white/10 shrink-0">
            {agency.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agency.logoUrl} alt={agency.name} className="h-9 w-auto" />
            ) : (
              <h2 className="font-black uppercase text-lg tracking-tight leading-none">
                {agency.name || "Portal"}
              </h2>
            )}
          </div>

          {/* Nav — the only part that scrolls, fills the space between logo and logout */}
          <nav className="flex-1 overflow-y-auto flex flex-col gap-1 py-5 px-3">
            <NavLink href="/portal">Dashboard</NavLink>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] px-4 pt-6 pb-2 text-[#8a8a8a]">
              Master Operations
            </p>
            <NavLink href="/portal/travelers/add">Full Package Booking</NavLink>
            <NavLink href="/portal/travelers/manage" indent>Manage Packages</NavLink>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] px-4 pt-6 pb-2 text-[#8a8a8a]">
              Hotel
            </p>
            <NavLink href="/portal/hotel-bookings/add" indent>Hotel Booking</NavLink>
            <NavLink href="/portal/hotel-bookings/manage" indent>Manage Hotels</NavLink>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] px-4 pt-6 pb-2 text-[#8a8a8a]">
              Transport
            </p>
            <NavLink href="/portal/transport-bookings/add" indent>Transport Booking</NavLink>
            <NavLink href="/portal/transport-bookings/manage" indent>Manage Transport</NavLink>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] px-4 pt-6 pb-2 text-[#8a8a8a]">
              Flight
            </p>
            <NavLink href="/portal/flight-bookings/add" indent>Flight Booking</NavLink>
            <NavLink href="/portal/flight-bookings/manage" indent>Manage Flights</NavLink>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] px-4 pt-6 pb-2 text-[#8a8a8a]">
              Visa
            </p>
            <NavLink href="/portal/visa-bookings/add" indent>Visa Booking</NavLink>
            <NavLink href="/portal/visa-bookings/manage" indent>Manage Visas</NavLink>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] px-4 pt-6 pb-2 text-[#8a8a8a]">
              Marketing &amp; Settings
            </p>
            <NavLink href="/portal/settings" indent>Agency Settings</NavLink>
            <NavLink href="/portal/packages/add" indent>Add Website Package</NavLink>
            <NavLink href="/portal/packages/manage" indent>Manage Website Packages</NavLink>
            <NavLink href="/portal/notifications" indent>Notifications</NavLink>
          </nav>

          {/* Logout — fixed, never scrolls */}
          {session && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/portal/login" });
              }}
              className="px-6 py-5 border-t border-white/10 shrink-0"
            >
              <button className="w-full text-left text-sm font-semibold text-[#D2232A] hover:text-white transition">
                Log out
              </button>
            </form>
          )}
        </aside>
        <main className="flex-1 bg-[#FAF9F6] flex flex-col min-h-screen">
          <PortalHeader />
          <div className="flex-1">{children}</div>
          <PortalFooter />
        </main>
      </div>
    </AgencyThemeProvider>
  );
}