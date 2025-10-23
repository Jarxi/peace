import {
    createWorkflow,
    WorkflowResponse,
    transform,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type WorkflowInput = {
    vendor_admin_id?: string
    base_url: string // Base URL for generating product links
}

type OpenAIProduct = {
    // Basic Product Data (Required)
    id: string                        // Merchant product ID (variant SKU) - Max 100 chars
    gtin?: string                     // Universal product identifier - 8-14 digits
    mpn?: string                      // Manufacturer part number - Max 70 chars (required if gtin missing)
    title: string                     // Product title - Max 150 chars
    description: string               // Full product description - Max 5000 chars
    link: string                      // Product detail page URL

    // Item Information
    condition?: "new" | "refurbished" | "used"  // Required if not new
    product_category: string          // Category path with ">" separator (Required)
    brand: string                     // Product brand - Max 70 chars (Required for most)
    material?: string                 // Primary material - Max 100 chars (Required)
    dimensions?: string               // LxWxH format (Optional)
    length?: string                   // Individual dimension with unit (Optional)
    width?: string                    // Individual dimension with unit (Optional)
    height?: string                   // Individual dimension with unit (Optional)
    weight: string                    // Product weight with unit (Required)
    age_group?: "newborn" | "infant" | "toddler" | "kids" | "adult"

    // Availability & Inventory (Required)
    availability: "in_stock" | "out_of_stock" | "preorder"
    availability_date?: string        // ISO 8601 - Required if preorder
    inventory_quantity: number        // Non-negative integer (Required)
    expiration_date?: string          // ISO 8601 (Optional)
    pickup_method?: "in_store" | "reserve" | "not_supported"
    pickup_sla?: string              // e.g., "1 day"

    // Variants (Required if variants exist)
    item_group_id: string             // Variant group ID - Max 70 chars
    item_group_title?: string         // Group product title - Max 150 chars
    color?: string                    // Variant color - Max 40 chars (Recommended for apparel)
    size?: string                     // Variant size - Max 20 chars (Recommended for apparel)
    size_system?: string              // ISO 3166 2-letter country code (Recommended for apparel)
    gender?: "male" | "female" | "unisex"  // Gender target (Recommended for apparel)
    offer_id?: string                 // Offer ID (SKU+seller+price) - Unique within feed
    custom_variant1_category?: string
    custom_variant1_option?: string
    custom_variant2_category?: string
    custom_variant2_option?: string
    custom_variant3_category?: string
    custom_variant3_option?: string

    // Pricing (from other sections - assuming these exist)
    price?: string
    sale_price?: string

    // Images (from other sections - assuming these exist)
    image_link?: string
    additional_image_link?: string[]

    // Seller Info (from other sections - assuming these exist)
    seller_name?: string
    seller_url?: string
    seller_privacy_policy?: string
    return_policy?: string

    // Additional fields from implementation
    enable_search?: "true" | "false"
    enable_checkout?: "true" | "false"
    review_count?: number
    review_rating?: number
    related_products?: string[]
    video_url?: string
    shipping?: string
    model_3d_link?: string
}

// Step to retrieve and format products for OpenAI feed
const exportOpenAIFeedStep = createStep(
    "export-openai-feed",
    async (
        { vendor_admin_id, base_url }: { vendor_admin_id?: string; base_url: string },
        { container }
    ) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)

        let vendorId: string | undefined

        // If vendor_admin_id is provided, get the vendor ID
        if (vendor_admin_id) {
            const { data: [vendorAdmin] } = await query.graph({
                entity: "vendor_admin",
                fields: ["vendor.id"],
                filters: {
                    id: [vendor_admin_id],
                },
            })

            vendorId = vendorAdmin?.vendor?.id
        }

        // Build filters for products
        const filters: any = {
            status: ["published"], // Only export published products
        }

        // Query products with all necessary relations
        const { data: products } = await query.graph({
            entity: "product",
            fields: [
                "*",
                "variants.*",
                "variants.calculated_price.*",
                "images.*",
                "options.*",
                "vendor.*", // Get vendor for seller info
            ],
            filters: vendorId
                ? {
                      ...filters,
                      vendor: {
                          id: [vendorId],
                      },
                  }
                : filters,
        })

        // Transform products to OpenAI commerce feed format
        const openaiProducts: OpenAIProduct[] = products.flatMap((product: any) => {
            // If product has no variants, skip it
            if (!product.variants || product.variants.length === 0) {
                return []
            }

            // Create one feed entry per variant
            return product.variants.map((variant: any) => {
                // Determine availability based on inventory (OpenAI only supports 3 values)
                let availability: "in_stock" | "out_of_stock" | "preorder" = "in_stock"
                let availability_date: string | undefined

                // Check for preorder in metadata
                if (product.metadata?.availability === "preorder" || variant.metadata?.availability === "preorder") {
                    availability = "preorder"
                    availability_date = product.metadata?.availability_date || variant.metadata?.availability_date
                } else if (variant.manage_inventory && variant.inventory_quantity === 0 && !variant.allow_backorder) {
                    availability = "out_of_stock"
                }

                // Get variant options (color, size, etc.)
                const variantOptions: Record<string, string> = {}
                if (variant.options) {
                    variant.options.forEach((opt: any) => {
                        if (opt.option?.title && opt.value) {
                            variantOptions[opt.option.title.toLowerCase()] = opt.value
                        }
                    })
                }

                // Build product link and sanitize description
                const productLink =
                    variant.metadata?.variant_url ||
                    product.metadata?.product_url ||
                    `${base_url}/products/${product.handle}`

                const rawDescription = product.description || product.metadata?.description || product.title || ""
                const description = rawDescription
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 5000)

                // Get price from variant (required)
                const price = variant.calculated_price?.calculated_amount
                    ? `${(variant.calculated_price.calculated_amount / 100).toFixed(2)} ${variant.calculated_price.currency_code?.toUpperCase() || "USD"}`
                    : "0.00 USD"

                // Get sale price if different from regular price
                const sale_price =
                    variant.calculated_price?.original_amount &&
                    variant.calculated_price?.calculated_amount !== variant.calculated_price?.original_amount
                        ? `${(variant.calculated_price.original_amount / 100).toFixed(2)} ${variant.calculated_price.currency_code?.toUpperCase() || "USD"}`
                        : undefined

                // OpenAI flags (default to true if not specified)
                const enable_search = product.metadata?.enable_search === false ? "false" : "true"
                const enable_checkout = product.metadata?.enable_checkout === false ? "false" : "true"

                // Get seller info from vendor (required)
                const seller_name = product.vendor?.name || "Unknown Seller"
                const sellerHandle = product.vendor?.handle || "store"
                const seller_url = `${base_url}/vendors/${sellerHandle}`
                const seller_privacy_policy = `${seller_url}/privacy`
                const return_policy = `${seller_url}/returns`

                // Brand (required for most products)
                const brandValue = product.metadata?.brand || product.vendor?.name || "Generic"
                const brand = String(brandValue).slice(0, 70)

                // Condition (default to new)
                const condition = (product.metadata?.condition || variant.metadata?.condition || "new") as
                    | "new"
                    | "refurbished"
                    | "used"

                const productCategoryRaw =
                    product.metadata?.product_category ||
                    product.collection?.title ||
                    product.product_type ||
                    "Uncategorized"
                const product_category = String(productCategoryRaw).slice(0, 150)

                const materialRaw =
                    variant.metadata?.material ||
                    product.metadata?.material ||
                    "Unknown"
                const material = String(materialRaw).slice(0, 100)

                const itemGroupTitle = product.metadata?.item_group_title || product.title
                const item_group_title = itemGroupTitle ? String(itemGroupTitle).slice(0, 150) : undefined

                const colorRaw = variantOptions.color || variantOptions.colour
                const color = colorRaw ? colorRaw.slice(0, 40) : undefined

                const sizeRaw = variantOptions.size
                const size = sizeRaw ? sizeRaw.slice(0, 20) : undefined

                const widthOptionRaw = variantOptions.width
                const widthOption = widthOptionRaw ? widthOptionRaw.slice(0, 20) : undefined

                const age_group = (product.metadata?.age_group || variant.metadata?.age_group)?.toLowerCase()

                const sizeSystemRaw = product.metadata?.size_system || product.metadata?.sizeSystem
                const size_system = sizeSystemRaw ? String(sizeSystemRaw).toUpperCase() : undefined

                const genderRaw = product.metadata?.gender || variant.metadata?.gender
                const gender = genderRaw ? (String(genderRaw).toLowerCase() as "male" | "female" | "unisex") : undefined

                const offer_id =
                    variant.sku && variant.calculated_price?.calculated_amount
                        ? `${variant.sku}-${variant.calculated_price.currency_code?.toUpperCase() || "USD"}-${variant.calculated_price.calculated_amount}`
                        : variant.sku || variant.id

                const weightValue = variant.weight ?? product.weight ?? 0
                const weight = `${Math.max(weightValue, 1)}g`

                const lengthValue = variant.length ?? product.length
                const widthValue = variant.width ?? product.width
                const heightValue = variant.height ?? product.height

                const hasDimensions = lengthValue || widthValue || heightValue
                const dimensions = hasDimensions ? `${lengthValue ?? 0}x${widthValue ?? 0}x${heightValue ?? 0} mm` : undefined

                const length = lengthValue ? `${lengthValue} mm` : undefined
                const width = widthValue ? `${widthValue} mm` : undefined
                const height = heightValue ? `${heightValue} mm` : undefined

                const additionalImages =
                    product.images?.slice(1).map((img: any) => img.url).filter(Boolean) || undefined

                // Build OpenAI feed entry
                const openaiProduct: Partial<OpenAIProduct> = {
                    // Required OpenAI flags
                    enable_search: enable_search as "true" | "false",
                    enable_checkout: enable_checkout as "true" | "false",

                    // Required basic data
                    id: variant.sku || variant.id,              // Variant-specific ID
                    item_group_id: product.id,                  // Product ID (groups variants)
                    item_group_title,
                    title: variant.title || product.title,      // Variant-specific title
                    description,
                    link: productLink,
                    image_link: product.images?.[0]?.url || product.thumbnail || "",

                    // Required identifiers (mpn OR gtin)
                    mpn: variant.metadata?.mpn || product.metadata?.mpn,
                    gtin: variant.ean || variant.upc || variant.barcode,

                    // Required pricing
                    price,
                    sale_price,

                    // Required availability
                    availability,
                    inventory_quantity: variant.inventory_quantity || 0,
                    availability_date,

                    // Required seller info
                    seller_name,
                    seller_url,
                    seller_privacy_policy: enable_checkout === "true" ? seller_privacy_policy : undefined,

                    // Required policies
                    return_policy,

                    // Required product attributes
                    brand,
                    condition,
                    product_category,
                    material,

                    // Optional/recommended fields
                    weight,
                    additional_image_link: additionalImages,
                    color,
                    size,
                    size_system,
                    gender,
                    review_count: product.metadata?.review_count,
                    review_rating: product.metadata?.review_rating,
                    related_products: product.metadata?.related_products,
                    video_url: product.metadata?.video_url,
                    shipping: product.metadata?.shipping_info,
                    age_group,
                    dimensions,
                    length,
                    width,
                    height,
                    model_3d_link: product.metadata?.model_3d_url,
                    offer_id,
                    custom_variant1_category: widthOption ? "Width" : undefined,
                    custom_variant1_option: widthOption,
                }

                // Remove undefined fields except for required ones
                const filteredProduct = Object.fromEntries(
                    Object.entries(openaiProduct).filter(([key, v]) => {
                        // Keep required fields even if empty
                        const requiredFields = [
                            'enable_search',
                            'enable_checkout',
                            'id',
                            'item_group_id',
                            'title',
                            'description',
                            'link',
                            'image_link',
                            'price',
                            'availability',
                            'inventory_quantity',
                            'seller_name',
                            'seller_url',
                            'return_policy',
                            'brand',
                            'product_category',
                            'material',
                            'weight',
                        ]
                        return v !== undefined || requiredFields.includes(key)
                    })
                ) as OpenAIProduct

                return filteredProduct
            })
        })

        return new StepResponse({
            products: openaiProducts,
            total_count: openaiProducts.length,
        })
    }
)

const exportOpenAIFeedWorkflow = createWorkflow(
    "export-openai-feed",
    (input: WorkflowInput) => {
        const result = exportOpenAIFeedStep({
            vendor_admin_id: input.vendor_admin_id,
            base_url: input.base_url,
        })

        return new WorkflowResponse(result)
    }
)

export default exportOpenAIFeedWorkflow
