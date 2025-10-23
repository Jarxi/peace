import type { Session } from "@shopify/shopify-api";

import { authenticate, sessionStorage } from "../shopify.server";

export type AdminClient = Awaited<ReturnType<typeof authenticate.admin>>["admin"];

export interface ShopifyStoreInfo {
  id: string;
  name: string | null;
  myshopifyDomain: string;
  contactEmail: string | null;
  accessToken: string | null;
  primaryDomain: {
    url: string | null;
    host: string | null;
  } | null;
}

export async function fetchShopInfo(
  admin: AdminClient,
  session?: Session | null,
): Promise<ShopifyStoreInfo | null> {
  try {
    const response = await admin.graphql(`
      #graphql
      query shopInfo {
        shop {
          id
          name
          myshopifyDomain
          contactEmail
          primaryDomain {
            url
            host
          }
        }
      }
    `);

    const json = await response.json();
    const shop = json?.data?.shop;

    if (!shop?.id || !shop?.myshopifyDomain) {
      console.error("[shopify] Unexpected shop info response", json);
      return null;
    }

    const shopDomain = shop.myshopifyDomain ?? session?.shop ?? null;
    let accessToken: string | null = null;


    if (shopDomain) {
      const offlineSessionId = `offline_${shopDomain}`;
      try {
        const offlineSession = await sessionStorage.loadSession(offlineSessionId);
        if (
          offlineSession &&
          typeof offlineSession.accessToken === "string" &&
          offlineSession.accessToken.length > 0
        ) {
          accessToken = offlineSession.accessToken;
        }
      } catch (error) {
        console.error("[shopify] Failed to load offline session", {
          shop: shopDomain,
          error,
        });
      }
    }

    if (
      !accessToken &&
      session &&
      typeof session.accessToken === "string" &&
      session.accessToken.length > 0
    ) {
      accessToken = session.accessToken;
    }

    return {
      id: shop.id,
      name: shop.name ?? null,
      myshopifyDomain: shop.myshopifyDomain,
      contactEmail: shop.contactEmail ?? null,
      accessToken,
      primaryDomain: shop.primaryDomain
        ? {
            url: shop.primaryDomain.url ?? null,
            host: shop.primaryDomain.host ?? null,
          }
        : null,
    };
  } catch (error) {
    console.error("[shopify] Failed to fetch shop info", error);
    return null;
  }
}
