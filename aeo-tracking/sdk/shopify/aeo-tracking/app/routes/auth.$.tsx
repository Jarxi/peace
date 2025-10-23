import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { recordShopifyInstall } from "../utils/install-tracker.server";
import { ensurePixelExists } from "../utils/shopify-pixel.server";
import { fetchShopInfo } from "../utils/shopify-store-info.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  const authContext = await authenticate.admin(request);
  const adminClient = authContext?.admin;
  const session = authContext?.session;

  if (!adminClient) {
    console.error("[auth] Admin client unavailable during auth flow");
    return null;
  }

  const shopFromQuery = url.searchParams.get("shop");
  const sessionShop = session?.shop ?? null;

  let shopDomain = shopFromQuery ?? sessionShop ?? null;
  let shopId: string | null = null;

  const shopInfo = await fetchShopInfo(adminClient, session);
  if (shopInfo) {
    shopId = shopInfo.id;
    if (!shopDomain) {
      shopDomain = shopInfo.myshopifyDomain;
    }
  } else {
    console.error("[auth] Unable to fetch shop info during auth flow");
  }

  if (!shopDomain) {
    console.warn("[auth] Unable to determine shop domain during auth flow", {
      shopFromQuery,
      sessionShop,
    });
    return null;
  }
  if (shopId) {
    await recordShopifyInstall(shopInfo ?? null);
    await ensurePixelExists(adminClient, shopId);
  }

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
