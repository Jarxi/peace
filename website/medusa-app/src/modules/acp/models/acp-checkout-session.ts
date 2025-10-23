import { model } from "@medusajs/framework/utils"

const AcpCheckoutSession = model.define("acp_checkout_session", {
  id: model.id().primaryKey(),
  status: model.enum([
    "not_ready_for_payment",
    "ready_for_payment",
    "completed",
    "canceled",
  ]).default("not_ready_for_payment"),

  // Link to Medusa cart (source of truth for buyer, items, address, etc.)
  medusa_cart_id: model.text().unique(),

  // Link to Medusa order (created after completion)
  medusa_order_id: model.text().nullable(),

  // Selected fulfillment option ID (user's choice during session)
  fulfillment_option_id: model.text().nullable(),

  // Payment token from OpenAI
  payment_token: model.text().nullable(),
  payment_provider: model.text().nullable(), // 'stripe'

  // OpenAI request tracking
  idempotency_key: model.text().nullable(),
  last_request_id: model.text().nullable(),

  // Timestamps
  completed_at: model.dateTime().nullable(),
  canceled_at: model.dateTime().nullable(),
})

export default AcpCheckoutSession
