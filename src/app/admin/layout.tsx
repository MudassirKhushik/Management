import Link from "next/link";
import { signOut } from "../../../auth";

const BRAND = "#D2232A";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 flex flex-col justify-between shrink-0 bg-[#0E0E0E] text-white">
        <div>
          <div className="px-6 pt-7 pb-5 border-b border-white/10">
            <h2 className="font-black uppercase text-lg tracking-tight leading-none" style={{ color: BRAND }}>
              MY
            </h2>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 mt-0.5">
              Digital Solutions
            </p>
            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">Super Admin</p>
          </div>

          <nav className="flex flex-col gap-1 py-5 px-3">
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors"
            >
              Agencies
            </Link>
            <Link
              href="/admin/add"
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors"
            >
              + Add Agency
            </Link>
          </nav>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/portal/login" });
          }}
          className="px-6 py-5 border-t border-white/10"
        >
          <button className="w-full text-left text-sm font-semibold hover:text-white transition-colors" style={{ color: BRAND }}>
            Log out
          </button>
        </form>
      </aside>
      <main className="flex-1 bg-[#FAF9F6]">{children}</main>
    </div>
  );
}