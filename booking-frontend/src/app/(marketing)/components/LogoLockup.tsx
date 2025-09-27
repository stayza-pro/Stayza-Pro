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
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-marketing-subtle bg-marketing-elevated/70 transition-colors",
          isLight && "border-white/35 bg-white/10 text-white"
        )}
        aria-hidden="true"
      >
        <Icon
          className="h-5 w-5"
          style={{ color: isLight ? "#FFFFFF" : palette.primary }}
        />
      </span>
      <span
        className={cn(
          "text-lg font-semibold",
          isLight ? "text-white" : "text-[var(--marketing-primary)]"
        )}
      >
        {brand.name}
      </span>
    </div>
  );
}
