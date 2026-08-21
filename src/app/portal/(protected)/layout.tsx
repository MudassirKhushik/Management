import { auth, signOut } from "../../../../auth";
import { NavLink } from "@/src/components/portal/NavLink";
import { AgencyThemeProvider } from "@/src/hooks/useAgencyTheme";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const agency = {
    name: session?.user?.agencyName || "",
    slug: session?.user?.agencySlug || "",
    city: null,
    primaryColor: (session?.user as any)?.agencyColor || null,
    logoUrl: (session?.user as any)?.agencyLogoUrl || null,
  };

  return (
    <AgencyThemeProvider agency={agency}>
      <div className="flex min-h-screen">
        <aside className="w-64 flex flex-col justify-between shrink-0 bg-[#0E0E0E] text-white">
          <div>
            <div className="px-6 pt-7 pb-5 flex items-center gap-3 border-b border-white/10">
              {agency.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agency.logoUrl} alt={agency.name} className="h-9 w-auto" />
              ) : (
                <h2 className="font-black uppercase text-lg tracking-tight leading-none">
                  {agency.name || "Portal"}
                </h2>
              )}
            </div>

            <nav className="flex flex-col gap-1 py-5 px-3">
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
              <NavLink href="/portal/packages/add" indent>Add Packages to Website</NavLink>
              <NavLink href="/portal/packages/manage" indent>Manage Packages</NavLink>
              <NavLink href="/portal/notifications" indent>Notifications</NavLink>
            </nav>
          </div>

          {session && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/portal/login" });
              }}
              className="px-6 py-5 border-t border-white/10"
            >
              <button className="w-full text-left text-sm font-semibold text-[#D2232A] hover:text-white transition">
                Log out
              </button>
            </form>
          )}
        </aside>
        <main className="flex-1 bg-[#FAF9F6]">{children}</main>
      </div>
    </AgencyThemeProvider>
  );
}