// src/components/portal/PortalFooter.tsx
export function PortalFooter() {
  return (
    <footer className="px-6 py-4 text-xs text-gray-400 border-t border-black/5">
      © {new Date().getFullYear()} · Powered by MY Digital Solutions
    </footer>
  );
}