import Link from "next/link";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { brand, palette } from "@/app/(marketing)/content";

export type LogoLockupProps = {
  href?: string;
  tone?: "dark" | "light";
  className?: string;
};

export function LogoLockup({
  href = "/",
  tone = "dark",
  className,
}: LogoLockupProps) {
  const logoIcon = brand.logoIcon;
  const isLight = tone === "light";

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 transition-transform motion-safe:hover:-translate-y-0.5",
        className
      )}
      aria-label="Stayza Pro home"
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
          isLight
            ? "border-white/30 bg-white/15 text-white backdrop-blur-sm"
            : "border-marketing-subtle bg-marketing-elevated/70 text-marketing-primary"
        )}
        aria-hidden="true"
      >
        <Image
          src={logoIcon.src}
          alt={logoIcon.alt}
          width={150}
          height={150}
          className="transition-transform duration-300 group-hover:scale-105"
          style={{
            filter: isLight
              ? "brightness(0) invert(1)"
              : `brightness(0) saturate(100%) invert(20%) sepia(95%) saturate(2456%) hue-rotate(215deg) brightness(96%) contrast(93%)`,
          }}
        />
      </div>
      <span
        className={cn(
          "text-xl font-bold transition-colors",
          isLight ? "text-white" : "text-marketing-primary"
        )}
      >
        {brand.name}
      </span>
    </Link>
  );
}
