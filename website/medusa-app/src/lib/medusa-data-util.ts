/**
 * Medusa Product Data Utilities
 * Transforms Shopify products to Medusa format for ACP compliance checking
 */

/**
 * Type definitions for Medusa products
 */
export type MedusaProductInput = {
    title: string
    subtitle?: string
    description?: string
    handle?: string
    is_giftcard?: boolean
    discountable?: boolean
    status: "draft" | "proposed" | "published" | "rejected"
    thumbnail?: string
    images?: Array<{ url: string }>
    metadata?: Record<string, unknown>
    options?: Array<{
        title: string
        values: string[]
    }>
    variants: Array<MedusaVariantInput>
}

/**
 * Type definitions for Medusa shipping/fulfillment
 * Maps to Shipping Option, Service Zone, and Shipping Option Type
 */
export type MedusaShippingInput = {
    // Service Zone - represents country/region
    service_zone: {
        name: string
        geo_zones: Array<{
            country_code: string // 2-letter country code (e.g., 'US')
            province_code?: string // Province/state code (e.g., 'CA')
        }>
    }
    // Shipping Option Type - represents service_class
    shipping_option_type: {
        label: string // Service class label (e.g., 'Overnight', 'Standard')
        description?: string
        code: string // Unique service class code
    }
    // Shipping Option - links service zone, type, and price
    shipping_option: {
        name: string
        service_zone_id: string
        shipping_option_type_id: string
        prices: Array<{
            currency_code: string // e.g., 'usd'
            amount: number // Price in cents (e.g., 1600 for $16.00)
        }>
        data?: {
            earliest_delivery_days?: number
            latest_delivery_days?: number
            carrier?: string
        }
    }
}

/**
 * Combined Medusa input type for products with fulfillment
 */
export type MedusaTable = { product: MedusaProductInput } & { fulfillment?: MedusaShippingInput }

export type MedusaVariantInput = {
    title?: string
    sku?: string
    barcode?: string
    ean?: string
    upc?: string
    inventory_quantity?: number
    manage_inventory?: boolean
    allow_backorder?: boolean
    weight?: number
    length?: number
    height?: number
    width?: number
    material?: string
    options?: Record<string, string>
    prices: Array<{
        currency_code: string
        amount: number
        rules?: {
            region_id?: string
            [key: string]: any
        }
    }>
    metadata?: Record<string, unknown>
}

/**
 * Convert Shopify price string to Medusa price amount in cents
 * @param priceString - Shopify price as string (e.g., "119.99")
 * @returns Price in cents (e.g., 11999)
 */
export function convertShopifyPriceToMedusaAmount(priceString: string): number {
    return Math.round(parseFloat(priceString) * 100)
}

/**
 * Transform Shopify GraphQL product to Medusa product input format
 * This mimics exactly what the import API creates in the database
 */
import type { ShopifyProduct, ShopifyShop } from "./shopify-data-util"
import {
    stripHtml,
    convertWeightToGrams,
    extractProductOptions,
    getInventoryQuantity,
} from "./shopify-data-util"

