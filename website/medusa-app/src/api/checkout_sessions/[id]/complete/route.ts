import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { completeCartWorkflow } from "@medusajs/core-flows"
import { ACP_MODULE } from "../../../../modules/acp"
import AcpModuleService from "../../../../modules/acp/service"
import { buildAcpResponse, Buyer, Address } from "../../helpers/build-acp-response"

type PaymentData = {
  token: string
  provider: string
  billing_address?: Address
}

type CompleteCheckoutSessionRequest = {
  buyer?: Buyer
  payment_data: PaymentData
}

/**
 * POST /checkout_sessions/:id/complete
 * Completes a checkout session and creates an order per OpenAI Agentic Checkout Protocol
 */
export const POST = async (
  req: MedusaRequest<CompleteCheckoutSessionRequest>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { buyer, payment_data } = req.body

  // Validate required fields
  if (!payment_data || !payment_data.token || !payment_data.provider) {
    return res.status(400).json({
      type: "invalid_request",
      code: "missing_required_field",
      message: "payment_data with token and provider is required",
    })
  }

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

  // Check if session is ready for completion
  if (session.status === "completed") {
    return res.status(400).json({
      type: "invalid_request",
      code: "already_completed",
      message: "Checkout session is already completed",
    })
  }

  if (session.status === "canceled") {
    return res.status(400).json({
      type: "invalid_request",
      code: "invalid_state",
      message: "Cannot complete a canceled checkout session",
    })
  }

  if (session.status !== "ready_for_payment") {
    return res.status(400).json({
      type: "invalid_request",
      code: "not_ready",
      message: "Checkout session is not ready for payment. Please add fulfillment address first.",
    })
  }

  // Get query service
  const query = req.scope.resolve("query")

  // Get cart details
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
      "billing_address.*",
    ],
    filters: { id: session.medusa_cart_id },
  })

  const cart = carts[0]

  // Update cart with buyer info if provided
  const cartModuleService = req.scope.resolve(Modules.CART)

  if (buyer?.email && !cart.email) {
    await cartModuleService.updateCarts(cart.id, {
      email: buyer.email,
    })
  }

  // Add billing address if provided
  if (payment_data.billing_address && !cart.billing_address) {
    await cartModuleService.updateCarts(cart.id, {
      billing_address: {
        first_name: buyer?.first_name || payment_data.billing_address.name?.split(' ')[0] || '',
        last_name: buyer?.last_name || payment_data.billing_address.name?.split(' ').slice(1).join(' ') || '',
        address_1: payment_data.billing_address.line_one || '',
        address_2: payment_data.billing_address.line_two,
        city: payment_data.billing_address.city || '',
        province: payment_data.billing_address.state,
        postal_code: payment_data.billing_address.postal_code || '',
        country_code: payment_data.billing_address.country?.toLowerCase() || '',
        phone: buyer?.phone_number || payment_data.billing_address.phone_number,
      },
    })
  }

  try {
    // Complete cart and create order using Medusa's completeCartWorkflow
    const { result } = await completeCartWorkflow(req.scope).run({
      input: {
        id: cart.id,
      },
    })

    // Update ACP session with order info and mark as completed
    await acpService.updateAcpCheckoutSessions({
      selector: { id: session.id },
      data: {
        status: "completed",
        medusa_order_id: result.id,
        payment_token: payment_data.token,
        payment_provider: payment_data.provider,
        completed_at: new Date(),
      },
    })

    // Refresh session
    session = await acpService.retrieveAcpCheckoutSession(id)

    // Refresh cart data
    const { data: updatedCarts } = await query.graph({
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

    const updatedCart = updatedCarts[0]

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

    // Build response with order information
    const response = await buildAcpResponse({
      session,
      cart: updatedCart,
      query,
      storeModuleService,
      taxModuleService,
      protocol,
      host,
      includeOrder: true,
    })

    res.json(response)
  } catch (error: any) {
    // If order creation fails, return error
    console.error('Error completing checkout session:', error)

    return res.status(400).json({
      type: "invalid_request",
      code: "payment_failed",
      message: error.message || "Failed to complete checkout session. Please try again.",
    })
  }
}
