import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/core-flows"
import {
    ShopifyImportSchema,
    type ShopifyProduct,
    stripHtml,
    convertWeightToGrams,
    extractProductOptions,
    getInventoryQuantity,
} from "../../../../lib/shopify-data-util"
import { convertShopifyPriceToMedusaAmount } from "../../../../lib/medusa-data-util"

/**
 * POST /import/products/shopify
 * Import products from Shopify JSON
 *
 * This endpoint is accessible by both admin users and vendors.
 * - Admin users: Products are created without vendor association
 * - Vendors: Products are automatically linked to the authenticated vendor
 *
 * Accepts Shopify product data in flat format: { products: [...], shop_info: {...} }
 */
export const POST = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    console.log('[Shopify Import] Starting import request', {
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

    // Determine if user is a vendor by trying to query vendor_admin
    // If vendor_admin exists, this is a vendor; otherwise it's an admin user
    let vendorId: string | null = null

    const { data: vendorAdmins } = await query.graph({
        entity: "vendor_admin",
        fields: ["vendor.id"],
        filters: {
            id: [req.auth_context.actor_id],
        },
    })

    if (vendorAdmins && vendorAdmins.length > 0) {
        // This is a vendor
        vendorId = vendorAdmins[0].vendor.id
        console.log('[Shopify Import] Vendor authenticated:', { vendor_id: vendorId })
    } else {
        // This is an admin user
        console.log('[Shopify Import] Admin user authenticated')
    }

    try {
        // Parse request body - expecting Shopify data in flat format
        const jsonData: any = req.body

        // Validate using flat schema
        const validatedData = ShopifyImportSchema.parse(jsonData)
        const products: ShopifyProduct[] = validatedData.products

        console.log('[Shopify Import] Validated data:', {
            product_count: products.length,
            vendor_id: vendorId,
        })

        // Get regions to link prices properly
        const { data: regions } = await query.graph({
            entity: "region",
            fields: ["id", "name", "currency_code"],
        })

        // Find US region (or default region)
        const usRegion = regions.find((r: any) => r.currency_code === "usd")
        if (!usRegion) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "No USD region found. Please create a US region in Medusa Admin first."
            )
        }

        console.log('[Shopify Import] Using region for price rules:', {
            region_id: usRegion.id,
            region_name: usRegion.name,
            currency: usRegion.currency_code,
        })

        const results = {
            success: [] as string[],
            failed: [] as { product: string; error: string }[],
        }

        // Get product module to check for existing products
        const productModuleService = req.scope.resolve(Modules.PRODUCT)

        // Get inventory and stock location modules
        const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)
        const stockLocationModule = req.scope.resolve(Modules.STOCK_LOCATION)

        // Get remote link service (only needed for vendors)
        const remoteLink = vendorId ? req.scope.resolve("remoteLink") : null

        // Process each product
        for (const shopifyProduct of products) {

            try {
                // Check if product with this handle already exists
                const existingProducts = await productModuleService.listProducts({
                    handle: shopifyProduct.handle,
                })

                if (existingProducts.length > 0) {
                    console.log('[Shopify Import] Product with handle already exists, skipping:', {
                        title: shopifyProduct.title,
                        handle: shopifyProduct.handle,
                    })
                    results.failed.push({
                        product: shopifyProduct.title,
                        error: `Product with handle "${shopifyProduct.handle}" already exists. Please delete the existing product first or use a different handle.`,
                    })
                    continue
                }

                // Extract unique product options from variants using utility function
                const productOptions = extractProductOptions(shopifyProduct)

                // Map images
                const images = shopifyProduct.images?.map((img) => ({
                    url: img.url,
                })) || []

                // Map Shopify GraphQL product to Medusa format
                const medusaProduct = {
                    title: shopifyProduct.title,
                    subtitle: undefined,
                    description: shopifyProduct.descriptionHtml
                        ? stripHtml(shopifyProduct.descriptionHtml)
                        : shopifyProduct.description || shopifyProduct.title,
                    handle: shopifyProduct.handle,
                    is_giftcard: false,
                    discountable: true,
                    status: "published" as "draft" | "proposed" | "published" | "rejected",
                    thumbnail: shopifyProduct.featuredImage?.url || images[0]?.url,
                    images,
                    metadata: {
                        shopify_id: shopifyProduct.id,
                        product_type: shopifyProduct.productType,
                        tags: shopifyProduct.tags?.join(", "),
                        total_inventory: shopifyProduct.totalInventory,
                    },
                    options: productOptions,
                    variants: shopifyProduct.variants?.map((variant) => {

                        // Parse price using utility function
                        const priceAmount = convertShopifyPriceToMedusaAmount(variant.price)

                        // Get inventory quantity using utility function
                        const inventoryQuantity = getInventoryQuantity(variant)

                        // Get weight from inventory item
                        const weight = convertWeightToGrams(
                            variant.inventoryItem?.measurement?.weight?.value,
                            variant.inventoryItem?.measurement?.weight?.unit
                        )

                        // Build variant options object
                        const variantOptions: Record<string, string> = {}
                        variant.selectedOptions?.forEach((opt) => {
                            variantOptions[opt.name] = opt.value
                        })

                        return {
                            title: variant.title || "Default Title",
                            sku: variant.sku || undefined,
                            barcode: variant.barcode || undefined,
                            ean: variant.barcode || undefined,
                            // Set inventory_quantity to create inventory items
                            inventory_quantity: inventoryQuantity,
                            manage_inventory: variant.inventoryItem?.tracked !== false,
                            allow_backorder: false,
                            weight,
                            metadata: {
                                shopify_variant_id: variant.id,
                                shopify_inventory_item_id: variant.inventoryItem?.id,
                            },
                            options: variantOptions,
                            prices: [
                                {
                                    currency_code: "usd",
                                    amount: priceAmount,
                                    // Add region_id rule so products display in storefront
                                    rules: {
                                        region_id: usRegion.id,
                                    },
                                },
                            ],
                        }
                    }) || [],
                }

                console.log('[Shopify Import] Creating product:', {
                    title: shopifyProduct.title,
                    vendor_id: vendorId,
                    variants_count: medusaProduct.variants.length,
                    total_inventory: medusaProduct.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0),
                })

                // Create product using workflow
                const { result } = await createProductsWorkflow(req.scope).run({
                    input: {
                        products: [medusaProduct],
                    },
                })

                const createdProduct = result[0]
                console.log('[Shopify Import] Product created successfully:', {
                    title: shopifyProduct.title,
                    medusa_product_id: createdProduct?.id,
                })

                // Link product to vendor if this is a vendor import
                if (createdProduct && vendorId && remoteLink) {
                    await remoteLink.create({
                        vendorModuleService: {
                            vendor_id: vendorId,
                        },
                        productModuleService: {
                            product_id: createdProduct.id,
                        },
                    })
                    console.log('[Shopify Import] Product linked to vendor:', {
                        product_id: createdProduct.id,
                        vendor_id: vendorId,
                    })
                }

                // Now handle inventory locations for each variant
                if (createdProduct && shopifyProduct.variants) {
                    for (let i = 0; i < shopifyProduct.variants.length; i++) {
                        const shopifyVariant = shopifyProduct.variants[i]
                        const createdVariant = createdProduct.variants?.[i]

                        if (!createdVariant || !shopifyVariant.inventoryItem?.inventoryLevels) {
                            continue
                        }

                        // Process each inventory location from Shopify
                        for (const level of shopifyVariant.inventoryItem.inventoryLevels) {
                            const shopifyLocation = level.location
                            const locationName = shopifyLocation.name

                            // Check if stock location exists
                            let stockLocation = await stockLocationModule.listStockLocations({
                                name: locationName,
                            })

                            // Create stock location if it doesn't exist
                            if (!stockLocation || stockLocation.length === 0) {
                                console.log('[Shopify Import] Creating stock location:', {
                                    name: locationName,
                                })
                                const newLocation = await stockLocationModule.createStockLocations({
                                    name: locationName,
                                    address: shopifyLocation.address?.zip ? {
                                        address_1: locationName,
                                        country_code: "US",
                                        postal_code: shopifyLocation.address.zip,
                                    } : undefined,
                                })
                                stockLocation = [newLocation]
                            }

                            const locationId = stockLocation[0].id

                            // Get the inventory item for this variant
                            const inventoryItems = createdVariant.sku
                                ? await inventoryModuleService.listInventoryItems({
                                    sku: createdVariant.sku,
                                })
                                : []

                            if (inventoryItems.length === 0) {
                                console.warn('[Shopify Import] No inventory item found for variant:', {
                                    variant_id: createdVariant.id,
                                    sku: createdVariant.sku,
                                })
                                continue
                            }

                            const inventoryItemId = inventoryItems[0].id

                            // Get quantity from Shopify data
                            const onHandQty = level.quantities.find(q => q.name === "on_hand")
                            const quantity = onHandQty?.quantity || 0

                            // Create or update inventory level
                            console.log('[Shopify Import] Setting inventory level:', {
                                inventory_item_id: inventoryItemId,
                                location_id: locationId,
                                quantity: quantity,
                            })

                            await inventoryModuleService.createInventoryLevels({
                                inventory_item_id: inventoryItemId,
                                location_id: locationId,
                                stocked_quantity: quantity,
                            })
                        }
                    }
                }

                results.success.push(shopifyProduct.title)
            } catch (error) {
                // Log detailed error for debugging
                console.error('[Shopify Import] Product creation failed:', {
                    product: shopifyProduct.title,
                    vendor_id: vendorId,
                    error: error instanceof Error ? {
                        message: error.message,
                        stack: error.stack,
                        name: error.name,
                    } : error,
                })

                results.failed.push({
                    product: shopifyProduct.title,
                    error: error instanceof Error ? error.message : JSON.stringify(error),
                })
            }
        }

        res.json({
            message: `Imported ${results.success.length} products successfully, ${results.failed.length} failed`,
            success: results.success,
            failed: results.failed,
            total: products.length,
        })
    } catch (error) {
        if (error instanceof MedusaError) {
            throw error
        }
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            error instanceof Error ? error.message : "Failed to process import request"
        )
    }
}
