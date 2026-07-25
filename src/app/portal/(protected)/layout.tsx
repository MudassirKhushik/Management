import Link from "next/link";
import { auth, signOut } from "../../../../auth";
import { redirect } from "next/navigation";
 
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
 
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r p-4 space-y-2 shrink-0">
        <h2 className="font-semibold mb-4">TravelCraft Portal</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/portal" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/portal/travelers/add" className="hover:underline">
            Add Traveler
          </Link>
          <Link href="/portal/travelers/manage" className="hover:underline">
            Manage Travelers
          </Link>
          <Link href="/portal/packages/add" className="hover:underline">
            Add Package
          </Link>
          <Link href="/portal/notifications" className="hover:underline">
            Notifications
          </Link>
        </nav>
 
        {session && (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/portal/login" });
            }}
            className="pt-4 mt-4 border-t"
          >
            <button className="text-sm text-red-600 hover:underline">
              Log out
            </button>
          </form>
        )}
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
