import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import updateVendorProductWorkflow from "../../../../workflows/marketplace/update-vendor-product"
import deleteVendorProductWorkflow from "../../../../workflows/marketplace/delete-vendor-product"

// Validation schema for updating a product
export const PostVendorProductUpdateSchema = z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    handle: z.string().optional(),
    is_giftcard: z.boolean().optional(),
    discountable: z.boolean().optional(),
    status: z.enum(["draft", "proposed", "published", "rejected"]).optional(),
    weight: z.number().optional(),
    length: z.number().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    hs_code: z.string().optional(),
    origin_country: z.string().optional(),
    material: z.string().optional(),
    thumbnail: z.string().optional(),
    images: z.array(z.object({
        id: z.string().optional(),
        url: z.string(),
    })).optional(),
    metadata: z.object({
        // OpenAI Required Flags (defaults to true if not specified)
        enable_search: z.boolean().optional(),
        enable_checkout: z.boolean().optional(),

        // OpenAI Required Fields
        brand: z.string().optional(),
        mpn: z.string().optional(),
        return_policy_url: z.string().url().optional(),

        // OpenAI Conditional Fields
        condition: z.enum(["new", "refurbished", "used"]).optional(),
        availability: z.enum(["in_stock", "out_of_stock", "preorder"]).optional(),
        availability_date: z.string().optional(),

        // OpenAI Recommended/Optional Fields
        review_count: z.number().optional(),
        review_rating: z.number().optional(),
        related_products: z.array(z.string()).optional(),
        video_url: z.string().optional(),
        age_group: z.string().optional(),
        model_3d_url: z.string().optional(),
        shipping_info: z.string().optional(),
        sale_price_effective_date: z.string().optional(),
    }).passthrough().optional(),
    variants: z.array(z.object({
        id: z.string().optional(),
        title: z.string().optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        ean: z.string().optional(),
        upc: z.string().optional(),
        inventory_quantity: z.number().optional(),
        manage_inventory: z.boolean().optional(),
        allow_backorder: z.boolean().optional(),
        weight: z.number().optional(),
        length: z.number().optional(),
        height: z.number().optional(),
        width: z.number().optional(),
        hs_code: z.string().optional(),
        origin_country: z.string().optional(),
        material: z.string().optional(),
        options: z.record(z.string()).optional(),
        prices: z.array(z.object({
            id: z.string().optional(),
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
        id: z.string().optional(),
        title: z.string(),
        values: z.array(z.string()).optional(),
    })).optional(),
}).strict()

type UpdateProductRequestBody = z.infer<typeof PostVendorProductUpdateSchema>

// GET /vendors/products/:id - Get a single product
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

    const productId = req.params.id
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

    // Get product and verify ownership
    const { data: [product] } = await query.graph({
        entity: "product",
        fields: [
            "*",
            "variants.*",
            "variants.calculated_price.*",
            "images.*",
            "options.*",
            "options.values.*",
            "vendor.*",
        ],
        filters: {
            id: [productId],
        },
    })

    if (!product) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "Product not found"
        )
    }

    // Verify the product belongs to this vendor
    if (product.vendor?.id !== vendorAdmin.vendor.id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "You do not have permission to view this product"
        )
    }

    res.json({
        product,
    })
}

// POST /vendors/products/:id - Update a product
export const POST = async (
    req: AuthenticatedMedusaRequest<UpdateProductRequestBody>,
    res: MedusaResponse
) => {
    // Ensure the request is authenticated as a vendor
    if (!req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Unauthorized: No vendor authenticated"
        )
    }

    const productId = req.params.id
    const productData = req.validatedBody

    // Update product using workflow
    const { result } = await updateVendorProductWorkflow(req.scope).run({
        input: {
            vendor_admin_id: req.auth_context.actor_id,
            product_id: productId,
            product: productData,
        },
    })

    res.json({
        product: result.product,
    })
}

// DELETE /vendors/products/:id - Delete a product
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

    const productId = req.params.id

    // Delete product using workflow
    const { result } = await deleteVendorProductWorkflow(req.scope).run({
        input: {
            vendor_admin_id: req.auth_context.actor_id,
            product_id: productId,
        },
    })

    res.json({
        deleted: result.deleted,
        id: result.id,
    })
}
