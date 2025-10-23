/**
 * ACP Compliance Data Utilities - Refactored
 *
 * Architecture:
 * 1. Define what each section needs (required/optional fields + values)
 * 2. Define functions to check if field is missing and extract value
 * 3. Display check results and values
 */

import type { ShopifyProduct, ShopifyVariant, ShopifyShop } from "./shopify-data-util"

/**
 * ============================================================================
 * PART 1: Field Definition Structure
 * ============================================================================
 */

type FieldCheck<T> = {
  field: string
  displayName: string
  weight: number
  critical: boolean
  check: (data: T) => boolean
  getValue?: (data: T) => string | string[] | null
}

/**
 * ============================================================================
 * PART 2: Product Fields (required + optional)
 * ============================================================================
 */

const PRODUCT_FIELDS: FieldCheck<ShopifyProduct>[] = [
  {
    field: "id",
    displayName: "Product ID",
    weight: 10,
    critical: true,
    check: (p) => !!p.handle && p.handle.trim().length > 0,
    getValue: (p) => p.handle,
  },
  {
    field: "title",
    displayName: "Product Title",
    weight: 10,
    critical: true,
    check: (p) => !!p.title && p.title.trim().length > 0 && p.title.length <= 150,
    getValue: (p) => p.title,
  },
  {
    field: "description",
    displayName: "Product Description",
    weight: 10,
    critical: true,
    check: (p) => {
      const description = p.descriptionHtml || p.description
      return !!description && description.trim().length > 0 && description.length <= 5000
    },
    getValue: (p) => p.descriptionHtml || p.description || null,
  },
  {
    field: "link",
    displayName: "Product Link",
    weight: 8,
    critical: true,
    check: (p) => !!p.handle,
    getValue: (p) => p.handle,
  },
  {
    field: "product_category",
    displayName: "Product Category",
    weight: 10,
    critical: true,
    check: (p) => !!p.productType && p.productType.trim().length > 0,
    getValue: (p) => p.productType || null,
  },
  {
    field: "brand",
    displayName: "Brand",
    weight: 8,
    critical: true,
    check: (p) => {
      if (!p.tags || !Array.isArray(p.tags)) return false
      const brandTag = p.tags.find(tag => tag.toLowerCase().startsWith('brand'))
      if (!brandTag) return false
      const brand = brandTag.split(':')[1]?.trim() || brandTag
      return brand.length > 0 && brand.length <= 70
    },
    getValue: (p) => {
      if (!p.tags || !Array.isArray(p.tags)) return null
      const brandTag = p.tags.find(tag => tag.toLowerCase().startsWith('brand'))
      if (!brandTag) return null
      return brandTag.split(':')[1]?.trim() || brandTag
    },
  },
  {
    field: "material",
    displayName: "Material",
    weight: 8,
    critical: true,
    check: (p) => {
      if (!p.tags || !Array.isArray(p.tags)) return false
      const materialTag = p.tags.find(tag => tag.toLowerCase().includes('material'))
      if (!materialTag) return false
      const material = materialTag.split(':')[1]?.trim() || materialTag
      return material.length > 0 && material.length <= 100
    },
    getValue: (p) => {
      if (!p.tags || !Array.isArray(p.tags)) return null
      const materialTag = p.tags.find(tag => tag.toLowerCase().includes('material'))
      if (!materialTag) return null
      return materialTag.split(':')[1]?.trim() || materialTag
    },
  },
  
]

/**
 * ============================================================================
 * PART 3: Variant Fields (required + optional)
 * ============================================================================
 */

