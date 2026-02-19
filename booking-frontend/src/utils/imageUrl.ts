type ImageLike =
  | string
  | null
  | undefined
  | {
      url?: string | null;
      imageUrl?: string | null;
      src?: string | null;
    };

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const DATA_BLOB_URL_PATTERN = /^(data:|blob:)/i;

const resolveApiOrigin = (): string => {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (!configured) return "";

  try {
    const parsed = new URL(configured);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
};

const API_ORIGIN = resolveApiOrigin();

const pickImageValue = (image: ImageLike): string => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || image.imageUrl || image.src || "";
};

export const normalizeImageUrl = (image: ImageLike): string => {
  const raw = pickImageValue(image).trim();
  if (!raw) return "";

  if (ABSOLUTE_URL_PATTERN.test(raw) || DATA_BLOB_URL_PATTERN.test(raw)) {
    return raw;
  }

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  if (!API_ORIGIN) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return `${API_ORIGIN}${raw}`;
  }

  return `${API_ORIGIN}/${raw.replace(/^\/+/, "")}`;
};

