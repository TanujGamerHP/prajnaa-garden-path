import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";

export type LegalSection = { h: string; body: ReactNode };

export function LegalArticle({
  updated,
  intro,
  sections,
}: {
  updated: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="container-prj mx-auto grid max-w-6xl gap-12 py-20 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-24 md:self-start">
        <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Last updated
        </p>
        <p className="font-display mt-1.5 text-base font-medium">{updated}</p>
        <nav className="mt-8 hidden md:block">
          <p className="font-subhead text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            On this page
          </p>
          <ol className="mt-3 space-y-2 text-sm">
            {sections.map((s, i) => (
              <li key={s.h}>
                <a
                  href={`#sec-${i}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {String(i + 1).padStart(2, "0")} · {s.h}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <article className="space-y-12">
        {intro && (
          <Reveal inline>
            <div className="text-[17px] leading-[1.75] text-foreground/85">{intro}</div>
          </Reveal>
        )}
        {sections.map((s, i) => (
          <Reveal key={s.h} delay={i * 40} inline>
            <section id={`sec-${i}`} className="scroll-mt-24">
              <h2 className="font-display text-2xl font-semibold md:text-3xl">{s.h}</h2>
              <div className="mt-4 space-y-4 text-[16px] leading-[1.75] text-muted-foreground">
                {s.body}
              </div>
            </section>
          </Reveal>
        ))}
      </article>
    </div>
  );
}
