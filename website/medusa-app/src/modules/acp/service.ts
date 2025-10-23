import { MedusaService } from "@medusajs/framework/utils"
import AcpCheckoutSession from "./models/acp-checkout-session"
import AcpCheckoutSessionMessage from "./models/acp-checkout-session-message"
import AcpCheckoutSessionWebhookLog from "./models/acp-checkout-session-webhook-log"

class AcpModuleService extends MedusaService({
  AcpCheckoutSession,
  AcpCheckoutSessionMessage,
  AcpCheckoutSessionWebhookLog,
}) {}

export default AcpModuleService
