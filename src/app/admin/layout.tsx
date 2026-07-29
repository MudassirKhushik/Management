import Link from "next/link";
import { signOut } from "../../../auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r p-4 space-y-2 shrink-0">
        <h2 className="font-semibold mb-4">Super Admin</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/admin" className="hover:underline">Agencies</Link>
          <Link href="/admin/add" className="hover:underline">Add Agency</Link>
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/portal/login" });
          }}
          className="pt-4 mt-4 border-t"
        >
          <button className="text-sm text-red-600 hover:underline">Log out</button>
        </form>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}