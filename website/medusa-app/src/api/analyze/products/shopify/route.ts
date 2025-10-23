import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
    ShopifyImportSchema,
    type ShopifyProduct,
} from "../../../../lib/shopify-data-util"
import {
    generateComplianceReport,
    type ComplianceReport,
} from "../../../../lib/compliance-data-util"

/**
 * POST /analyze/products/shopify
 * Analyze Shopify products for ACP compliance without creating them
 *
 * This endpoint is accessible by vendors only.
 * It validates product data against ACP requirements and returns a detailed compliance report.
 *
 * Accepts Shopify product data in flat format: { products: [...], shop_info: {...} }
 */
export const POST = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    console.log('[Shopify Compliance Analysis] Starting analysis request', {
        actor_id: req.auth_context?.actor_id,
        content_type: req.headers["content-type"],
    })

    // Ensure the request is authenticated
    if (!req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Unauthorized: Authentication required"
        )
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Verify this is a vendor (not admin)
    const { data: vendorAdmins } = await query.graph({
        entity: "vendor_admin",
        fields: ["vendor.id", "vendor.handle"],
        filters: {
            id: [req.auth_context.actor_id],
        },
    })

    if (!vendorAdmins || vendorAdmins.length === 0) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "This endpoint is only accessible to vendors. Admins should use /import/products/shopify for direct import."
        )
    }

    const vendorId = vendorAdmins[0].vendor.id
    const vendorHandle = vendorAdmins[0].vendor.handle

    console.log('[Shopify Compliance Analysis] Vendor authenticated:', {
        vendor_id: vendorId,
        vendor_handle: vendorHandle,
    })

    try {
        // Parse request body - expecting Shopify data in flat format
        const jsonData: any = req.body

        console.log('[Shopify Compliance Analysis] Incoming data structure:', {
            has_products: !!jsonData.products,
            is_products_array: Array.isArray(jsonData.products),
            has_shop_info: !!jsonData.shop_info,
        })

        // Validate using flat schema
        const validatedData = ShopifyImportSchema.parse(jsonData)

        const products: ShopifyProduct[] = validatedData.products
        const shopData = validatedData.shop_info

        if (products.length === 0) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "No products found in the uploaded file."
            )
        }

        console.log('[Shopify Compliance Analysis] Validated data:', {
            product_count: products.length,
            has_shop: !!shopData,
            first_product_variants: products[0]?.variants?.length || 0,
        })

        // Generate compliance report
        const complianceReport: ComplianceReport = generateComplianceReport(products, shopData)

        // Return compliance report with shop data
        res.json({
            vendor_id: vendorId,
            vendor_name: vendorHandle,
            analyzed_at: new Date().toISOString(),
            ...complianceReport,
        })
    } catch (error) {
        if (error instanceof MedusaError) {
            throw error
        }

        // Handle Zod validation errors
        if (error instanceof Error && error.name === "ZodError") {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Invalid Shopify JSON format: ${error.message}`
            )
        }

        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            error instanceof Error ? error.message : "Failed to analyze products"
        )
    }
}
