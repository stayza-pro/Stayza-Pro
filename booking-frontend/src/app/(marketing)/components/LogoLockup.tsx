import Link from "next/link";
import { cn } from "@/utils/cn";
import { brand, palette } from "@/app/(marketing)/content";

export type LogoLockupProps = {
  tone?: "dark" | "light";
  className?: string;
};

export function LogoLockup({ tone = "dark", className }: LogoLockupProps) {
  const Icon = brand.logoIcon;
  const isLight = tone === "light";

  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2 transition-transform motion-safe:hover:-translate-y-0.5",
        className
      )}
      aria-label="Stayza Pro home"
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-marketing-subtle bg-marketing-elevated/70 transition-colors",
          isLight && "border-white/35 bg-white/10 text-white"
        )}
        aria-hidden="true"
      >
        <Icon
          className="h-5 w-5 transition-transform duration-300 group-hover:scale-105"
          style={{ color: isLight ? "#FFFFFF" : palette.primary }}
        />
      </span>
      <span
        className={cn(
          "text-lg font-semibold transition-colors",
          isLight ? "text-white" : "text-[var(--marketing-primary)]"
        )}
      >
        {brand.name}
      </span>
    </Link>
  );
}
