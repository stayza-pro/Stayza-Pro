import { palette } from "@/app/(marketing)/content";

export type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionTitleProps) {
  return (
    <div
      className={`mx-auto max-w-3xl ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      {eyebrow && (
        <span className="marketing-chip" style={{ color: palette.secondary }}>
          {eyebrow}
        </span>
      )}
      <h2
        className="mt-4 text-3xl font-bold md:text-4xl"
        style={{ color: palette.primary }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-marketing-muted">{description}</p>
      )}
    </div>
  );
}
