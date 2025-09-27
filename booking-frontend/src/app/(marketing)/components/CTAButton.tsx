import { forwardRef, type ReactNode, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

export type CTAButtonProps = {
  label: string;
  variant?: "solid" | "ghost" | "outline";
  href?: string;
  icon?: ReactNode;
  className?: string;
  styleOverrides?: CSSProperties;
};

export const CTAButton = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  CTAButtonProps
>(
  (
    { label, variant = "solid", href, icon, className, styleOverrides },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all motion-safe:will-change-transform motion-safe:transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-marketing-focus";

    const content = (
      <span className="flex items-center gap-2">
        <span>{label}</span>
        {(icon ?? <ArrowRight className="h-4 w-4" aria-hidden="true" />) ||
          null}
      </span>
    );

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={clsx(baseClasses, getVariantClass(variant), className)}
          style={styleOverrides}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={clsx(baseClasses, getVariantClass(variant), className)}
        style={styleOverrides}
      >
        {content}
      </button>
    );
  }
);

CTAButton.displayName = "CTAButton";

function getVariantClass(variant: NonNullable<CTAButtonProps["variant"]>) {
  switch (variant) {
    case "ghost":
      return "border border-[rgba(255,255,255,0.45)] bg-white/5 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-transparent dark:border-[rgba(148,163,184,0.45)] dark:bg-transparent dark:text-[var(--marketing-foreground)] dark:hover:bg-[rgba(148,163,184,0.12)]";
    case "outline":
      return "border-marketing-subtle text-marketing-foreground hover:border-[var(--marketing-accent)] hover:text-[var(--marketing-foreground)] hover:bg-marketing-elevated focus-visible:ring-[var(--marketing-accent)]";
    default:
      return "bg-[var(--marketing-accent)] text-[var(--marketing-primary-foreground)] shadow-lg shadow-[rgba(249,115,22,0.28)] motion-safe:hover:-translate-y-0.5 hover:brightness-105 focus-visible:ring-[var(--marketing-accent)]";
  }
}
