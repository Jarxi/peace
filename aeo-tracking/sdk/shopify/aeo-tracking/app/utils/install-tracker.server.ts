import { randomBytes } from "crypto";

import type { ShopifyStoreInfo } from "./shopify-store-info.server";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INSTALL_TABLE = process.env.SUPABASE_INSTALL_TABLE ?? "vendor_store_claim_state";
const SHOPIFY_PLATFORM_ID = "shopify";

let warnedMissingEnv = false;

function buildSupabaseRestUrl(): string | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (!warnedMissingEnv) {
      console.warn("[install] Supabase credentials missing; skip install tracking");
      warnedMissingEnv = true;
    }
    return null;
  }

  const normalized = SUPABASE_URL.replace(/\/$/, "");
  return `${normalized}/rest/v1/${INSTALL_TABLE}`;
}

function sanitizeStoreInfo(info: ShopifyStoreInfo | null): Record<string, unknown> | null {
  if (!info) {
    return null;
  }

  const { id, ...rest } = info;
  return { ...rest };
}

function normalizePlatformId(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeStoreId(value: string): string {
  return value.trim();
}

function normalizeStoreIdForCode(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.length > 0 ? cleaned : "STORE";
}

function generateClaimCode(length = 16): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += alphabet[bytes[i] % alphabet.length];
  }

  return code;
}

function buildClaimCode(storeId: string): string {
  const normalized = normalizeStoreIdForCode(storeId);
  return `shopify-${normalized}-${generateClaimCode()}`;
}

async function fetchExisting(
  url: string,
  platformId: string,
  storeId: string,
): Promise<Array<Record<string, unknown>>> {
  const normalizedPlatformId = normalizePlatformId(platformId);
  const response = await fetch(
    `${url}?store_id=eq.${encodeURIComponent(storeId)}&or=(platform_id.eq.${encodeURIComponent(normalizedPlatformId)},platform_id.eq.${encodeURIComponent(normalizedPlatformId.toUpperCase())})`,
    {
      method: "GET",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unable to query Supabase: ${response.status} ${body}`);
  }

  return (await response.json()) as Array<Record<string, unknown>>;
}

export async function recordShopifyInstall(shopInfo: ShopifyStoreInfo | null): Promise<string | null> {
  if (!shopInfo) {
    console.warn("[install] Missing shop info; skipping install tracking");
    return null;
  }

  const url = buildSupabaseRestUrl();
  if (!url) {
    return null;
  }

  const platformId = normalizePlatformId(SHOPIFY_PLATFORM_ID);
  const storeIdRaw = String(shopInfo.id);
  const storeId = normalizeStoreId(storeIdRaw);
  const sanitizedInfo = sanitizeStoreInfo(shopInfo);
  const timestamp = new Date().toISOString();

  if (!storeId) {
    console.error("[install] Empty store id; skipping install tracking");
    return null;
  }

  try {
    const existing = await fetchExisting(url, platformId, storeId);
    if (existing.length > 0) {
      const existingPlatformValue = existing[0]?.platform_id;
      const targetPlatformId = typeof existingPlatformValue === "string"
        ? normalizePlatformId(existingPlatformValue)
        : platformId;
      const response = await fetch(
        `${url}?platform_id=eq.${encodeURIComponent(targetPlatformId)}&store_id=eq.${encodeURIComponent(storeId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            platform_id: platformId,
            store_info: sanitizedInfo,
            vendor_id: null,
            updated_at: timestamp,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        console.error("[install] Failed to update install record", response.status, body);
      }
      const record = await fetchExisting(url, platformId, storeId);
      return (record[0]?.claim_code as string | undefined) ?? null;
    }
  } catch (error) {
    console.error("[install] Failed to query Supabase", error);
    return null;
  }

  const claimCode = buildClaimCode(storeId);
  const payload = [{
    platform_id: platformId,
    store_id: storeId,
    store_info: sanitizedInfo,
    vendor_id: null,
    claim_code: claimCode,
    created_at: timestamp,
    updated_at: timestamp,
  }];

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[install] Failed to insert install record", response.status, errorBody);
    }
  } catch (error) {
    console.error("[install] Error inserting install record", error);
    return null;
  }

  return claimCode;
}

export async function removeShopifyInstall(params: {
  storeId?: string | null;
  shopDomain?: string | null;
}): Promise<boolean> {
  const url = buildSupabaseRestUrl();
  if (!url) {
    return false;
  }

  const platformId = normalizePlatformId(SHOPIFY_PLATFORM_ID);
  const candidates = new Set<string>();

  const rawStoreId = params.storeId ? normalizeStoreId(params.storeId) : null;
  if (rawStoreId) {
    candidates.add(rawStoreId);
    if (/^\d+$/.test(rawStoreId)) {
      candidates.add(`gid://shopify/Shop/${rawStoreId}`);
    } else {
      const gidMatch = rawStoreId.match(/Shop\/(\d+)$/);
      if (gidMatch?.[1]) {
        candidates.add(gidMatch[1]);
      }
    }
  }

  let updated = false;

  for (const candidateStoreId of candidates) {
    const filters = [
      `platform_id=eq.${encodeURIComponent(platformId)}`,
      `store_id=eq.${encodeURIComponent(candidateStoreId)}`,
    ];

    try {
      const response = await fetch(`${url}?${filters.join("&")}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          deletion_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(
          "[install] Failed to flag install record by store_id",
          response.status,
          body,
        );
      } else {
        updated = true;
      }
    } catch (error) {
      console.error("[install] Error flagging install record by store_id", error);
    }
  }

  if (!updated && params.shopDomain) {
    const trimmedDomain = params.shopDomain.trim().toLowerCase();
    if (trimmedDomain) {
      const filters = [
        `platform_id=eq.${encodeURIComponent(platformId)}`,
        `store_info->>myshopifyDomain=eq.${encodeURIComponent(trimmedDomain)}`,
      ];

      try {
        const response = await fetch(`${url}?${filters.join("&")}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            deletion_requested_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const body = await response.text();
          console.error(
            "[install] Failed to flag install record by myshopifyDomain",
            response.status,
            body,
          );
        } else {
          updated = true;
        }
      } catch (error) {
        console.error("[install] Error flagging install record by myshopifyDomain", error);
      }
    }
  }

  if (!updated) {
    console.warn("[install] No install records flagged during redact", params);
  }

  return updated;
}
