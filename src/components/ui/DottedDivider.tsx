// src/components/ui/DottedDivider.tsx

interface DottedDividerProps {
  dark?: boolean;
}

export function DottedDivider({ dark = false }: DottedDividerProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-10" aria-hidden="true">
      <span
        className="h-px w-16 border-t-2 border-dotted"
        style={{ borderColor: dark ? "#5a5a5a" : "var(--tct-red)" }}
      />
      <span className="text-lg leading-none" style={{ color: "var(--tct-red)" }}>
        ✕
      </span>
      <span
        className="h-px w-16 border-t-2 border-dotted"
        style={{ borderColor: dark ? "#5a5a5a" : "var(--tct-red)" }}
      />
    </div>
  );
}