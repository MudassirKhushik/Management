// src/components/ui/Eyebrow.tsx

interface EyebrowProps {
  children: React.ReactNode;
  light?: boolean;
}

export function Eyebrow({ children, light = false }: EyebrowProps) {
  return (
    <p
      className="text-xs tracking-[0.25em] uppercase font-semibold mb-3"
      style={{ color: light ? "#ff5c62" : "var(--tct-red)" }}
    >
      {children}
    </p>
  );
}