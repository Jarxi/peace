import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { ACP_MODULE } from "../../../modules/acp"
import AcpModuleService from "../../../modules/acp/service"
import { buildAcpResponse, Address, Buyer } from "../helpers/build-acp-response"

type UpdateCheckoutSessionRequest = {
  buyer?: Buyer
  items?: Array<{
    id: string
    quantity: number
  }>
  fulfillment_address?: Address
  fulfillment_option_id?: string
}

/**
 * GET /checkout_sessions/:id
 * Returns up-to-date information about the checkout session
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  console.log('[GET /checkout_sessions/:id] Request params:', {
    id,
    params: req.params,
    url: req.url,
    path: req.path,
  })

  // Get ACP service
  const acpService = req.scope.resolve(ACP_MODULE) as AcpModuleService

  // Retrieve session
  let session
  try {
    session = await acpService.retrieveAcpCheckoutSession(id)
  } catch (error) {
    console.error('[GET /checkout_sessions/:id] Error retrieving session:', {
      id,
      error: error instanceof Error ? error.message : error,
    })
    return res.status(404).json({
      type: "invalid_request",
      code: "not_found",
      message: "Checkout session not found",
    })
  }

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

  if (!carts || carts.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Cart not found for checkout session"
    )
  }

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

/**
 * POST /checkout_sessions/:id
 * Updates the checkout session with new buyer info, items, address, or fulfillment option
 */
export const POST = async (
  req: MedusaRequest<UpdateCheckoutSessionRequest>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const {
    buyer,
    items,
    fulfillment_address,
    fulfillment_option_id,
  } = req.body

  console.log('[POST /checkout_sessions/:id] Request params:', {
    id,
    params: req.params,
    url: req.url,
    path: req.path,
    allParams: JSON.stringify(req.params),
  })

  // Get ACP service
  const acpService = req.scope.resolve(ACP_MODULE) as AcpModuleService

  // Retrieve session
  let session
  try {
    console.log('[POST /checkout_sessions/:id] About to retrieve session with ID:', id, 'Type:', typeof id, 'Length:', id?.length)
    session = await acpService.retrieveAcpCheckoutSession(id)
    console.log('[POST /checkout_sessions/:id] Session retrieved successfully:', session?.id)
  } catch (error) {
    console.error('[POST /checkout_sessions/:id] Error retrieving session:', {
      id,
      idType: typeof id,
      idLength: id?.length,
      error: error instanceof Error ? error.message : error,
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(404).json({
      type: "invalid_request",
      code: "not_found",
      message: "Checkout session not found",
    })
  }

  // Cannot update completed or canceled sessions
  if (session.status === "completed" || session.status === "canceled") {
    return res.status(400).json({
      type: "invalid_request",
      code: "invalid_state",
      message: `Cannot update checkout session with status: ${session.status}`,
    })
  }

  // Get query service
  const query = req.scope.resolve("query")

  // Get cart module service for metadata updates
  const cartModuleService = req.scope.resolve(Modules.CART)

  // Get current cart
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

  if (!carts || carts.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Cart not found for checkout session"
    )
  }

  let cart = carts[0]

  // Update cart email if buyer email is provided
  if (buyer?.email) {
    await cartModuleService.updateCarts(cart.id, {
      email: buyer.email,
    })
  }

  // Update cart shipping address if fulfillment_address is provided
  if (fulfillment_address) {
    const firstName = buyer?.first_name || fulfillment_address.name?.split(' ')[0] || ''
    const lastName = buyer?.last_name || fulfillment_address.name?.split(' ').slice(1).join(' ') || ''

    await cartModuleService.updateCarts(cart.id, {
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address_1: fulfillment_address.line_one || '',
        address_2: fulfillment_address.line_two,
        city: fulfillment_address.city || '',
        province: fulfillment_address.state,
        postal_code: fulfillment_address.postal_code || '',
        country_code: fulfillment_address.country?.toLowerCase() || '',
        phone: buyer?.phone_number || fulfillment_address.phone_number,
      },
    })
  }

  // Update cart items if items array is provided
  // Note: Per ACP spec, items update is optional. For simplicity, we don't support
  // updating items in an existing session. To change items, create a new session.
  if (items && items.length > 0) {
    return res.status(400).json({
      type: "invalid_request",
      code: "not_supported",
      message: "Updating items in existing checkout session is not supported. Please create a new session with updated items.",
    })
  }

  // Update fulfillment option if provided
  if (fulfillment_option_id) {
    console.log('[POST /checkout_sessions/:id] Updating fulfillment option, session.id:', session.id, 'session:', session)
    await acpService.updateAcpCheckoutSessions({
      selector: { id: session.id },
      data: { fulfillment_option_id },
    })
  }

  // Refresh session and cart data
  console.log('[POST /checkout_sessions/:id] About to refresh session with ID:', id, 'Type:', typeof id, 'Length:', id?.length)
  session = await acpService.retrieveAcpCheckoutSession(id)
  console.log('[POST /checkout_sessions/:id] Session refreshed successfully:', session?.id)

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

  cart = updatedCarts[0]

  // Determine new status based on whether we have address now
  let newStatus = session.status
  if (fulfillment_address && cart.shipping_address) {
    newStatus = "ready_for_payment"
    console.log('[POST /checkout_sessions/:id] About to update status:', {
      sessionId: session.id,
      sessionIdType: typeof session.id,
      sessionIdLength: session.id?.length,
      sessionKeys: Object.keys(session),
      newStatus,
    })
    await acpService.updateAcpCheckoutSessions({
      selector: { id: session.id },
      data: { status: newStatus },
    })
    console.log('[POST /checkout_sessions/:id] Status update completed')
    // Refresh the session object after status update to ensure consistency
    session = await acpService.retrieveAcpCheckoutSession(id)
    console.log('[POST /checkout_sessions/:id] Session refreshed after status update:', session?.id)
  }

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
