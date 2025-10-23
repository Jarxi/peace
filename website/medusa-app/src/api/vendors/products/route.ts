import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import createVendorProductWorkflow from "../../../workflows/marketplace/create-vendor-product"

// Validation schema for creating a product
export const PostVendorProductCreateSchema = z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    handle: z.string().optional(),
    is_giftcard: z.boolean().optional().default(false),
    discountable: z.boolean().optional().default(true),
    weight: z.number().optional(),
    length: z.number().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    hs_code: z.string().optional(),
    origin_country: z.string().optional(),
    material: z.string().optional(),
    images: z.array(z.object({
        url: z.string(),
    })).optional(),
    thumbnail: z.string().optional(),
    status: z.enum(["draft", "proposed", "published", "rejected"]).optional().default("draft"),
    metadata: z.object({
        // OpenAI Required Flags (defaults to true if not specified)
        enable_search: z.boolean().optional(),
        enable_checkout: z.boolean().optional(),

        // OpenAI Required Fields
        brand: z.string().optional(), // Required for most products
        mpn: z.string().optional(), // Required if no GTIN
        return_policy_url: z.string().url().optional(), // URL to return policy

        // OpenAI Conditional Fields
        condition: z.enum(["new", "refurbished", "used"]).optional(), // Required if not new
        availability: z.enum(["in_stock", "out_of_stock", "preorder"]).optional(),
        availability_date: z.string().optional(), // Required if availability=preorder (ISO 8601)

        // OpenAI Recommended/Optional Fields
        review_count: z.number().optional(),
        review_rating: z.number().optional(),
        related_products: z.array(z.string()).optional(),
        video_url: z.string().optional(),
        age_group: z.string().optional(),
        model_3d_url: z.string().optional(),
        shipping_info: z.string().optional(),
        sale_price_effective_date: z.string().optional(), // ISO 8601 date range
    }).passthrough().optional(),
    variants: z.array(z.object({
        title: z.string(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        ean: z.string().optional(),
        upc: z.string().optional(),
        inventory_quantity: z.number().optional().default(0),
        manage_inventory: z.boolean().optional().default(true),
        allow_backorder: z.boolean().optional().default(false),
        weight: z.number().optional(),
        length: z.number().optional(),
        height: z.number().optional(),
        width: z.number().optional(),
        hs_code: z.string().optional(),
        origin_country: z.string().optional(),
        material: z.string().optional(),
        options: z.record(z.string()).optional(),
        prices: z.array(z.object({
            amount: z.number(),
            currency_code: z.string(),
            min_quantity: z.number().optional(),
            max_quantity: z.number().optional(),
        })).optional(),
        metadata: z.object({
            mpn: z.string().optional(),
            condition: z.enum(["new", "refurbished", "used"]).optional(),
            availability: z.enum(["in_stock", "out_of_stock", "preorder"]).optional(),
            availability_date: z.string().optional(),
        }).passthrough().optional(),
    })).optional(),
    options: z.array(z.object({
        title: z.string(),
        values: z.array(z.string()),
    })).optional(),
}).strict()

type CreateProductRequestBody = z.infer<typeof PostVendorProductCreateSchema>

// POST /vendors/products - Create a new product
export const POST = async (
    req: AuthenticatedMedusaRequest<CreateProductRequestBody>,
    res: MedusaResponse
) => {
    // Ensure the request is authenticated as a vendor
    if (!req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Unauthorized: No vendor authenticated"
        )
    }

    const productData = req.validatedBody

    // Create product using workflow
    const { result } = await createVendorProductWorkflow(req.scope).run({
        input: {
            vendor_admin_id: req.auth_context.actor_id,
            product: productData,
        },
    })

    res.status(201).json({
        product: result.product,
    })
}

// GET /vendors/products - List all products for authenticated vendor
export const GET = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    // Ensure the request is authenticated as a vendor
    if (!req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Unauthorized: No vendor authenticated"
        )
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Get vendor admin and their vendor
    const { data: [vendorAdmin] } = await query.graph({
        entity: "vendor_admin",
        fields: ["vendor.id"],
        filters: {
            id: [req.auth_context.actor_id],
        },
    })

    if (!vendorAdmin) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "Vendor not found"
        )
    }

    // Get pagination params
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    // Query vendor with linked products using remote link
    const { data: vendors } = await query.graph({
        entity: "vendor",
        fields: [
            "products.*",
            "products.variants.*",
            "products.variants.prices.*",
            "products.images.*",
            "products.options.*",
        ],
        filters: {
            id: [vendorAdmin.vendor.id],
        },
        pagination: {
            skip: offset,
            take: limit,
        },
    })

    // Get total count without pagination
    const { data: vendorForCount } = await query.graph({
        entity: "vendor",
        fields: ["products.id"],
        filters: {
            id: [vendorAdmin.vendor.id],
        },
    })

    const products = vendors[0]?.products || []
    const totalCount = vendorForCount[0]?.products?.length || 0

    res.json({
        products,
        count: products.length,
        total: totalCount,
        offset,
        limit,
    })
}

// DELETE /vendors/products - Delete all products for authenticated vendor
export const DELETE = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    // Ensure the request is authenticated as a vendor
    if (!req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Unauthorized: No vendor authenticated"
        )
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Get vendor admin and their vendor
    const { data: [vendorAdmin] } = await query.graph({
        entity: "vendor_admin",
        fields: ["vendor.id"],
        filters: {
            id: [req.auth_context.actor_id],
        },
    })

    if (!vendorAdmin) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "Vendor not found"
        )
    }

    // Query vendor with all linked products (including soft-deleted)
    console.log(`[Delete Products] Querying products for vendor: ${vendorAdmin.vendor.id}`)

    const { data: vendors } = await query.graph({
        entity: "vendor",
        fields: ["products.id", "products.deleted_at"],
        filters: {
            id: [vendorAdmin.vendor.id],
        },
    })

    console.log(`[Delete Products] Query result:`, {
        vendorsFound: vendors.length,
        firstVendor: vendors[0] ? {
            hasProducts: !!vendors[0].products,
            productsType: typeof vendors[0].products,
            productsLength: vendors[0].products?.length,
        } : null
    })

    const products = vendors[0]?.products || []

    console.log(`[Delete Products] Found ${products.length} products`)

    if (products.length === 0) {
        return res.json({
            message: "No products to delete",
            deleted_count: 0,
        })
    }

    // Delete products in batches to avoid database timeout
    const { deleteProductsWorkflow } = await import("@medusajs/medusa/core-flows")
    const BATCH_SIZE = 50
    const productIds = products.map((p: any) => p.id)
    let deletedCount = 0

    console.log(`[Delete Products] Starting deletion of ${productIds.length} products in batches of ${BATCH_SIZE}`)

    // Process in batches
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
        const batch = productIds.slice(i, i + BATCH_SIZE)
        console.log(`[Delete Products] Deleting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(productIds.length / BATCH_SIZE)} (${batch.length} products)`)

        try {
            await deleteProductsWorkflow(req.scope).run({
                input: {
                    ids: batch,
                },
            })
            deletedCount += batch.length
            console.log(`[Delete Products] Successfully deleted ${deletedCount}/${productIds.length} products`)
        } catch (error) {
            console.error(`[Delete Products] Failed to delete batch:`, error)
            // Continue with next batch even if one fails
        }
    }

    console.log(`[Delete Products] Completed deletion. Total deleted: ${deletedCount}`)

    res.json({
        message: `Deleted ${deletedCount} of ${products.length} products successfully`,
        deleted_count: deletedCount,
    })
}