const VARIANT_FIELDS: FieldCheck<{ product: ShopifyProduct; variant: ShopifyVariant }>[] = [
  {
    field: "condition",
    displayName: "Condition",
    weight: 10,
    critical: true,
    check: ({ variant }) => {
      return true
    },
    getValue: () => "new",
  },
  {
    field: "item_group_id",
    displayName: "Item Group ID",
    weight: 8,
    critical: true,
    check: ({ product }) => {
      return !!product.id
    },
    getValue: ({ product }) => product.id,
  },
  {
    field: "item_group_title",
    displayName: "Item Group Title",
    weight: 8,
    critical: false,
    check: ({ product }) => {
      // Not required for single-variant products
      if (!product.variants || product.variants.length <= 1) {
        return true
      }
      return !!product.title && product.title.trim().length > 0 && product.title.length <= 150
    },
    getValue: ({ product }) => product.title,
  },
  {
    field: "gtin",
    displayName: "GTIN/UPC",
    weight: 6,
    critical: false,
    check: ({ variant }) => !!variant.barcode && variant.barcode.trim().length >= 8 && variant.barcode.trim().length <= 14,
    getValue: ({ variant }) => variant.barcode || null,
  },
  {
    field: "color",
    displayName: "Color (Variant)",
    weight: 6,
    critical: false,
    check: ({ variant }) => {
      const colorOption = variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'color')
      return !!colorOption && colorOption.value.length > 0 && colorOption.value.length <= 40
    },
    getValue: ({ variant }) => {
      const colorOption = variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'color')
      return colorOption?.value || null
    },
  },
  {
    field: "size",
    displayName: "Size (Variant)",
    weight: 6,
    critical: false,
    check: ({ variant }) => {
      const sizeOption = variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'size')
      return !!sizeOption && sizeOption.value.length > 0 && sizeOption.value.length <= 20
    },
    getValue: ({ variant }) => {
      const sizeOption = variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'size')
      return sizeOption?.value || null
    },
  },
  {
    field: "size_system",
    displayName: "Size System",
    weight: 2,
    critical: false,
    check: ({ variant }) => {
      const sizeSystemOption = variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'size_system')
      return !!sizeSystemOption && sizeSystemOption.value.length === 2
    },
    getValue: ({ variant }) => {
      const sizeSystemOption = variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'size_system')
      return sizeSystemOption?.value || null
    },
  },
  {
    field: "gender",
    displayName: "Gender",
    weight: 2,
    critical: false,
    check: ({ variant }) => {
      const genderOption = variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'gender')
      return !!genderOption && ['male', 'female', 'unisex'].includes(genderOption.value.toLowerCase())
    },
    getValue: ({ variant }) => {
      const genderOption = variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'gender')
      return genderOption?.value || null
    },
  },
  {
    field: "offer_id",
    displayName: "Offer ID (SKU)",
    weight: 4,
    critical: false,
    check: ({ variant }) => !!variant.sku && variant.sku.trim().length > 0,
    getValue: ({ variant }) => variant.sku || null,
  },
  {
    field: "dimensions",
    displayName: "Product Dimensions",
    weight: 6,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null,
  },
  {field: "length",
    displayName: "Length",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null,
  },
  {
    field: "width",
    displayName: "Width",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null,
  },
  {
    field: "height",
    displayName: "Height",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null,
  },
  {
    field: "size",
    displayName: "Size",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null,
  },
   {
    field: "weight",
    displayName: "Product Weight",
    weight: 10,
    critical: true,
    check: ({ variant }) => {
      const weight = variant.inventoryItem?.measurement?.weight?.value
      return !!weight && weight > 0
    },
    getValue: ({ variant }) => {
      const weight = variant.inventoryItem?.measurement?.weight
      if (!weight?.value) return null
      return `${weight.value} ${weight.unit}`
    },
  },
  {
    field:"age_group",
    displayName: "Age Group",
    weight: 2,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => {
      return null
    },
  }
]

// popularity_score (optional) + return_rate (optional)
// TODO: Implement popularity_score and return_rate
const PERFORMANCE_FIELDS: FieldCheck<ShopifyProduct | undefined>[] = [
  {
    field: "popularity_score",
    displayName: "Popularity Score",
    weight: 4,
    critical: false,
    check: (p) => false,
    getValue: (p) => null,
  },
  {
    field: "return_rate",
    displayName: "Return Rate",
    weight: 4,
    critical: false,
    check: (p) => false,
    getValue: (p) => null,
  },
]

const PRICE_PROMOTION_FIELDS: FieldCheck<{ product: ShopifyProduct; variant: ShopifyVariant }>[] = [
  {
    field: "price",
    displayName: "Product Price",
    weight: 10,
    critical: true,
    check: ({ variant }) => {
      const price = parseFloat(variant.price)
      return !isNaN(price) && price > 0
    },
    getValue: ({ variant }) => variant.price,
  },
  {
    field: "applicable_taxes_fees", // TODO: find taxes
    displayName: "Applicable Taxes Fees",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null
  },
  {
    field: "sale_price",
    displayName: "Sale Price",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null
  },
  {
    field: "sale_price_effective_date",
    displayName: "Sale Price Effective Date",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null
  },
  {
    // unit pricing measure and base measure are used together to define unit pricing
    // they must be provided together
    field: "unit_pricing_measure",
    displayName: "Unit Pricing Measure",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null
  },
  {
    field: "base_measure",
    displayName: "Base Measure",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null
  },
  {
    field: "pricing_trend",
    displayName: "Pricing Trend",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null
  }
]

