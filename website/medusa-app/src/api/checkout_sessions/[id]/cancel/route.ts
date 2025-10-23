import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { ACP_MODULE } from "../../../../modules/acp"
import AcpModuleService from "../../../../modules/acp/service"
import { buildAcpResponse } from "../../helpers/build-acp-response"

/**
 * POST /checkout_sessions/:id/cancel
 * Cancels a checkout session per OpenAI Agentic Checkout Protocol
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  // Get ACP service
  const acpService = req.scope.resolve(ACP_MODULE) as AcpModuleService

  // Retrieve session
  let session
  try {
    session = await acpService.retrieveAcpCheckoutSession(id)
  } catch (error) {
    return res.status(404).json({
      type: "invalid_request",
      code: "not_found",
      message: "Checkout session not found",
    })
  }

  // Check if session can be canceled (per ACP spec: cannot cancel if already completed or canceled)
  if (session.status === "completed" || session.status === "canceled") {
    return res.status(405).json({
      type: "invalid_request",
      code: "invalid_state",
      message: `Cannot cancel checkout session with status: ${session.status}`,
    })
  }

  // Update session status to canceled
  await acpService.updateAcpCheckoutSessions({
    selector: { id: session.id },
    data: {
      status: "canceled",
      canceled_at: new Date(),
    },
  })

  // Refresh session
  session = await acpService.retrieveAcpCheckoutSession(id)

  // Get query service for data fetching
  const query = req.scope.resolve("query")

  // Get cart details to build response
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "region_id",
      "region.*",
      "region.currency_code",
      "items.*",
      "items.variant_id",
      "items.product_id",
      "items.unit_price",
      "items.quantity",
      "items.product.title",
      "items.product.description",
      "shipping_address.*",
    ],
    filters: { id: session.medusa_cart_id },
  })

  const cart = carts[0]

  // Get modules
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const taxModuleService = req.scope.resolve(Modules.TAX)

  // Get base URL from request
  const protocol = (Array.isArray(req.headers['x-forwarded-proto'])
    ? req.headers['x-forwarded-proto'][0]
    : req.headers['x-forwarded-proto']) || 'http'
  const host = (Array.isArray(req.headers['host'])
    ? req.headers['host'][0]
    : req.headers['host']) || 'localhost:9000'

  // Build response
  const response = await buildAcpResponse({
    session,
    cart,
    query,
    storeModuleService,
    taxModuleService,
    protocol,
    host,
  })

  res.json(response)
}
