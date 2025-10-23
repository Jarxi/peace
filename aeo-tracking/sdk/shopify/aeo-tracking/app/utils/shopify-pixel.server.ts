import { authenticate } from "../shopify.server";

type AdminClient = Awaited<ReturnType<typeof authenticate.admin>>["admin"];

export type WebPixelCreateResult = {
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

export async function ensurePixelExists(
  admin: AdminClient,
  shopId: string,
): Promise<WebPixelCreateResult | null> {
  try {
    const settingsLiteral = JSON.stringify({ shopId: shopId })
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
