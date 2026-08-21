// src/components/ui/SectionHeading.tsx

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  className?: string;
}

export function SectionHeading({ eyebrow, title, className = "" }: SectionHeadingProps) {
  return (
    <div className={className}>
      {eyebrow && (
        <p
          className="text-xs tracking-[0.25em] uppercase font-semibold mb-3"
          style={{ color: "var(--tct-red)" }}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl md:text-4xl font-black uppercase">
        {title}
      </h2>
    </div>
  );
}