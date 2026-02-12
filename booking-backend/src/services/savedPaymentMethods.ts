import { Prisma } from "@prisma/client";

export interface PaystackAuthorizationDetails {
  authorizationCode: string | null;
  signature: string | null;
  reusable: boolean;
  last4: string | null;
  brand: string | null;
  expMonth: string | null;
  expYear: string | null;
  bank: string | null;
}

export interface SavedMethodCandidate {
  id: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}

export interface SavedMethodSummary {
  methodId: string;
  brand: string | null;
  bank: string | null;
  last4: string | null;
  expMonth: string | null;
  expYear: string | null;
  lastUsedAt: Date;
}

const isJsonObject = (
  value: Prisma.JsonValue | null
): value is Prisma.JsonObject => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const getJsonString = (
  source: Prisma.JsonObject | null,
  key: string
): string | null => {
  const rawValue = source?.[key];
  return typeof rawValue === "string" ? rawValue : null;
};

const getJsonBoolean = (
  source: Prisma.JsonObject | null,
  key: string
): boolean | null => {
  const rawValue = source?.[key];
  return typeof rawValue === "boolean" ? rawValue : null;
};

export const getMetadataObject = (
  metadata: Prisma.JsonValue | null
): Prisma.JsonObject | null => {
  return isJsonObject(metadata) ? metadata : null;
};

export const extractPaystackAuthorization = (
  metadata: Prisma.JsonValue | null
): PaystackAuthorizationDetails => {
  const metadataObj = getMetadataObject(metadata);
  const providerResponse = isJsonObject(
    (metadataObj?.providerResponse as Prisma.JsonValue | undefined) ?? null
  )
    ? ((metadataObj?.providerResponse as Prisma.JsonValue) as Prisma.JsonObject)
    : null;
  const authorization = isJsonObject(
    (providerResponse?.authorization as Prisma.JsonValue | undefined) ?? null
  )
    ? ((providerResponse?.authorization as Prisma.JsonValue) as Prisma.JsonObject)
    : null;

  const authorizationCode =
    getJsonString(authorization, "authorization_code") ||
    getJsonString(metadataObj, "authorizationCode") ||
    null;

  return {
    authorizationCode,
    signature: getJsonString(authorization, "signature"),
    reusable: getJsonBoolean(authorization, "reusable") ?? true,
    last4: getJsonString(authorization, "last4"),
    brand: getJsonString(authorization, "brand"),
    expMonth: getJsonString(authorization, "exp_month"),
    expYear: getJsonString(authorization, "exp_year"),
    bank: getJsonString(authorization, "bank"),
  };
};

export const dedupeSavedPaymentMethods = (
  payments: SavedMethodCandidate[]
): SavedMethodSummary[] => {
  const methodsByKey = new Map<string, SavedMethodSummary>();

  for (const payment of payments) {
    const authorization = extractPaystackAuthorization(payment.metadata);

    if (!authorization.authorizationCode || !authorization.reusable) {
      continue;
    }

    const methodKey =
      authorization.signature ||
      `${authorization.last4 || "xxxx"}-${authorization.expMonth || "00"}-${
        authorization.expYear || "00"
      }-${authorization.bank || "unknown"}`;

    if (!methodsByKey.has(methodKey)) {
      methodsByKey.set(methodKey, {
        methodId: payment.id,
        brand: authorization.brand,
        bank: authorization.bank,
        last4: authorization.last4,
        expMonth: authorization.expMonth,
        expYear: authorization.expYear,
        lastUsedAt: payment.createdAt,
      });
    }
  }

  return Array.from(methodsByKey.values());
};
