import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import MarketplaceModuleService from "../../../modules/marketplace/service"

export const GET = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    // Ensure the request is authenticated
    if (!req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Unauthorized: No vendor authenticated"
        )
    }

    const marketplaceModuleService: MarketplaceModuleService =
        req.scope.resolve(MARKETPLACE_MODULE)

    // Get vendor admin to get vendor_id
    const vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
        req.auth_context.actor_id,
        {
            relations: ["vendor"],
        }
    )

    if (!vendorAdmin || !vendorAdmin.vendor_id) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "No vendor account found for this user"
        )
    }

    // Get vendor stores
    const stores = await marketplaceModuleService.listVendorStores({
        vendor_id: vendorAdmin.vendor_id,
    })

    res.json({
        stores,
        hasStores: stores.length > 0,
    })
}
