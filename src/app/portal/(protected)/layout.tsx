import Link from "next/link";
import { auth, signOut } from "../../../../auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r p-4 space-y-4 shrink-0">
        <h2 className="font-semibold">
          {session?.user?.agencyName || "Portal"}
        </h2>

        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/portal" className="hover:underline">Dashboard</Link>
        </nav>

        <div className="text-sm">
          <p className="font-medium text-xs text-gray-500 mb-1">Traveler Booking</p>
          <nav className="flex flex-col gap-1 pl-2">
            <Link href="/portal/travelers/add" className="hover:underline">Traveler Booking</Link>
            <Link href="/portal/travelers/manage" className="hover:underline">Manage Travelers</Link>
          </nav>
        </div>

        <div className="text-sm">
          <p className="font-medium text-xs text-gray-500 mb-1">Hotel Booking</p>
          <nav className="flex flex-col gap-1 pl-2">
            <Link href="/portal/hotel-bookings/add" className="hover:underline">Hotel Booking</Link>
            <Link href="/portal/hotel-bookings/manage" className="hover:underline">Manage Hotels</Link>
          </nav>
        </div>

        <div className="text-sm">
          <p className="font-medium text-xs text-gray-500 mb-1">Transport Booking</p>
          <nav className="flex flex-col gap-1 pl-2">
            <Link href="/portal/transport-bookings/add" className="hover:underline">Transport Booking</Link>
            <Link href="/portal/transport-bookings/manage" className="hover:underline">Manage Transport</Link>
          </nav>
        </div>

        <div className="text-sm">
          <p className="font-medium text-xs text-gray-500 mb-1">Flight Booking</p>
          <nav className="flex flex-col gap-1 pl-2">
            <Link href="/portal/flight-bookings/add" className="hover:underline">Flight Booking</Link>
            <Link href="/portal/flight-bookings/manage" className="hover:underline">Manage Flights</Link>
          </nav>
        </div>

        <div className="text-sm">
          <p className="font-medium text-xs text-gray-500 mb-1">Visa Booking</p>
          <nav className="flex flex-col gap-1 pl-2">
            <Link href="/portal/visa-bookings/add" className="hover:underline">Visa Booking</Link>
            <Link href="/portal/visa-bookings/manage" className="hover:underline">Manage Visas</Link>
          </nav>
        </div>

        <div className="text-sm">
          <p className="font-medium text-xs text-gray-500 mb-1">Public Site Packages</p>
          <nav className="flex flex-col gap-1 pl-2">
            <Link href="/portal/packages/add" className="hover:underline">Add Package</Link>
            <Link href="/portal/packages/manage" className="hover:underline">Manage Packages</Link>
          </nav>
        </div>

        <div className="text-sm">
        <nav className="flex flex-col gap-1 text-sm pt-2 border-t">
          <p className="font-medium text-xs text-gray-500 mb-1">Settings</p>
          <Link href="/portal/notifications" className="hover:underline">Notifications</Link>
        </nav>
        </div>

        {session && (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/portal/login" });
            }}
            className="pt-4 mt-4 border-t"
          >
            <button className="text-sm text-red-600 hover:underline">Log out</button>
          </form>
        )}
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}