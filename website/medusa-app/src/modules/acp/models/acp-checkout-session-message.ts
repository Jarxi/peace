import { model } from "@medusajs/framework/utils"

const AcpCheckoutSessionMessage = model.define("acp_checkout_session_message", {
  id: model.id().primaryKey(),

  checkout_session_id: model.text(),

  // Message type and code
  type: model.enum(["info", "error"]),
  code: model.text().nullable(), // 'out_of_stock', 'payment_declined', etc.

  // JSONPath to the component this message refers to
  param: model.text().nullable(), // e.g., '$.line_items[0]'

  // Message content
  content_type: model.enum(["plain", "markdown"]),
  content: model.text(),
})

export default AcpCheckoutSessionMessage