export function transformShopifyToMedusa(
    shopifyProduct: ShopifyProduct,
    shopifyShop?: ShopifyShop
): MedusaTable {
    console.log(`[Shopify→Medusa Transform] Product: ${shopifyProduct.title}`)
    console.log(`[Shopify→Medusa Transform] Variant count: ${shopifyProduct.variants?.length || 0}`)

    // Extract brand from tags (common pattern: "Brand:Nike")
    let brand: string | undefined
    if (shopifyProduct.tags) {
        const brandTag = Array.isArray(shopifyProduct.tags)
            ? shopifyProduct.tags.find(tag => tag.toLowerCase().startsWith('brand'))
            : undefined
        if (brandTag) {
            brand = brandTag.split(':')[1]?.trim() || brandTag
        }
    }

    // Extract material from tags (pattern: "Material:Cotton")
    let material: string | undefined
    if (shopifyProduct.tags) {
        const materialTag = Array.isArray(shopifyProduct.tags)
            ? shopifyProduct.tags.find(tag => tag.toLowerCase().includes('material'))
            : undefined
        if (materialTag) {
            material = materialTag.split(':')[1]?.trim() || materialTag
        }
    }

    // Map images
    const images = shopifyProduct.images?.map((img) => ({
        url: img.url,
    })) || []

    // Extract product options from variants
    const productOptions = extractProductOptions(shopifyProduct)

    // Handle tags - can be array or string
    let tagsString: string | undefined
    if (shopifyProduct.tags) {
        if (Array.isArray(shopifyProduct.tags)) {
            tagsString = shopifyProduct.tags.join(", ")
        } else if (typeof shopifyProduct.tags === 'string') {
            tagsString = shopifyProduct.tags
        }
    }

    // Process shipping rates from shop data if available
    let shipping: string | undefined
    if (shopifyShop?.shippingRates && Array.isArray(shopifyShop.shippingRates) && shopifyShop.shippingRates.length > 0) {
        // Use the first shipping rate as the primary shipping method
        // Format is already "country:region:service_class:price"
        shipping = shopifyShop.shippingRates[0]
    }

    return {
        product: {
            title: shopifyProduct.title,
            subtitle: undefined,
            description: shopifyProduct.descriptionHtml
                ? stripHtml(shopifyProduct.descriptionHtml)
                : shopifyProduct.description || shopifyProduct.title,
            handle: shopifyProduct.handle,
            status: "published",
            thumbnail: shopifyProduct.featuredImage?.url || images[0]?.url,
            images,
            metadata: {
                shopify_id: shopifyProduct.id,
                product_type: shopifyProduct.productType,
                tags: tagsString,
                total_inventory: shopifyProduct.totalInventory,
                brand,
                material,
            },
            options: productOptions,
            variants: shopifyProduct.variants?.map((variant) => {

                console.log(`[Variant Transform] Processing variant:`, {
                    id: variant.id,
                    title: variant.title,
                    sku: variant.sku,
                    has_inventory: !!variant.inventoryItem,
                })

                // Parse price
                const priceAmount = convertShopifyPriceToMedusaAmount(variant.price)

                // Get inventory quantity
                const inventoryQuantity = getInventoryQuantity(variant)

                // Get weight in grams
                const weight = convertWeightToGrams(
                    variant.inventoryItem?.measurement?.weight?.value,
                    variant.inventoryItem?.measurement?.weight?.unit
                )

                // Debug: Log weight extraction
                console.log(`[Weight Extraction] Variant: ${variant.title}, Raw weight: ${variant.inventoryItem?.measurement?.weight?.value} ${variant.inventoryItem?.measurement?.weight?.unit}, Converted: ${weight}g`)

                // Build variant options from selectedOptions
                const variantOptions: Record<string, string> = {}
                variant.selectedOptions?.forEach((opt) => {
                    variantOptions[opt.name] = opt.value
                })

                // Debug: Log SKU extraction
                console.log(`[SKU Extraction] Variant ID: ${variant.id}, Raw SKU: "${variant.sku}", Processed SKU: "${variant.sku || undefined}"`)

                return {
                    title: variant.title || "Default Title",
                    sku: variant.sku || undefined,
                    barcode: variant.barcode || undefined,
                    ean: variant.barcode || undefined,
                    weight,
                    inventory_quantity: inventoryQuantity,
                    manage_inventory: variant.inventoryItem?.tracked !== false,
                    allow_backorder: false,
                    metadata: {
                        shopify_variant_id: variant.id,
                        shopify_inventory_item_id: variant.inventoryItem?.id,
                    },
                    options: variantOptions,
                    prices: [
                        {
                            currency_code: "usd",
                            amount: priceAmount,
                            // Note: region_id would be added during actual import
                            // For compliance checking, we assume it's present
                        },
                    ],
                }
            }) || [],
        }

    }
}

/**
 * Validate that a Medusa product has all critical fields for checkout
 */
export function validateMedusaProductForCheckout(product: MedusaProductInput): {
    isValid: boolean
    errors: string[]
    warnings: string[]
} {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required product fields
    if (!product.title) {
        errors.push("Product title is required")
    }

    if (!product.variants || product.variants.length === 0) {
        errors.push("Product must have at least one variant")
    }

    // Check variant fields
    product.variants?.forEach((variant, index) => {
        // Check prices
        if (!variant.prices || variant.prices.length === 0) {
            errors.push(`Variant ${index + 1}: At least one price is required`)
        } else {
            variant.prices.forEach((price, priceIndex) => {
                if (!price.currency_code) {
                    errors.push(`Variant ${index + 1}, Price ${priceIndex + 1}: currency_code is required`)
                }
                if (price.amount === undefined || price.amount === null) {
                    errors.push(`Variant ${index + 1}, Price ${priceIndex + 1}: amount is required`)
                }
                if (!price.rules?.region_id) {
                    errors.push(
                        `Variant ${index + 1}, Price ${priceIndex + 1}: region_id in rules is CRITICAL for storefront display`
                    )
                }
            })
        }

        // Warnings for missing optional but recommended fields
        if (!variant.sku) {
            warnings.push(`Variant ${index + 1}: SKU not provided (recommended for inventory tracking)`)
        }
        if (!variant.barcode && !variant.ean && !variant.upc) {
            warnings.push(
                `Variant ${index + 1}: No barcode/EAN/UPC provided (recommended for product identification)`
            )
        }
        if (variant.inventory_quantity === undefined) {
            warnings.push(`Variant ${index + 1}: inventory_quantity not set (inventory item won't be auto-created)`)
        }
        if (!variant.weight) {
            warnings.push(`Variant ${index + 1}: Weight not provided (may affect shipping calculations)`)
        }
    })

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    }
}
