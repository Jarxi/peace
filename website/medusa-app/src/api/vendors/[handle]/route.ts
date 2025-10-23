import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import MarketplaceModuleService from "../../../modules/marketplace/service"

// GET /vendors/:handle - Get vendor storefront page
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

    res.json({
        vendor: {
            id: vendor.id,
            name: vendor.name,
            handle: vendor.handle,
            logo: vendor.logo,
            metadata: vendor.metadata,
        },
    })
}
