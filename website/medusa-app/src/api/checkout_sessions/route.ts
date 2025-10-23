import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import createCheckoutSessionWorkflow from "../../workflows/acp/create-checkout-session"
import { ACP_MODULE } from "../../modules/acp"
import AcpModuleService from "../../modules/acp/service"

// OpenAI ACP Request Types
type Item = {
  id: string
  quantity: number
}

type Address = {
  name?: string
  line_one?: string
  line_two?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
}

type Buyer = {
  email?: string
  name?: string
  phone?: string
}

type CreateCheckoutSessionRequest = {
  buyer?: Buyer
  items: Item[]
  fulfillment_address?: Address
}



// Helper: Get messages based on address and items
function getMessages(address?: Address): Array<{ type: string; text: string }> {
  const messages: Array<{ type: string; text: string }> = []

  // CA Prop 65 warning
  if (address?.state?.toUpperCase() === 'CA') {
    messages.push({
      type: "warning",
      text: "California Proposition 65 Warning: This product may contain chemicals known to the State of California to cause cancer and birth defects or other reproductive harm.",
    })
  }

  return messages
}

/**
 * POST /checkout_sessions
 * Creates a new checkout session per OpenAI Agentic Checkout Protocol
 */
export const POST = async (
  req: MedusaRequest<CreateCheckoutSessionRequest>,
  res: MedusaResponse
) => {
  const {
    buyer,
    items,
    fulfillment_address,
  } = req.body

  // Validate required fields - items is required, buyer is optional per spec
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "items is required and must be a non-empty list"
    )
  }

  // Extract headers
  const idempotencyKey = req.headers['idempotency-key'] as string
  const requestId = req.headers['openai-request-id'] as string

  // Get query service for data fetching
  const query = req.scope.resolve("query")

  // Get a default region (required for cart creation)
  // TODO: In production, map country_code from fulfillment_address to appropriate region
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    pagination: { take: 1 },
  })

  if (!regions || regions.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No regions configured. Please set up at least one region."
    )
  }

  const region_id = regions[0].id
  const currency = regions[0].currency_code

  // Get default sales channel
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
    pagination: { take: 1 },
  })

  const sales_channel_id = salesChannels && salesChannels.length > 0 ? salesChannels[0].id : undefined

  // Convert items to line_items format for internal workflow
  const line_items = items.map(item => ({
    merchant_product_id: item.id,
    quantity: item.quantity,
  }))

  // Create checkout session via workflow
  const { result } = await createCheckoutSessionWorkflow(req.scope).run({
    input: {
      buyer,
      line_items,
      fulfillment_address,
      region_id,
      sales_channel_id,
      idempotency_key: idempotencyKey,
      request_id: requestId,
    },
  })

  // Get the session details
  const acpService = req.scope.resolve(ACP_MODULE) as AcpModuleService
  const session = await acpService.retrieveAcpCheckoutSession(result.session_id)

  // Get cart details to build response
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "region_id",
      "region.currency_code",
      "items.*",
      "items.variant_id",
      "items.unit_price",
      "items.quantity",
      "items.product.title",
      "items.product.description",
    ],
    filters: { id: result.cart_id },
  })

  const cart = carts[0]

  // Calculate taxes using Medusa's Tax Module if address is provided
  let taxLines: any[] = []
  if (fulfillment_address) {
    const taxModuleService = req.scope.resolve(Modules.TAX)

    // Format cart items for tax calculation
    const taxableItems = cart.items.map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      unit_price: item.unit_price,
      quantity: item.quantity,
    }))

    // Calculate tax lines
    taxLines = await taxModuleService.getTaxLines(
      taxableItems,
      {
        address: {
          country_code: fulfillment_address.country?.toLowerCase() || 'us',
          province_code: fulfillment_address.state,
          city: fulfillment_address.city,
          postal_code: fulfillment_address.postal_code,
        },
      }
    )
  }

  // Format line items response per ACP spec
  const formattedLineItems = cart.items.map((item: any, index: number) => {
    const baseAmount = item.unit_price * item.quantity
    const discount = 0 // TODO: Calculate actual discounts
    const subtotal = baseAmount - discount

    // Get tax for this line item from tax lines
    const itemTaxLines = taxLines.filter((tl: any) => tl.line_item_id === item.id)
    const tax = itemTaxLines.reduce((sum: number, tl: any) => {
      return sum + Math.round((subtotal * tl.rate) / 100)
    }, 0)

    const total = subtotal + tax

    return {
      id: `line_item_${index + 1}`,
      item: {
        id: item.variant_id,
        quantity: item.quantity,
      },
      base_amount: baseAmount,
      discount: discount,
      subtotal: subtotal,
      tax: tax,
      total: total,
    }
  })

  // Get fulfillment options from database if address provided
  let fulfillmentOptions: any[] = []
  let cheapestOption: any = null

  if (fulfillment_address) {
    // Query shipping options from database
    const { data: shippingOptions } = await query.graph({
      entity: "shipping_option",
      fields: [
        "id",
        "name",
        "price_type",
        "provider_id",
        "data",
        "type.*",
        "prices.*",
        "prices.amount",
        "prices.currency_code",
      ],
      filters: {
        price_type: "flat",
      },
    })

    // Format shipping options for ACP response
    fulfillmentOptions = shippingOptions.map((option: any) => {
      // Find price for the cart's currency
      const price = option.prices?.find((p: any) => p.currency_code === currency) || option.prices?.[0]
      const amount = price?.amount || 0

      // Get delivery times from data field (in days), with fallback defaults
      // Admins can set these via Admin API POST /admin/shipping-options with data field:
      // { earliest_delivery_days: 2, latest_delivery_days: 5, carrier: "USPS" }
      const earliestDays = option.data?.earliest_delivery_days || 2
      const latestDays = option.data?.latest_delivery_days || 5

      return {
        type: "shipping",
        id: option.id,
        title: option.type?.label || option.name,
        subtitle: option.type?.description || "",
        carrier: option.data?.carrier || (option.provider_id === "manual_manual" ? "Standard Carrier" : option.provider_id),
        earliest_delivery_time: new Date(Date.now() + earliestDays * 24 * 60 * 60 * 1000).toISOString(),
        latest_delivery_time: new Date(Date.now() + latestDays * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: amount,
        tax: 0,
        total: amount,
      }
    })

    // Select cheapest option
    cheapestOption = fulfillmentOptions.length > 0
      ? fulfillmentOptions.reduce((prev, curr) => (curr.total < prev.total ? curr : prev))
      : null
  }

  // Calculate totals per ACP spec
  const itemsBaseAmount = formattedLineItems.reduce((sum, item) => sum + item.base_amount, 0)
  const totalDiscount = formattedLineItems.reduce((sum, item) => sum + item.discount, 0)
  const totalTax = formattedLineItems.reduce((sum, item) => sum + item.tax, 0)
  const subtotalAmount = itemsBaseAmount - totalDiscount
  const fulfillmentAmount = cheapestOption ? cheapestOption.total : 0
  const totalAmount = subtotalAmount + totalTax + fulfillmentAmount

  const totals = [
    {
      type: "items_base_amount",
      display_text: "Item(s) total",
      amount: itemsBaseAmount,
    },
    {
      type: "subtotal",
      display_text: "Subtotal",
      amount: subtotalAmount,
    },
    {
      type: "tax",
      display_text: "Tax",
      amount: totalTax,
    },
  ]

  // Add fulfillment to totals if applicable
  if (fulfillmentAmount > 0) {
    totals.push({
      type: "fulfillment",
      display_text: "Fulfillment",
      amount: fulfillmentAmount,
    })
  }

  totals.push({
    type: "total",
    display_text: "Total",
    amount: totalAmount,
  })

  // Get messages
  const messages = getMessages(fulfillment_address)

  // Determine status based on fulfillment address
  const status = fulfillment_address ? "ready_for_payment" : "not_ready_for_payment"

  // Get store policies from metadata
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const stores = await storeModuleService.listStores()
  const store = stores[0]

  // Build links array with policy URLs
  // We expose the policy content through public policy endpoints
  const links: Array<{ type: string; url: string }> = []

  // Get the base URL from the request
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers['host'] || 'localhost:9000'
  const baseUrl = `${protocol}://${host}`

  if (store?.metadata?.terms_of_use_content) {
    links.push({
      type: "terms_of_use",
      url: `${baseUrl}/policies/terms-of-use`,
    })
  }

  if (store?.metadata?.privacy_policy_content) {
    links.push({
      type: "privacy_policy",
      url: `${baseUrl}/policies/privacy-policy`,
    })
  }

  if (store?.metadata?.return_policy_content) {
    links.push({
      type: "return_policy",
      url: `${baseUrl}/policies/return-policy`,
    })
  }

  // Build response per OpenAI ACP spec
  const response: any = {
    id: session.id,
    payment_provider: {
      provider: "stripe", // TODO: Get from config
      supported_payment_methods: ["card"],
    },
    status: status,
    currency: currency.toLowerCase(),
    line_items: formattedLineItems,
    totals: totals,
    fulfillment_options: fulfillmentOptions,
    messages: messages,
    links: links,
  }

  // Add fulfillment_option_id if cheapest option selected
  if (cheapestOption) {
    response.fulfillment_option_id = cheapestOption.id
  }

  // Add optional fields if present
  if (buyer) {
    response.buyer = buyer
  }

  if (fulfillment_address) {
    response.fulfillment_address = fulfillment_address
  }

  // Return 201 Created per ACP spec
  res.setHeader('Idempotency-Key', idempotencyKey || '')
  res.setHeader('Request-Id', requestId || '')
  res.status(201).json(response)
}
