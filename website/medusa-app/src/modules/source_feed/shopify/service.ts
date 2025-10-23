import { MedusaService } from "@medusajs/framework/utils"
import LoadState from "./models/load-state"
import ShopifyAcpExport from "./models/acp-export"

class ShopifyFeedModuleService extends MedusaService({
  LoadState,
  ShopifyAcpExport,
}) {}

export default ShopifyFeedModuleService
