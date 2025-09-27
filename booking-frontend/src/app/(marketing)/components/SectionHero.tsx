import type { ReactNode } from "react";

interface SectionHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: "left" | "center";
  kicker?: string;
}

export function SectionHero({
  eyebrow,
  title,
  description,
  actions,
  align = "center",
  kicker,
}: SectionHeroProps) {
  const alignmentClass =
    align === "left" ? "items-start text-left" : "items-center text-center";

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--marketing-primary)] via-[rgba(30,58,138,0.9)] to-[rgba(4,120,87,0.7)] py-16 text-white sm:py-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute right-[-18%] top-[-25%] h-[360px] w-[360px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-35%] left-[-12%] h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
      </div>
      <div
        className={`relative mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8 ${alignmentClass}`}
      >
        {kicker ? (
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            {kicker}
          </span>
        ) : null}
        {eyebrow ? (
          <span className="marketing-chip bg-white/10 text-white">
            {eyebrow}
          </span>
        ) : null}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="text-base text-white/80 md:text-lg">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div
            className={`flex flex-wrap items-center gap-3 ${
              align === "left" ? "justify-start" : "justify-center"
            }`}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
