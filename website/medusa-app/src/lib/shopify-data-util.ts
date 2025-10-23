import { z } from "zod"

/**
 * Shopify Flat Product Import Schema
 * Defines the expected structure of Shopify product data from database (flat structure, no edges/node wrappers)
 */
export const ShopifyImportSchema = z.object({
    products: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        descriptionHtml: z.string().optional(),
        handle: z.string(),
        productType: z.string().optional(),
        tags: z.array(z.string()).optional(),
        totalInventory: z.number().optional(),
        updatedAt: z.string().optional(),
        featuredImage: z.object({
            url: z.string(),
            altText: z.string().optional().nullable(),
        }).optional().nullable(),
        images: z.array(z.object({
            url: z.string(),
            altText: z.string().optional().nullable(),
        })).optional(),
        variants: z.array(z.object({
            id: z.string(),
            barcode: z.string().optional().nullable(),
            price: z.string(),
            inventoryQuantity: z.number().optional().nullable(),
            inventoryItem: z.object({
                id: z.string(),
                tracked: z.boolean().optional(),
                measurement: z.object({
                    weight: z.object({
                        value: z.number().optional(),
                        unit: z.string().optional(),
                    }).optional(),
                }).optional(),
                inventoryLevels: z.array(z.object({
                    location: z.object({
                        name: z.string(),
                        address: z.object({
                            zip: z.string().optional(),
                        }).optional(),
                    }),
                    quantities: z.array(z.object({
                        name: z.string(),
                        quantity: z.number(),
                    })),
                })).optional(),
            }).optional(),
            selectedOptions: z.array(z.object({
                name: z.string(),
                value: z.string(),
            })).optional(),
            sku: z.string().optional().nullable(),
            title: z.string().optional().nullable(),
        })).optional(),
    })),
    shop_info: z.object({
        contactEmail: z.string().optional(),
        currencyCode: z.string().optional(),
        id: z.string().optional(),
        myshopifyDomain: z.string().optional(),
        name: z.string().optional(),
        url: z.string().optional(),
        shopPolicies: z.array(z.object({
            id: z.string().optional(),
            type: z.string(),
            title: z.string().optional(),
            url: z.string().optional(),
        })).optional(),
        primaryDomain: z.object({
            url: z.string().optional(),
            host: z.string().optional(),
        }).optional(),
        shippingRates: z.array(z.string()).optional(),
    }).optional(),
})

export type ShopifyImportData = z.infer<typeof ShopifyImportSchema>
export type ShopifyProduct = ShopifyImportData["products"][0]
export type ShopifyVariant = NonNullable<ShopifyProduct["variants"]>[0]
export type ShopifyShop = NonNullable<ShopifyImportData["shop_info"]>

/**
 * Required Shopify Product Fields for ACP-Checkout
 * These fields are necessary for proper checkout functionality
 */
export const SHOPIFY_REQUIRED_FIELDS = {
    // Product-level required fields
    product: {
        id: { required: true, description: "Shopify product ID" },
        title: { required: true, description: "Product name" },
        handle: { required: true, description: "URL-friendly slug" },
        description: { required: false, description: "Product description" },
        descriptionHtml: { required: false, description: "HTML description" },
        productType: { required: false, description: "Product category/type" },
        tags: { required: false, description: "Product tags for categorization" },
        featuredImage: { required: false, description: "Primary product image" },
        images: { required: false, description: "Additional product images" },
        totalInventory: { required: false, description: "Total stock across locations" },
    },
    // Variant-level required fields
    variant: {
        id: { required: true, description: "Shopify variant ID" },
        price: { required: true, description: "Variant price as string" },
        title: { required: false, description: "Variant title (e.g., 'Small / Red')" },
        sku: { required: false, description: "Stock keeping unit" },
        barcode: { required: false, description: "Barcode/UPC/GTIN" },
        inventoryQuantity: { required: false, description: "Stock quantity" },
        selectedOptions: { required: false, description: "Variant options (size, color, etc.)" },
        inventoryItem: {
            required: false,
            description: "Inventory tracking data",
            fields: {
                id: { required: true, description: "Inventory item ID" },
                tracked: { required: false, description: "Whether inventory is tracked" },
                measurement: {
                    required: false,
                    description: "Product measurements",
                    fields: {
                        weight: {
                            required: false,
                            description: "Weight data",
                            fields: {
                                value: { required: false, description: "Weight value" },
                                unit: { required: false, description: "Weight unit (POUNDS, OUNCES, KILOGRAMS, GRAMS)" },
                            },
                        },
                    },
                },
                inventoryLevels: {
                    required: false,
                    description: "Multi-location inventory",
                    fields: {
                        location: {
                            required: true,
                            description: "Stock location",
                            fields: {
                                name: { required: true, description: "Location name" },
                                address: { required: false, description: "Location address" },
                            },
                        },
                        quantities: {
                            required: true,
                            description: "Quantity by type",
                            fields: {
                                name: { required: true, description: "Quantity type (on_hand, available, etc.)" },
                                quantity: { required: true, description: "Quantity value" },
                            },
                        },
                    },
                },
            },
        },
    },
} as const

/**
 * Helper function to strip HTML tags from description
 */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * Helper function to convert weight to grams
 */
export function convertWeightToGrams(value?: number, unit?: string): number | undefined {
    if (!value) return undefined

    switch (unit?.toUpperCase()) {
        case "POUNDS":
        case "LB":
        case "LBS":
            return Math.round(value * 453.592) // Convert pounds to grams
        case "OUNCES":
        case "OZ":
            return Math.round(value * 28.3495) // Convert ounces to grams
        case "KILOGRAMS":
        case "KG":
            return Math.round(value * 1000) // Convert kg to grams
        case "GRAMS":
        case "G":
        default:
            return Math.round(value)
    }
}

/**
 * Extract product options from Shopify variants
 */
export function extractProductOptions(shopifyProduct: ShopifyProduct) {
    const optionMap = new Map<string, Set<string>>()

    if (shopifyProduct.variants) {
        shopifyProduct.variants.forEach((variant) => {
            variant.selectedOptions?.forEach((opt) => {
                if (!optionMap.has(opt.name)) {
                    optionMap.set(opt.name, new Set())
                }
                optionMap.get(opt.name)!.add(opt.value)
            })
        })
    }

    return Array.from(optionMap.entries()).map(([name, values]) => ({
        title: name,
        values: Array.from(values),
    }))
}

/**
 * Get inventory quantity from Shopify variant
 */
export function getInventoryQuantity(variant: ShopifyVariant): number {
    let inventoryQuantity = variant.inventoryQuantity || 0

    if (variant.inventoryItem?.inventoryLevels) {
        // Sum up "on_hand" quantities from all locations
        inventoryQuantity = variant.inventoryItem.inventoryLevels.reduce((sum, level) => {
            const onHandQty = level.quantities.find(q => q.name === "on_hand")
            return sum + (onHandQty?.quantity || 0)
        }, 0)
    }

    return inventoryQuantity
}
