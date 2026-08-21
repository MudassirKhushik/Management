// src/components/agency/MemoriesSection.tsx

import { Reveal } from "@/src/components/ui/Reveal";
import { Eyebrow } from "@/src/components/ui/Eyebrow";

export function MemoriesSection() {
  return (
    <section id="memories" className="max-w-6xl mx-auto px-6 py-20">
      <Reveal>
        <Eyebrow>Memories</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-black uppercase mb-10">
          From the Road
        </h2>
      </Reveal>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="aspect-square border-2 border-dotted flex items-center justify-center text-xs uppercase tracking-wide text-center px-3"
            style={{ borderColor: "var(--tct-red)", color: "var(--tct-gray)" }}
          >
            Photo coming soon
          </div>
        ))}
      </div>
    </section>
  );
}