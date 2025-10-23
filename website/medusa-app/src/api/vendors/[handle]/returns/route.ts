import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

// GET /vendors/:handle/returns - Display vendor's return policy
export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const vendorHandle = req.params.handle

    const marketplaceModuleService: MarketplaceModuleService =
        req.scope.resolve(MARKETPLACE_MODULE)

    // Get vendor by handle
    const vendors = await marketplaceModuleService.listVendors({
        handle: vendorHandle,
    })

    const vendor = vendors[0]

    if (!vendor) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Vendor with handle "${vendorHandle}" not found`
        )
    }

    // Get return policy from vendor metadata
    const return_policy = vendor.metadata?.return_policy || "No return policy has been set for this vendor."

    res.json({
        vendor: {
            id: vendor.id,
            name: vendor.name,
            handle: vendor.handle,
        },
        policy_type: "return_policy",
        policy_content: return_policy,
    })
}
