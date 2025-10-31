import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import MarketplaceModuleService from "../../../modules/marketplace/service"
import { SHOPIFY_SOURCE_FEED_MODULE } from "../../../modules/source_feed/shopify"
import ShopifyFeedModuleService from "../../../modules/source_feed/shopify/service"

/**
 * GET /vendors/load-states
 * Fetch load states for vendor's stores from feed_shopify.load_state table
 *
 * This endpoint:
 * 1. Authenticates the vendor
 * 2. Gets the vendor's store_id(s)
 * 3. Queries load_state table for those stores
 * 4. Returns load state records
 */
export const GET = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    console.log('[Vendor Load States] Starting request', {
        actor_id: req.auth_context?.actor_id,
    })

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

    console.log('[Vendor Load States] Vendor authenticated:', {
        vendor_id: vendorAdmin.vendor_id,
    })

    // Get vendor store claim states (which has the actual Shopify store_id)
    const claimStates = await marketplaceModuleService.listVendorStoreClaimStates({
        vendor_id: vendorAdmin.vendor_id,
    })

    if (!claimStates || claimStates.length === 0) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "No stores found for this vendor"
        )
    }

    // Collect all store IDs for this vendor
    const storeIds = claimStates
        .map(state => state.store_id)
        .filter(Boolean) as string[]

    if (storeIds.length === 0) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Store IDs not found in claim states"
        )
    }

    console.log('[Vendor Load States] Querying for stores:', {
        store_ids: storeIds,
    })

    // Get Shopify feed module service
    const shopifyFeedService: ShopifyFeedModuleService =
        req.scope.resolve(SHOPIFY_SOURCE_FEED_MODULE)

    try {
        // Query load_state table for all vendor stores
        const loadStates = await shopifyFeedService.listLoadStates({
            store_id: storeIds,
        }, {
            order: {
                created_at: "DESC"
            },
            take: 50, // Limit to 50 most recent
        })

        console.log('[Vendor Load States] Query result:', {
            count: loadStates?.length || 0,
        })

        // Return load states
        res.json({
            states: loadStates || [],
        })
    } catch (error) {
        console.error('[Vendor Load States] Error:', error)

        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            error instanceof Error ? error.message : "Failed to fetch load states"
        )
    }
}
