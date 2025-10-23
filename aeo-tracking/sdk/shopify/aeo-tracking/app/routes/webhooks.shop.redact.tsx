import type { ActionFunctionArgs } from "react-router";

import { authenticate } from "../shopify.server";
import { removeShopifyInstall } from "../utils/install-tracker.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("[privacy] shop/redact received", {
    topic,
    shop,
    payload,
  });

  const shopIdRaw = (payload as Record<string, unknown>)?.shop_id;
  const shopDomainRaw = (payload as Record<string, unknown>)?.shop_domain;

  const shopId =
    typeof shopIdRaw === "string"
      ? shopIdRaw
      : typeof shopIdRaw === "number"
        ? String(shopIdRaw)
        : null;
  const shopDomain = typeof shopDomainRaw === "string" ? shopDomainRaw : null;

  try {
    await removeShopifyInstall({ storeId: shopId, shopDomain });
  } catch (error) {
    console.error("[privacy] Failed to remove Shopify install data during shop/redact", error);
  }

  return new Response(null, { status: 202 });
};
