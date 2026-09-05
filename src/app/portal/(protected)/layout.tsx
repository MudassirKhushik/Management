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

  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get("sidebar-collapsed")?.value === "1";

  const sidebar = (
    <>
      <SidebarBrand logoUrl={agency.logoUrl} name={agency.name} />

      {/* The only part that scrolls, between the brand and the logout button */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1 py-5 px-3">
        <RailNavLink href="/portal" icon={<IconDashboard />}>Dashboard</RailNavLink>

        <SidebarSectionLabel>Master Operations</SidebarSectionLabel>
        <RailNavLink href="/portal/travelers/add" icon={<IconPackage />} hideInRail>
          Full Package Booking
        </RailNavLink>
        <RailNavLink href="/portal/travelers/manage" icon={<IconPackage />} indent>
          Manage Packages
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