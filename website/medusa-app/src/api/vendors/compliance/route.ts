import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import MarketplaceModuleService from "../../../modules/marketplace/service"
import { SHOPIFY_SOURCE_FEED_MODULE } from "../../../modules/source_feed/shopify"
import ShopifyFeedModuleService from "../../../modules/source_feed/shopify/service"
import {
    generateComplianceReport,
    type ComplianceReport,
} from "../../../lib/compliance-data-util"
import type { ShopifyProduct, ShopifyShop } from "../../../lib/shopify-data-util"

/**
 * GET /vendors/compliance
 * Fetch compliance report for vendor's products from shopify export table
 *
 * This endpoint:
 * 1. Authenticates the vendor
 * 2. Gets the vendor's store_id
 * 3. Queries shopify export table for shop_info and products
 * 4. Generates and returns compliance report
 */
export const GET = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    console.log('[Vendor Compliance] Starting request', {
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

    console.log('[Vendor Compliance] Vendor authenticated:', {
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

    // Use the first store (or could aggregate across all stores)
    const storeId = claimStates[0].store_id

    if (!storeId) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Store ID not found in claim state"
        )
    }

    console.log('[Vendor Compliance] Store data:', {
        store_id: storeId,
        platform_id: claimStates[0].platform_id,
        all_claim_states: claimStates,
    })

    console.log('[Vendor Compliance] Querying shopify export for store:', {
        store_id: storeId,
    })

    // Get Shopify feed module service
    const shopifyFeedService: ShopifyFeedModuleService =
        req.scope.resolve(SHOPIFY_SOURCE_FEED_MODULE)

    try {
        // Query shopify export table using the module service
        const exports = await shopifyFeedService.listShopifyAcpExports({
            store_id: storeId,
        })

        console.log('[Vendor Compliance] Query result:', {
            exports_count: exports?.length || 0,
            exports: exports,
        })

        if (!exports || exports.length === 0) {
            // Try querying all exports to see what's in the table
            const allExports = await shopifyFeedService.listShopifyAcpExports({})
            console.log('[Vendor Compliance] All exports in table:', {
                count: allExports?.length || 0,
                store_ids: allExports?.map(e => e.store_id),
            })

            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `No compliance data found for store_id: ${storeId}. Please ensure product export has been generated.`
            )
        }

        const exportData = exports[0]
        const shop_info: ShopifyShop | undefined = exportData.shop_info as unknown as ShopifyShop | undefined
        const products: ShopifyProduct[] = (exportData.products as unknown as ShopifyProduct[]) || []

        console.log('[Vendor Compliance] Found export data:', {
            has_shop_info: !!shop_info,
            product_count: products.length,
        })

        if (products.length === 0) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "No products found in export data"
            )
        }

        // Generate compliance report
        const complianceReport: ComplianceReport = generateComplianceReport(products, shop_info)

        console.log('[Vendor Compliance] Generated report:', {
            overall_score: complianceReport.overall_score,
            total_products: complianceReport.total_products,
        })

        // Return compliance report
        res.json({
            vendor_id: vendorAdmin.vendor_id,
            store_id: storeId,
            generated_at: new Date().toISOString(),
            ...complianceReport,
        })
    } catch (error) {
        if (error instanceof MedusaError) {
            throw error
        }

        console.error('[Vendor Compliance] Error:', error)

        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            error instanceof Error ? error.message : "Failed to fetch compliance data"
        )
    }
}
