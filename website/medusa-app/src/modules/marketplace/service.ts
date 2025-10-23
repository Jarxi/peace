import { MedusaService } from "@medusajs/framework/utils"
import Vendor from "./models/vendor"
import VendorAdmin from "./models/vendor-admin"
import VendorStore from "./models/vendor-store"
import VendorStoreClaimState from "./models/vendor-store-claim-state"
import TrafficEvent from "./models/traffic-event"
import VendorStoreTrafficSummary from "./models/vendor-store-traffic-summary"
import TrafficAggregated from "./models/traffic-aggregated"

class MarketplaceModuleService extends MedusaService({
    Vendor,
    VendorAdmin,
    VendorStore,
    VendorStoreClaimState,
    TrafficEvent,
    VendorStoreTrafficSummary,
    TrafficAggregated,
}) { }

export default MarketplaceModuleService