const INVENTORY_FIELDS: FieldCheck<{variant: ShopifyVariant}>[] = [
  {
    field: "availability",
    displayName: "Availability",
    weight: 10,
    critical: true,
    check: ({ variant }) => {
      // Check variant.inventoryQuantity first
      if (variant.inventoryQuantity !== undefined && variant.inventoryQuantity !== null) {
        return variant.inventoryQuantity >= 0
      }
      // Then check inventoryLevels
      if (variant.inventoryItem?.inventoryLevels) {
        const total = variant.inventoryItem.inventoryLevels.reduce((sum, level) => {
          const onHandQty = level.quantities.find(q => q.name === "on_hand")
          return sum + (onHandQty?.quantity || 0)
        }, 0)
        return total >= 0
      }
      return false
    },
      getValue: ({ variant }) => (variant.inventoryQuantity ?? 0) > 0 ? 'in_stock' : 'out_of_stock',
  },
  {
    // required if availability=preorder
    field: "availability",
    displayName: "Availability",
    weight: 0,
    critical: false,
    check: ({ variant }) => {
      return false
    },
      getValue: () => null,
  },
  {
    field: "inventory_quantity",
    displayName: "Inventory Quantity",
    weight: 6,
    critical: true,
    check: ({ variant }) => {
      // Check variant.inventoryQuantity first
      if (variant.inventoryQuantity !== undefined && variant.inventoryQuantity !== null) {
        return variant.inventoryQuantity >= 0
      }
      // Then check inventoryLevels
      if (variant.inventoryItem?.inventoryLevels) {
        const total = variant.inventoryItem.inventoryLevels.reduce((sum, level) => {
          const onHandQty = level.quantities.find(q => q.name === "on_hand")
          return sum + (onHandQty?.quantity || 0)
        }, 0)
        return total >= 0
      }
      return false
    },
    getValue: ({ variant }) => variant.inventoryQuantity?.toString() || null,
  },
  {
    // Remove product after date
    field: "expiration_date",
    displayName: "Expiration Date",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null
  },
  {
    field: "pickup_method",
    displayName: "Pickup Method",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null
  },
  {
    field: "pickup_sla",
    displayName: "Pickup SLA",
    weight: 0,
    critical: false,
    check: () => {
      return false
    },
    getValue: () => null
  }
]



const MEDIA_FIELDS: FieldCheck<ShopifyProduct>[] = [
  {
    field: "image_link",
    displayName: "Featured Image",
    weight: 10,
    critical: true,
    check: (p: ShopifyProduct) => !!(p.featuredImage?.url || (p.images && p.images.length > 0)),
    getValue: (p: ShopifyProduct) => p.featuredImage?.url || p.images?.[0]?.url || null,
  },
  {
    field: "additional_image_link",
    displayName: "Additional Images",
    weight: 6,
    critical: false,
    check: (p: ShopifyProduct) => {
      if (p.images && p.images.length > 1) {
        return p.images.slice(1).every(img => !!img.url)
      }
      return false
    },
    getValue: (p: ShopifyProduct) => p.images?.reduce((acc, img) => {
      if (img.url) {
        acc.push(img.url)
      }
      return acc
    }, [] as string[]) || null,
  },
  {
    field: "video_link",
    displayName: "Product Videos",
    weight: 4,
    critical: false,
    check: (p: ShopifyProduct) => {
      return false
    },
    getValue: (p: ShopifyProduct) => {
      return null
    }
  },
  {
    field: "model_3d_link",
    displayName: "3D Model Link",
    weight: 2,
    critical: false,
    check: (p: ShopifyProduct) => {
      return false
    },
    getValue: (p: ShopifyProduct) => {
      return null
    }
  }

]

/**
 * ============================================================================
 * PART 4: Shop-Level Fields (shipping, merchant, returns)
 * ============================================================================
 */

const SHIPPING_FIELDS: FieldCheck<ShopifyShop | undefined>[] = [
  {
    field: "shipping",
    displayName: "Shipping Information",
    weight: 8,
    critical: true,
    check: (shop) => {
      if (!shop?.shippingRates || !Array.isArray(shop.shippingRates) || shop.shippingRates.length === 0) {
        return false
      }
      const shipping = shop.shippingRates[0]
      const parts = shipping.split(':')
      if (parts.length !== 4) return false

      const [country, region, serviceClass, priceStr] = parts
      // Validate each part
      if (!country || country.length !== 2) return false
      if (!region || region.trim().length === 0) return false
      if (!serviceClass || serviceClass.trim().length === 0) return false
      // Validate price format: amount + space + currency (e.g., "16.00 USD")
      const priceMatch = priceStr.match(/^(\d+\.?\d*)\s+([A-Z]{3})$/)
      return !!priceMatch
    },
    getValue: (shop) => shop?.shippingRates?.[0] || null,
  },
  {
    field: "delivery_estimate",
    displayName: "Delivery Estimate",
    weight: 4,
    critical: false,
    check: (shop) => {
      // Optional field - returns true if not provided
      const deliveryEstimate = (shop as any)?.metadata?.delivery_estimate
      if (!deliveryEstimate || typeof deliveryEstimate !== 'string') {
        return true
      }
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/
      return iso8601Regex.test(deliveryEstimate)
    },
    getValue: (shop) => (shop as any)?.metadata?.delivery_estimate || null,
  },
]

