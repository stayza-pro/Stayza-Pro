import {
  forwardRef,
  type ReactNode,
  type CSSProperties,
  type MouseEventHandler,
} from "react";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

import { palette } from "@/app/(marketing)/content";

export type CTAButtonProps = {
  label: string;
  variant?: "solid" | "ghost" | "outline";
  href?: string;
  icon?: ReactNode;
  className?: string;
  styleOverrides?: CSSProperties;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export const CTAButton = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  CTAButtonProps
>(
  (
    {
      label,
      variant = "solid",
      href,
      icon,
      className,
      styleOverrides,
      onClick,
      type = "button",
      disabled,
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-xl border bg-[var(--btn-bg)] px-6 py-3 text-sm font-semibold text-[color:var(--btn-text)] transition-all hover:bg-[var(--btn-hover-bg)] hover:text-[color:var(--btn-hover-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--btn-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--btn-ring-offset)] disabled:cursor-not-allowed disabled:opacity-60 motion-safe:will-change-transform motion-safe:transition-transform";

    const variantClasses = getVariantClass(variant);
    const variantStyle = getVariantStyle(variant);
    const mergedStyle = styleOverrides
      ? { ...variantStyle, ...styleOverrides }
      : variantStyle;

    const content = (
      <span className="flex items-center gap-2">
        <span>{label}</span>
        {icon === null
          ? null
          : icon ?? <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </span>
    );

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={clsx(baseClasses, variantClasses, className)}
          style={mergedStyle}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={clsx(baseClasses, variantClasses, className)}
        style={mergedStyle}
      >
        {content}
      </button>
    );
  }
);

CTAButton.displayName = "CTAButton";

type Variant = NonNullable<CTAButtonProps["variant"]>;
type VariantStyle = CSSProperties & Record<`--btn-${string}`, string>;

function getVariantClass(variant: Variant) {
  switch (variant) {
    case "ghost":
      return "border border-[var(--btn-border)] text-[color:var(--btn-text)]";
    case "outline":
      return "border border-[var(--btn-border)] text-[color:var(--btn-text)]";
    default:
      return "border border-[var(--btn-border)] text-[color:var(--btn-text)] motion-safe:hover:-translate-y-0.5 hover:brightness-105";
  }
}

function getVariantStyle(variant: Variant): VariantStyle {
  const baseStyle: VariantStyle = {
    "--btn-hover-text": palette.primaryForeground,
    "--btn-ring": palette.accent,
    "--btn-ring-offset": "var(--marketing-ring-offset, rgba(15,23,42,0.08))",
    boxShadow: "none",
  };

  switch (variant) {
    case "ghost":
      return {
        ...baseStyle,
        "--btn-bg":
          "color-mix(in srgb, var(--marketing-primary, #1E3A8A) 18%, transparent)",
        "--btn-hover-bg":
          "color-mix(in srgb, var(--marketing-primary, #1E3A8A) 28%, transparent)",
        "--btn-text": palette.primaryForeground,
        "--btn-border":
          "color-mix(in srgb, var(--marketing-primary, #1E3A8A) 35%, transparent)",
      } satisfies VariantStyle;
    case "outline":
      return {
        ...baseStyle,
        "--btn-bg": "transparent",
        "--btn-hover-bg":
          "color-mix(in srgb, var(--marketing-surface, #F3F4F6) 65%, transparent)",
        "--btn-text": palette.neutralDark,
        "--btn-hover-text": palette.neutralDark,
        "--btn-border": palette.secondary,
      } satisfies VariantStyle;
    default:
      return {
        ...baseStyle,
        "--btn-bg": palette.accent,
        "--btn-hover-bg":
          "color-mix(in srgb, var(--marketing-accent, #F97316) 92%, white 8%)",
        "--btn-text": palette.primaryForeground,
        "--btn-hover-text": palette.primaryForeground,
        "--btn-border": palette.accent,
        boxShadow: "0 24px 60px rgba(249,115,22,0.28)",
      } satisfies VariantStyle;
  }
}
