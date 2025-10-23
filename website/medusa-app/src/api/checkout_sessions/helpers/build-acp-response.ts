import { Modules } from "@medusajs/framework/utils"

export type Address = {
  name?: string
  line_one?: string
  line_two?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone_number?: string
}

export type Buyer = {
  email?: string
  first_name?: string
  last_name?: string
  phone_number?: string
}

/**
 * Get messages based on address and items
 */
export function getMessages(address?: Address): Array<{ type: string; text: string }> {
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
 * Build ACP response from session, cart, and other data
 */
export async function buildAcpResponse({
  session,
  cart,
  query,
  storeModuleService,
  taxModuleService,
  protocol,
  host,
  includeOrder = false,
}: {
  session: any
  cart: any
  query: any
  storeModuleService: any
  taxModuleService: any
  protocol: string
  host: string
  includeOrder?: boolean
}) {
  console.log('[buildAcpResponse] Called with session:', {
    sessionId: session?.id,
    sessionStatus: session?.status,
    sessionType: typeof session,
    sessionKeys: session ? Object.keys(session) : 'null',
  })

  const currency = cart.region.currency_code

  // Extract fulfillment address from cart shipping address
  let fulfillment_address: Address | undefined
  if (cart.shipping_address) {
    const addr = cart.shipping_address
    fulfillment_address = {
      name: `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || undefined,
      line_one: addr.address_1 || undefined,
      line_two: addr.address_2 || undefined,
      city: addr.city || undefined,
      state: addr.province || undefined,
      country: addr.country_code?.toUpperCase() || undefined,
      postal_code: addr.postal_code || undefined,
    }
  }

  // Extract buyer information from cart
  let buyer: Buyer | undefined
  if (cart.email || cart.shipping_address) {
    buyer = {
      email: cart.email || undefined,
      first_name: cart.shipping_address?.first_name || undefined,
      last_name: cart.shipping_address?.last_name || undefined,
      phone_number: cart.shipping_address?.phone || undefined,
    }
  }

  // Calculate taxes if address is provided
  let taxLines: any[] = []
  if (fulfillment_address) {
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
  let selectedOption: any = null

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

    // If a fulfillment option is selected on the session, use it
    if (session.fulfillment_option_id) {
      selectedOption = fulfillmentOptions.find(opt => opt.id === session.fulfillment_option_id) || null
    }

    // Otherwise, select cheapest option
    if (!selectedOption && fulfillmentOptions.length > 0) {
      selectedOption = fulfillmentOptions.reduce((prev, curr) => (curr.total < prev.total ? curr : prev))
    }
  }

  // Calculate totals per ACP spec
  const itemsBaseAmount = formattedLineItems.reduce((sum, item) => sum + item.base_amount, 0)
  const totalDiscount = formattedLineItems.reduce((sum, item) => sum + item.discount, 0)
  const totalTax = formattedLineItems.reduce((sum, item) => sum + item.tax, 0)
  const subtotalAmount = itemsBaseAmount - totalDiscount
  const fulfillmentAmount = selectedOption ? selectedOption.total : 0
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
  const status = session.status || (fulfillment_address ? "ready_for_payment" : "not_ready_for_payment")

  // Get store policies from metadata
  const stores = await storeModuleService.listStores()
  const store = stores[0]

  // Build links array with policy URLs
  const baseUrl = `${protocol}://${host}`
  const links: Array<{ type: string; url: string }> = []

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
    status: status,
    currency: currency.toLowerCase(),
    line_items: formattedLineItems,
    totals: totals,
    fulfillment_options: fulfillmentOptions,
    messages: messages,
    links: links,
  }

  // Add payment_provider for create endpoint
  if (!includeOrder) {
    response.payment_provider = {
      provider: "stripe",
      supported_payment_methods: ["card"],
    }
  }

  // Add fulfillment_option_id if option selected
  if (selectedOption) {
    response.fulfillment_option_id = selectedOption.id
  }

  // Add optional fields if present
  if (buyer) {
    response.buyer = buyer
  }

  if (fulfillment_address) {
    response.fulfillment_address = fulfillment_address
  }

  // Add order information if requested (for complete endpoint)
  if (includeOrder && session.medusa_order_id) {
    response.order = {
      id: session.medusa_order_id,
      checkout_session_id: session.id,
      permalink_url: `${baseUrl}/orders/${session.medusa_order_id}`,
    }
  }

  return response
}