const MERCHANT_FIELDS: FieldCheck<ShopifyShop | undefined>[] = [
  {
    field: "seller_name",
    displayName: "Seller Name",
    weight: 10,
    critical: true,
    check: (shop) => !!shop?.name && shop.name.trim().length > 0 && shop.name.length <= 70,
    getValue: (shop) => shop?.name || null,
  },
  {
    field: "seller_url",
    displayName: "Seller URL",
    weight: 10,
    critical: true,
    check: (shop) => {
      const url = shop?.primaryDomain?.url || shop?.url
      return !!url && url.trim().length > 0 && url.length <= 2048
    },
    getValue: (shop) => shop?.primaryDomain?.url || shop?.url || null,
  },
  {
    field: "seller_privacy_policy",
    displayName: "Seller Privacy Policy",
    weight: 10,
    critical: true,
    check: (shop) => {
      const policy = shop?.shopPolicies?.find(p => p.type === "PRIVACY_POLICY")?.url
      return !!policy && policy.trim().length > 0 && policy.length <= 2048
    },
    getValue: (shop) => shop?.shopPolicies?.find(p => p.type === "PRIVACY_POLICY")?.url || null,
  },
  {
    field: "seller_tos",
    displayName: "Seller Terms of Service",
    weight: 10,
    critical: true,
    check: (shop) => {
      const tos = shop?.shopPolicies?.find(p => p.type === "TERMS_OF_SERVICE")?.url
      return !!tos && tos.trim().length > 0 && tos.length <= 2048
    },
    getValue: (shop) => shop?.shopPolicies?.find(p => p.type === "TERMS_OF_SERVICE")?.url || null,
  },
]

const RETURNS_FIELDS: FieldCheck<ShopifyShop | undefined>[] = [
  {
    field: "return_policy",
    displayName: "Return Policy",
    weight: 10,
    critical: true,
    check: (shop) => {
      const policy = shop?.shopPolicies?.find(p => p.type === "REFUND_POLICY")?.url
      return !!policy && policy.trim().length > 0 && policy.length <= 2048
    },
    getValue: (shop) => shop?.shopPolicies?.find(p => p.type === "REFUND_POLICY")?.url || null,
  },
  {
    field: "return_window",
    displayName: "Return Window",
    weight: 10,
    critical: true,
    check: (shop) => false, // TODO: Implement return window check
    getValue: (shop) => (shop as any)?.metadata?.return_window || null,
  },
]




/**
 * ============================================================================
 * PART 5: Compliance Report Types
 * ============================================================================
 */

export type FieldCoverage = {
  field: string
  displayName: string
  filled: number
  missing: number
  percentage: number
  critical: boolean
  value?: string | string[] | null
}

export type VariantComplianceAnalysis = {
  variant_id: string
  variant_title: string
  sku?: string | null
  missing_fields: Array<{
    field: string
    displayName: string
    critical: boolean
    weight: number
  }>
  variant_data: {
    condition?: string | string[] | null
    item_group_id?: string | string[] | null
    item_group_title?: string | string[] | null
    gtin?: string | string[] | null
    color?: string | null
    size?: string | null
    size_system?: string | null
    gender?: string | null
    offer_id?: string | null
    price?: number | null
    weight?: number | null
    inventory_quantity?: number | null
    barcode?: string | null
  }
  price_promotion_data: {
    price?: string | string[] | null
    applicable_taxes_fees?: string | string[] | null
    sale_price?: string | string[] | null
    sale_price_effective_date?: string | string[] | null
    unit_pricing_measure?: string | string[] | null
    base_measure?: string | string[] | null
    pricing_trend?: string | string[] | null
  }
  inventory_data: {
    availability?: string | string[] | null
    inventory_quantity?: string | string[] | null
    expiration_date?: string | string[] | null
    pickup_method?: string | string[] | null
    pickup_sla?: string | string[] | null
  }
}

export type ProductComplianceAnalysis = {
  product_id: string
  title: string
  handle: string
  compliance_score: number
  total_fields: number
  filled_fields: number
  missing_fields: Array<{
    field: string
    displayName: string
    critical: boolean
    weight: number
  }>
  warnings: string[]
  status: "compliant" | "needs_improvement" | "non_compliant"
  variants: VariantComplianceAnalysis[]
  media_data: {
    image_link?: string | null
    additional_image_count?: number
    has_video?: boolean
    has_3d_model?: boolean
  }
}

