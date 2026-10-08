import { cookies } from "next/headers";
import { auth, signOut } from "../../../../auth";
import { prisma } from "@/src/lib/prisma";
import { PortalHeader } from "@/src/components/portal/PortalHeader";
import { PortalFooter } from "@/src/components/portal/PortalFooter";
import { AgencyThemeProvider } from "@/src/hooks/useAgencyTheme";
import SidebarShell from "@/src/components/portal/SidebarShell";
import {
  RailNavLink,
  SidebarSectionLabel,
  SidebarBrand,
  SidebarLogoutButton,
} from "@/src/components/portal/SidebarNav";
import {
  IconDashboard,
  IconPackage,
  IconHotel,
  IconTransport,
  IconFlight,
  IconVisa,
  IconMarketing,
  IconSettings,
  IconBell,
} from "@/src/components/portal/NavIcons";

// Custom standard icons for Vendors and Reports to match your theme structure
function IconVendor() {
  return (
    <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zs" />
    </svg>
  );
}

function IconReport() {
  return (
    <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0h.5m-.5 0h-10.5m0 0h-.5m5.25-15.75A1.5 1.5 0 0 1 12 3v3.75m0 0a1.5 1.5 0 0 1-1.5 1.5H8.25m3.75-1.5a1.5 1.5 0 0 0 1.5 1.5h2.25m-3.75-3V16.5" />
    </svg>
  );
}

// Visual layout helper for the "Soon" indicator tag
function SoonBadge() {
  return (
    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/60 px-2 py-0.5 rounded-full border border-white/5 group-hover:text-white group-hover:bg-white/20 transition-colors">
      Soon
    </span>
  );
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

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

  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get("sidebar-collapsed")?.value === "1";

  const sidebar = (
    <>
      <SidebarBrand logoUrl={agency.logoUrl} name={agency.name} />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1 py-5 px-3">
  <RailNavLink href="/portal" icon={<IconDashboard />}>
    Dashboard
  </RailNavLink>

  <SidebarSectionLabel>Master Operations</SidebarSectionLabel>
  <RailNavLink href="/portal/travelers/add" icon={<IconPackage />} hideInRail>
    Full Package Booking
  </RailNavLink>
  <RailNavLink href="/portal/travelers/manage" icon={<IconPackage />} indent>
    Manage Packages
  </RailNavLink>

  {/* Vendors Management Section */}
  <SidebarSectionLabel>Vendors</SidebarSectionLabel>
  <RailNavLink href="/portal/vendors/add" icon={<IconVendor />} indent hideInRail>
    Add Vendor
  </RailNavLink>
  <RailNavLink href="/portal/vendors/manage" icon={<IconVendor />} indent>
    Manage Vendors
  </RailNavLink>

  <SidebarSectionLabel>Hotel</SidebarSectionLabel>
  <RailNavLink href="/portal/hotel-bookings/add" icon={<IconHotel />} indent hideInRail>
    Hotel Booking
  </RailNavLink>
  <RailNavLink href="/portal/hotel-bookings/manage" icon={<IconHotel />} indent>
    Manage Hotels
  </RailNavLink>

  <SidebarSectionLabel>Transport</SidebarSectionLabel>
  <RailNavLink href="/portal/transport-bookings/add" icon={<IconTransport />} indent hideInRail>
    Transport Booking
  </RailNavLink>
  <RailNavLink href="/portal/transport-bookings/manage" icon={<IconTransport />} indent>
    Manage Transport
  </RailNavLink>

  <SidebarSectionLabel>Flight</SidebarSectionLabel>
  <RailNavLink href="/portal/flight-bookings/add" icon={<IconFlight />} indent hideInRail>
    Flight Booking
  </RailNavLink>
  <RailNavLink href="/portal/flight-bookings/manage" icon={<IconFlight />} indent>
    Manage Flights
  </RailNavLink>

  <SidebarSectionLabel>Visa</SidebarSectionLabel>
  <RailNavLink href="/portal/visa-bookings/add" icon={<IconVisa />} indent hideInRail>
    Visa Booking
  </RailNavLink>
  <RailNavLink href="/portal/visa-bookings/manage" icon={<IconVisa />} indent>
    Manage Visas
  </RailNavLink>

  {/* Dynamic Static Reports Module (With Soon Badges) */}
  <SidebarSectionLabel>Reports</SidebarSectionLabel>
  <RailNavLink href="#" icon={<IconReport />} indent>
    <span className="flex items-center justify-between w-full">
      <span>Daily Report</span>
      <SoonBadge />
    </span>
  </RailNavLink>
  <RailNavLink href="#" icon={<IconReport />} indent>
    <span className="flex items-center justify-between w-full">
      <span>Monthly Report</span>
      <SoonBadge />
    </span>
  </RailNavLink>
  <RailNavLink href="#" icon={<IconReport />} indent>
    <span className="flex items-center justify-between w-full">
      <span>Sales Report</span>
      <SoonBadge />
    </span>
  </RailNavLink>
  <RailNavLink href="#" icon={<IconReport />} indent>
    <span className="flex items-center justify-between w-full">
      <span>Profit &amp; Loss</span>
      <SoonBadge />
    </span>
  </RailNavLink>
  <RailNavLink href="#" icon={<IconReport />} indent>
    <span className="flex items-center justify-between w-full">
      <span>Outstanding Payments</span>
      <SoonBadge />
    </span>
  </RailNavLink>

  <SidebarSectionLabel>Marketing &amp; Settings</SidebarSectionLabel>
  <RailNavLink href="/portal/settings" icon={<IconSettings />} indent>
    Agency Settings
  </RailNavLink>
  <RailNavLink href="/portal/packages/add" icon={<IconMarketing />} indent hideInRail>
    Add Website Package
  </RailNavLink>
  <RailNavLink href="/portal/packages/manage" icon={<IconMarketing />} indent>
    Manage Website Packages
  </RailNavLink>
  <RailNavLink href="/portal/notifications" icon={<IconBell />} indent>
    Notifications
  </RailNavLink>
</nav>



      {session && (
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/portal/login" });
          }}
          className="px-6 py-5 border-t border-white/10 shrink-0"
        >
          <SidebarLogoutButton />
        </form>
      )}
    </>
  );

  return (
    <AgencyThemeProvider agency={agency}>
      <SidebarShell
        defaultCollapsed={defaultCollapsed}
        primaryColor={agency.primaryColor || "#D2232A"}
        sidebar={sidebar}
      >
        <PortalHeader />
        <div className="flex-1">{children}</div>
        <PortalFooter />
      </SidebarShell>
    </AgencyThemeProvider>
  );
}
