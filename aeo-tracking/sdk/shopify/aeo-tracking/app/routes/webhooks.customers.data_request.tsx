import type { ActionFunctionArgs } from "react-router";

import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("[privacy] customers/data_request received", {
    topic,
    shop,
    payload,
  });

  return new Response(null, { status: 202 });
};
