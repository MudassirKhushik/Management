// src/components/agency/HypeWallSection.tsx

import { Reveal } from "@/src/components/ui/Reveal";
import { Eyebrow } from "@/src/components/ui/Eyebrow";

export function HypeWallSection() {
  return (
    <section className="py-4" style={{ backgroundColor: "var(--tct-cream)" }}>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <Reveal>
          <Eyebrow>Hype Wall</Eyebrow>
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase mb-10">
            What Travelers Say
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border-2 border-dotted p-6"
              style={{ borderColor: "var(--tct-red)" }}
            >
              <p className="text-sm" style={{ color: "var(--tct-gray)" }}>
                Real traveler reviews will appear here once you start collecting them.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}