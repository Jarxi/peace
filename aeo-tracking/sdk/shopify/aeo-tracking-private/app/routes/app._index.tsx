import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query shopInfo {
      shop {
        id
        myshopifyDomain
      }
    }
  `);

  const responseJson = await response.json();
  const shopInfo = responseJson.data?.shop;

  if (!shopInfo) {
    throw new Response("Shop info unavailable", {
      status: 502,
      statusText: "Failed to load shop info",
    });
  }

  const pixelResult = await ensurePixelExists(admin, shopInfo.id);

  return {
    storeId: shopInfo.id,
    storeDomain: session?.shop ?? shopInfo.myshopifyDomain,
    pixelResult,
  };
};

export default function Index() {
  const { storeId, storeDomain, pixelResult } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Auto AEO tracking">
      <s-section heading="Welcome">
        <s-paragraph>
          Hi, we provide auto AEO tracking. Please check{" "}
          <s-link href="https://Peace.ai" target="_blank">
            Peace.ai
          </s-link>{" "}
          for details.
        </s-paragraph>
      </s-section>
      <s-section heading="Store details">
        <s-stack direction="block" gap="tight">
          <s-text>
            <strong>Store ID:</strong> {storeId}
          </s-text>
          <s-text>
            <strong>Store domain:</strong> {storeDomain}
          </s-text>
        </s-stack>
      </s-section>
      {pixelResult && (
        <s-section heading="Pixel provisioning">
          <s-box
            borderWidth="base"
            borderRadius="base"
            background="subdued"
            padding="tight"
          >
            <pre style={{ margin: 0 }}>
              <code>{JSON.stringify(pixelResult, null, 2)}</code>
            </pre>
          </s-box>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
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
