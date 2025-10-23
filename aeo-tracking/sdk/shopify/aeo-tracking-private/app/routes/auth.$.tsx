import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  if (session?.isOnline === false) {
    try {
      const response = await admin.graphql(`
        #graphql
        query shopInfoForInstall {
          shop {
            id
          }
        }
      `);

      const responseJson = await response.json();
      const shopId = responseJson.data?.shop?.id;

      if (shopId) {
        const pixelResult = await ensurePixelExists(admin, shopId);
        console.log("[auth] Pixel provisioning during install", {
          shopId,
          pixelResult,
        });
      } else {
        console.error("[auth] Failed to resolve shop id for pixel install", {
          shop: session.shop,
          response: responseJson,
        });
      }
    } catch (error) {
      console.error("[auth] Failed to create web pixel on install", error);
    }
  }

  return null;
};

type AdminClient = Awaited<ReturnType<typeof authenticate.admin>>["admin"];

type WebPixelCreateResult = {
  userErrors?: Array<{
    code?: string | null;
    field?: string[] | null;
    message: string;
  }> | null;
  webPixel?: {
    id?: string | null;
    settings?: string | null;
  } | null;
};

type GraphQLResponse = {
  data?: {
    webPixelCreate?: WebPixelCreateResult | null;
  } | null;
};

async function ensurePixelExists(
  admin: AdminClient,
  accountId: string,
): Promise<WebPixelCreateResult | null> {
  try {
    const settingsLiteral = JSON.stringify({ accountID: accountId })
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');

    const result = await admin.graphql(`
      #graphql
      mutation ensurePixel {
        webPixelCreate(webPixel: { settings: "${settingsLiteral}" }) {
            userErrors {
              code
              field
              message
            }
            webPixel {
              id
              settings
            }
          }
        }
      }
    `);

    const rawBody = await result.text();

    let json: GraphQLResponse;
    try {
      json = JSON.parse(rawBody) as GraphQLResponse;
    } catch (parseError) {
      console.error("[pixel] Non-JSON response", rawBody);
      throw parseError;
    }

    const payload = json.data?.webPixelCreate ?? null;

    if (!payload) {
      console.error("[pixel] Unexpected response", json);
      return null;
    }

    const blockingErrors = (payload.userErrors ?? []).filter(
      (error) => error.code !== "PIXEL_ALREADY_EXISTS",
    );

    if (blockingErrors.length > 0) {
      console.error("[pixel] webPixelCreate failed", blockingErrors);
    } else if (payload.webPixel?.id) {
      console.log("[pixel] web pixel ready", payload.webPixel.id);
    }

    return payload;
  } catch (error) {
    console.error("[pixel] Failed to ensure web pixel", error);
    return null;
  }
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
