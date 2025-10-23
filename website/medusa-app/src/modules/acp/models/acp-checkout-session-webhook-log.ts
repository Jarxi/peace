import { model } from "@medusajs/framework/utils"

const AcpCheckoutSessionWebhookLog = model.define("acp_checkout_session_webhook_log", {
  id: model.id().primaryKey(),

  checkout_session_id: model.text().nullable(),

  // Webhook event details
  event_type: model.enum(["order_created", "order_updated"]),
  payload: model.json(),

  // Response tracking
  response_status: model.number().nullable(),
  response_body: model.text().nullable(),

  sent_at: model.dateTime(),
  succeeded: model.boolean().default(false),
})

export default AcpCheckoutSessionWebhookLog