export type ComplianceReport = {
  overall_score: number
  total_products: number
  compliant_products: number
  needs_improvement: number
  non_compliant: number
  field_coverage: Record<string, FieldCoverage>
  product_scores: ProductComplianceAnalysis[]
  recommendations: Array<{
    critical: boolean
    field: string
    displayName: string
    message: string
    affected_products: number
  }>
}

/**
 * ============================================================================
 * PART 6: Analysis Functions
 * ============================================================================
 */

/**
 * Analyze a single product for compliance
 */
export function analyzeShopifyProductCompliance(
  shopifyProduct: ShopifyProduct,
  shopifyShop?: ShopifyShop
): ProductComplianceAnalysis {
  const missingFields: ProductComplianceAnalysis["missing_fields"] = []
  const warnings: string[] = []
  let totalWeight = 0
  let earnedWeight = 0

  // Check product-level fields
  for (const field of PRODUCT_FIELDS) {
    totalWeight += field.weight
    if (field.check(shopifyProduct)) {
      earnedWeight += field.weight
    } else {
      missingFields.push({
        field: field.field,
        displayName: field.displayName,
        critical: field.critical,
        weight: field.weight,
      })
    }
  }

  // Check performance fields (product-level)
  for (const field of PERFORMANCE_FIELDS) {
    totalWeight += field.weight
    if (field.check(shopifyProduct)) {
      earnedWeight += field.weight
    } else {
      missingFields.push({
        field: field.field,
        displayName: field.displayName,
        critical: field.critical,
        weight: field.weight,
      })
    }
  }

  // Check media fields (product-level)
  for (const field of MEDIA_FIELDS) {
    totalWeight += field.weight
    if (field.check(shopifyProduct)) {
      earnedWeight += field.weight
    } else {
      missingFields.push({
        field: field.field,
        displayName: field.displayName,
        critical: field.critical,
        weight: field.weight,
      })
    }
  }

  // Check variant-level fields (aggregate across all variants)
  const variants = shopifyProduct.variants || []

  for (const field of VARIANT_FIELDS) {
    totalWeight += field.weight

    // For required fields, ALL variants must pass
    // For optional fields, at least ONE variant must pass
    const allPass = variants.every(v => field.check({ product: shopifyProduct, variant: v }))
    const somePass = variants.some(v => field.check({ product: shopifyProduct, variant: v }))

    const passes = field.critical ? allPass : somePass

    if (passes) {
      earnedWeight += field.weight
    } else {
      missingFields.push({
        field: field.field,
        displayName: field.displayName,
        critical: field.critical,
        weight: field.weight,
      })
    }
  }

  // Check price/promotion fields (variant-level)
  for (const field of PRICE_PROMOTION_FIELDS) {
    totalWeight += field.weight

    // For required fields, ALL variants must pass
    // For optional fields, at least ONE variant must pass
    const allPass = variants.every(v => field.check({ product: shopifyProduct, variant: v }))
    const somePass = variants.some(v => field.check({ product: shopifyProduct, variant: v }))

    const passes = field.critical ? allPass : somePass

    if (passes) {
      earnedWeight += field.weight
    } else {
      missingFields.push({
        field: field.field,
        displayName: field.displayName,
        critical: field.critical,
        weight: field.weight,
      })
    }
  }

  // Check inventory fields (variant-level)
  for (const field of INVENTORY_FIELDS) {
    totalWeight += field.weight

    // For required fields, ALL variants must pass
    // For optional fields, at least ONE variant must pass
    const allPass = variants.every(v => field.check({ variant: v }))
    const somePass = variants.some(v => field.check({ variant: v }))

    const passes = field.critical ? allPass : somePass

    if (passes) {
      earnedWeight += field.weight
    } else {
      missingFields.push({
        field: field.field,
        displayName: field.displayName,
        critical: field.critical,
        weight: field.weight,
      })
    }
  }

  // Add warnings for partial data
  if (variants.length > 0) {
    const variantsWithWeight = variants.filter(v => {
      const weight = v.inventoryItem?.measurement?.weight?.value
      return !!weight && weight > 0
    })
    if (variantsWithWeight.length > 0 && variantsWithWeight.length < variants.length) {
      warnings.push(`${variants.length - variantsWithWeight.length} of ${variants.length} variants missing weight`)
    }

    const variantsWithBarcode = variants.filter(v => !!v.barcode && v.barcode.trim().length >= 8)
    if (variantsWithBarcode.length > 0 && variantsWithBarcode.length < variants.length) {
      warnings.push(`${variants.length - variantsWithBarcode.length} of ${variants.length} variants missing barcode`)
    }

    const variantsWithSku = variants.filter(v => !!v.sku && v.sku.trim().length > 0)
    if (variantsWithSku.length > 0 && variantsWithSku.length < variants.length) {
      warnings.push(`${variants.length - variantsWithSku.length} of ${variants.length} variants missing SKU`)
    }
  }

  // Calculate compliance score
  const complianceScore = Math.round((earnedWeight / totalWeight) * 100)

  // Determine status
  let status: ProductComplianceAnalysis["status"]
  if (complianceScore >= 90) {
    status = "compliant"
  } else if (complianceScore >= 50) {
    status = "needs_improvement"
  } else {
    status = "non_compliant"
  }

  // Analyze each variant
  const variantAnalyses: VariantComplianceAnalysis[] = variants.map((variant) => {
    const variantMissingFields: VariantComplianceAnalysis["missing_fields"] = []

    for (const field of VARIANT_FIELDS) {
      if (!field.check({ product: shopifyProduct, variant })) {
        variantMissingFields.push({
          field: field.field,
          displayName: field.displayName,
          critical: field.critical,
          weight: field.weight,
        })
      }
    }

    // Also check price/promotion fields for this variant
    for (const field of PRICE_PROMOTION_FIELDS) {
      if (!field.check({ product: shopifyProduct, variant })) {
        variantMissingFields.push({
          field: field.field,
          displayName: field.displayName,
          critical: field.critical,
          weight: field.weight,
        })
      }
    }

    // Also check inventory fields for this variant
    for (const field of INVENTORY_FIELDS) {
      if (!field.check({ variant })) {
        variantMissingFields.push({
          field: field.field,
          displayName: field.displayName,
          critical: field.critical,
          weight: field.weight,
        })
      }
    }

    return {
      variant_id: variant.id,
      variant_title: variant.title || "Default Title",
      sku: variant.sku,
      missing_fields: variantMissingFields,
      variant_data: {
        condition: VARIANT_FIELDS.find(f => f.field === 'condition')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        item_group_id: VARIANT_FIELDS.find(f => f.field === 'item_group_id')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        item_group_title: VARIANT_FIELDS.find(f => f.field === 'item_group_title')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        gtin: VARIANT_FIELDS.find(f => f.field === 'gtin')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        color: variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'color')?.value,
        size: variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'size')?.value,
        size_system: variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'size_system')?.value,
        gender: variant.selectedOptions?.find(opt => opt.name.toLowerCase() === 'gender')?.value,
        offer_id: variant.sku,
        price: parseFloat(variant.price),
        weight: variant.inventoryItem?.measurement?.weight?.value,
        inventory_quantity: variant.inventoryQuantity,
        barcode: variant.barcode,
      },
      price_promotion_data: {
        price: PRICE_PROMOTION_FIELDS.find(f => f.field === 'price')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        applicable_taxes_fees: PRICE_PROMOTION_FIELDS.find(f => f.field === 'applicable_taxes_fees')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        sale_price: PRICE_PROMOTION_FIELDS.find(f => f.field === 'sale_price')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        sale_price_effective_date: PRICE_PROMOTION_FIELDS.find(f => f.field === 'sale_price_effective_date')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        unit_pricing_measure: PRICE_PROMOTION_FIELDS.find(f => f.field === 'unit_pricing_measure')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        base_measure: PRICE_PROMOTION_FIELDS.find(f => f.field === 'base_measure')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
        pricing_trend: PRICE_PROMOTION_FIELDS.find(f => f.field === 'pricing_trend')?.getValue?.({ product: shopifyProduct, variant }) ?? undefined,
      },
      inventory_data: {
        availability: INVENTORY_FIELDS.find(f => f.field === 'availability')?.getValue?.({ variant }) ?? undefined,
        inventory_quantity: INVENTORY_FIELDS.find(f => f.field === 'inventory_quantity')?.getValue?.({ variant }) ?? undefined,
        expiration_date: INVENTORY_FIELDS.find(f => f.field === 'expiration_date')?.getValue?.({ variant }) ?? undefined,
        pickup_method: INVENTORY_FIELDS.find(f => f.field === 'pickup_method')?.getValue?.({ variant }) ?? undefined,
        pickup_sla: INVENTORY_FIELDS.find(f => f.field === 'pickup_sla')?.getValue?.({ variant }) ?? undefined,
      }
    }
  })

  // Extract media data
  const imageLink = MEDIA_FIELDS.find(f => f.field === 'image_link')?.getValue?.(shopifyProduct)
  const additionalImages = MEDIA_FIELDS.find(f => f.field === 'additional_image_link')?.getValue?.(shopifyProduct)
  const additionalImageCount = Array.isArray(additionalImages) ? additionalImages.length : 0

  return {
    product_id: shopifyProduct.id,
    title: shopifyProduct.title,
    handle: shopifyProduct.handle,
    compliance_score: complianceScore,
    total_fields: PRODUCT_FIELDS.length + PERFORMANCE_FIELDS.length + MEDIA_FIELDS.length + VARIANT_FIELDS.length + PRICE_PROMOTION_FIELDS.length + INVENTORY_FIELDS.length,
    filled_fields: PRODUCT_FIELDS.length + PERFORMANCE_FIELDS.length + MEDIA_FIELDS.length + VARIANT_FIELDS.length + PRICE_PROMOTION_FIELDS.length + INVENTORY_FIELDS.length - missingFields.length,
    missing_fields: missingFields,
    warnings,
    status,
    variants: variantAnalyses,
    media_data: {
      image_link: typeof imageLink === 'string' ? imageLink : null,
      additional_image_count: additionalImageCount,
      has_video: MEDIA_FIELDS.find(f => f.field === 'video_link')?.check(shopifyProduct) || false,
      has_3d_model: MEDIA_FIELDS.find(f => f.field === 'model_3d_link')?.check(shopifyProduct) || false,
    },
  }
}

