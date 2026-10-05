export default function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <span
        className="block h-8 w-8 rounded-full border-2 border-gray-200 animate-spin"
        style={{ borderTopColor: "var(--agency-color)" }}
      />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}