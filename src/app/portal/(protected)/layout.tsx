import Link from "next/link";
import { auth, signOut } from "../../../../auth";

// Brand hex (hardcoded here — will move to CSS variables once globals.css is set up):
// black #121212, red #D2232A, gray #6B6B6B

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex flex-col justify-between shrink-0 bg-[#121212] text-white">
        <div>
          <div className="px-5 pt-6 pb-4 border-b border-[#2a2a2a]">
            <h2 className="font-black uppercase text-lg tracking-tight leading-none">
              Travel<span className="text-[#D2232A]">Craft</span>
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] mt-1">
              {session?.user?.agencyName || "Portal"}
            </p>
          </div>

          <nav className="flex flex-col gap-0.5 text-sm py-4">
            <Link
              href="/portal"
              className="px-5 py-2 hover:bg-[#1e1e1e] hover:text-[#D2232A] transition font-medium"
            >
              Dashboard
            </Link>

            <p className="text-[10px] font-semibold text-[#D2232A] uppercase tracking-[0.2em] px-5 pt-5 pb-1">
              Master Operations
            </p>
            <Link
              href="/portal/travelers/add"
              className="px-5 py-2 hover:bg-[#1e1e1e] transition font-semibold border-l-2 border-transparent hover:border-[#D2232A]"
            >
              Full Package Booking
            </Link>
            <Link
              href="/portal/travelers/manage"
              className="pl-8 pr-5 py-1.5 hover:bg-[#1e1e1e] transition text-xs text-[#8a8a8a] hover:text-white"
            >
              → Manage Packages
            </Link>

            <p className="text-[10px] font-semibold text-[#D2232A] uppercase tracking-[0.2em] px-5 pt-5 pb-1">
              Single Services
            </p>
            <Link
              href="/portal/hotel-bookings/add"
              className="pl-8 pr-5 py-2 hover:bg-[#1e1e1e] transition border-l-2 border-transparent hover:border-[#D2232A]"
            >
              Hotel Booking
            </Link>
            <Link
              href="/portal/transport-bookings/add"
              className="pl-8 pr-5 py-2 hover:bg-[#1e1e1e] transition border-l-2 border-transparent hover:border-[#D2232A]"
            >
              Transport Booking
            </Link>
            <Link
              href="/portal/flight-bookings/add"
              className="pl-8 pr-5 py-2 hover:bg-[#1e1e1e] transition border-l-2 border-transparent hover:border-[#D2232A]"
            >
              Flight Booking
            </Link>
            <Link
              href="/portal/visa-bookings/add"
              className="pl-8 pr-5 py-2 hover:bg-[#1e1e1e] transition border-l-2 border-transparent hover:border-[#D2232A]"
            >
              Visa Booking
            </Link>

            <p className="text-[10px] font-semibold text-[#D2232A] uppercase tracking-[0.2em] px-5 pt-5 pb-1">
              Marketing &amp; Settings
            </p>
            <Link
              href="/portal/packages/add"
              className="pl-8 pr-5 py-2 hover:bg-[#1e1e1e] transition border-l-2 border-transparent hover:border-[#D2232A]"
            >
              Add Promo Package
            </Link>
            <Link
              href="/portal/notifications"
              className="pl-8 pr-5 py-2 hover:bg-[#1e1e1e] transition border-l-2 border-transparent hover:border-[#D2232A]"
            >
              Notifications
            </Link>
          </nav>
        </div>

        {session && (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/portal/login" });
            }}
            className="px-5 py-4 border-t border-[#2a2a2a]"
          >
            <button className="w-full text-left text-sm font-semibold text-[#D2232A] hover:text-white transition">
              Log out
            </button>
          </form>
        )}
      </aside>
      <main className="flex-1 bg-[#FAF7F2]">{children}</main>
    </div>
  );
}