/**
 * Generate aggregate compliance report for multiple products
 */
export function generateComplianceReport(
  products: ShopifyProduct[],
  shop?: ShopifyShop
): ComplianceReport {
  if (products.length === 0) {
    return {
      overall_score: 0,
      total_products: 0,
      compliant_products: 0,
      needs_improvement: 0,
      non_compliant: 0,
      field_coverage: {},
      product_scores: [],
      recommendations: [],
    }
  }

  // Analyze each product
  const productScores = products.map(p => analyzeShopifyProductCompliance(p, shop))

  // Calculate overall score
  const overallScore = Math.round(
    productScores.reduce((sum, p) => sum + p.compliance_score, 0) / productScores.length
  )

  // Count products by status
  const compliantProducts = productScores.filter((p) => p.status === "compliant").length
  const needsImprovement = productScores.filter((p) => p.status === "needs_improvement").length
  const nonCompliant = productScores.filter((p) => p.status === "non_compliant").length

  // Calculate field coverage
  const fieldCoverage: Record<string, FieldCoverage> = {}

  // Product fields coverage
  for (const field of PRODUCT_FIELDS) {
    const filled = products.filter((p) => field.check(p)).length
    const missing = products.length - filled
    const percentage = Math.round((filled / products.length) * 100)

    fieldCoverage[field.field] = {
      field: field.field,
      displayName: field.displayName,
      filled,
      missing,
      percentage,
      critical: field.critical,
    }
  }

  // Performance fields coverage (product-level)
  for (const field of PERFORMANCE_FIELDS) {
    const filled = products.filter((p) => field.check(p)).length
    const missing = products.length - filled
    const percentage = Math.round((filled / products.length) * 100)

    fieldCoverage[field.field] = {
      field: field.field,
      displayName: field.displayName,
      filled,
      missing,
      percentage,
      critical: field.critical,
      value: field.getValue?.(products[0]) || null, // Get value from first product as example
    }
  }

  // Media fields coverage (product-level)
  for (const field of MEDIA_FIELDS) {
    const filled = products.filter((p) => field.check(p)).length
    const missing = products.length - filled
    const percentage = Math.round((filled / products.length) * 100)

    fieldCoverage[field.field] = {
      field: field.field,
      displayName: field.displayName,
      filled,
      missing,
      percentage,
      critical: field.critical,
    }
  }

  // Variant fields coverage (aggregate)
  for (const field of VARIANT_FIELDS) {
    const filled = products.filter((p) => {
      const variants = p.variants || []
      if (variants.length === 0) return false

      // For required fields, ALL variants must pass
      // For optional fields, at least ONE variant must pass
      const allPass = variants.every(v => field.check({ product: p, variant: v }))
      const somePass = variants.some(v => field.check({ product: p, variant: v }))

      return field.critical ? allPass : somePass
    }).length

    const missing = products.length - filled
    const percentage = Math.round((filled / products.length) * 100)

    fieldCoverage[field.field] = {
      field: field.field,
      displayName: field.displayName,
      filled,
      missing,
      percentage,
      critical: field.critical,
    }
  }

  // Price/Promotion fields coverage (variant-level aggregate)
  for (const field of PRICE_PROMOTION_FIELDS) {
    const filled = products.filter((p) => {
      const variants = p.variants || []
      if (variants.length === 0) return false

      // For required fields, ALL variants must pass
      // For optional fields, at least ONE variant must pass
      const allPass = variants.every(v => field.check({ product: p, variant: v }))
      const somePass = variants.some(v => field.check({ product: p, variant: v }))

      return field.critical ? allPass : somePass
    }).length

    const missing = products.length - filled
    const percentage = Math.round((filled / products.length) * 100)

    fieldCoverage[field.field] = {
      field: field.field,
      displayName: field.displayName,
      filled,
      missing,
      percentage,
      critical: field.critical,
    }
  }

  // Inventory fields coverage (variant-level aggregate)
  for (const field of INVENTORY_FIELDS) {
    const filled = products.filter((p) => {
      const variants = p.variants || []
      if (variants.length === 0) return false

      // For required fields, ALL variants must pass
      // For optional fields, at least ONE variant must pass
      const allPass = variants.every(v => field.check({ variant: v }))
      const somePass = variants.some(v => field.check({ variant: v }))

      return field.critical ? allPass : somePass
    }).length

    const missing = products.length - filled
    const percentage = Math.round((filled / products.length) * 100)

    fieldCoverage[field.field] = {
      field: field.field,
      displayName: field.displayName,
      filled,
      missing,
      percentage,
      critical: field.critical,
    }
  }

  // Shop-level fields (shipping, merchant, returns)
  const shopFieldGroups = [
    { fields: SHIPPING_FIELDS, name: 'shipping' },
    { fields: MERCHANT_FIELDS, name: 'merchant' },
    { fields: RETURNS_FIELDS, name: 'returns' },
  ]

  for (const group of shopFieldGroups) {
    for (const field of group.fields) {
      const passes = field.check(shop)
      const value = field.getValue?.(shop) || null

      // For optional fields without value, show 0% coverage
      let filled: number
      let missing: number
      let percentage: number

      if (!field.critical && !value) {
        filled = 0
        missing = 0
        percentage = 0
      } else {
        filled = passes ? 1 : 0
        missing = 1 - filled
        percentage = Math.round((filled / 1) * 100)
      }

      fieldCoverage[field.field] = {
        field: field.field,
        displayName: field.displayName,
        filled,
        missing,
        percentage,
        critical: field.critical,
        value,
      }
    }
  }

  // Generate recommendations
  const recommendations: ComplianceReport["recommendations"] = []
  const fieldsByMissing = Object.values(fieldCoverage).sort((a, b) => b.missing - a.missing)

  for (const field of fieldsByMissing) {
    if (field.missing === 0) continue

    let message: string
    if (field.missing === products.length) {
      message = `All products are missing the ${field.displayName} field`
    } else if (field.missing === 1) {
      message = `${field.percentage}% coverage - shop-level field`
    } else {
      message = `${field.percentage}% coverage - ${field.missing} of ${products.length} products missing ${field.displayName}`
    }

    recommendations.push({
      critical: field.critical,
      field: field.field,
      displayName: field.displayName,
      message,
      affected_products: field.missing,
    })
  }

  // Sort recommendations: critical first, then by affected products
  recommendations.sort((a, b) => {
    if (a.critical !== b.critical) {
      return a.critical ? -1 : 1
    }
    return b.affected_products - a.affected_products
  })

  return {
    overall_score: overallScore,
    total_products: products.length,
    compliant_products: compliantProducts,
    needs_improvement: needsImprovement,
    non_compliant: nonCompliant,
    field_coverage: fieldCoverage,
    product_scores: productScores,
    recommendations: recommendations.slice(0, 10),
  }
}

/**
 * ============================================================================
 * PART 7: Exports for Testing
 * ============================================================================
 */

export const ACP_PRODUCT_COMPLIANCE_FIELDS = PRODUCT_FIELDS
export const ACP_VARIANT_COMPLIANCE_FIELDS = VARIANT_FIELDS
export const ACP_PERFORMANCE_COMPLIANCE_FIELDS = PERFORMANCE_FIELDS
export const ACP_PRICE_PROMOTION_COMPLIANCE_FIELDS = PRICE_PROMOTION_FIELDS
export const ACP_INVENTORY_COMPLIANCE_FIELDS = INVENTORY_FIELDS
export const ACP_MEDIA_COMPLIANCE_FIELDS = MEDIA_FIELDS
export const ACP_SHIPPING_COMPLIANCE_FIELDS = SHIPPING_FIELDS
export const ACP_MERCHANT_COMPLIANCE_FIELDS = MERCHANT_FIELDS
export const ACP_RETURNS_COMPLIANCE_FIELDS = RETURNS_FIELDS
