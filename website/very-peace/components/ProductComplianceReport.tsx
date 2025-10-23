"use client"

import { useState } from "react"

type FieldCoverage = {
  field: string
  displayName: string
  filled: number
  missing: number
  percentage: number
  critical: boolean
  value?: string | null
}

type VariantCompliance = {
  variant_id: string
  variant_title: string
  sku?: string
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

type ProductScore = {
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
  variants: VariantCompliance[]
  media_data: {
    image_link?: string | null
    additional_image_count?: number
    has_video?: boolean
    has_3d_model?: boolean
  }
}

type Recommendation = {
  priority: "high" | "medium" | "low"
  field: string
  displayName: string
  message: string
  affected_products: number
}

type ShopData = {
  seller_name?: string
  seller_url?: string
  seller_privacy_policy?: string
  seller_tos?: string
  shipping_rates_count?: number
  first_shipping_rate?: string
}

type ProductComplianceReportProps = {
  overall_score: number
  total_products: number
  compliant_products: number
  needs_improvement: number
  non_compliant: number
  field_coverage: Record<string, FieldCoverage>
  product_scores: ProductScore[]
  recommendations: Recommendation[]
  shop_data?: ShopData | null
}

export default function ProductComplianceReport({
  overall_score,
  total_products,
  compliant_products,
  needs_improvement,
  non_compliant,
  field_coverage,
  product_scores,
  recommendations,
}: ProductComplianceReportProps) {
  // Track which products have their variants expanded
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  // Pre-process data once at the top level
  const performanceData = {
    popularity: field_coverage["popularity_score"]?.value,
    returnRate: field_coverage["return_rate"]?.value,
  }

  const merchantFields = [
    { key: "seller_name", label: "Seller Name", type: "text" as const },
    { key: "seller_url", label: "Seller URL", type: "url" as const },
    { key: "seller_privacy_policy", label: "Seller Privacy Policy", type: "url" as const },
    { key: "seller_tos", label: "Seller Terms of Service", type: "url" as const },
  ]

  const fulfillmentFields = [
    {
      key: "shipping",
      label: "Shipping Information",
      type: "code" as const,
      format: "country:region:service_class:price",
      example: "US:CA:Overnight:16.00 USD"
    },
    {
      key: "delivery_estimate",
      label: "Delivery Estimate",
      type: "code" as const,
      format: "ISO 8601 date",
      example: "2025-08-12"
    },
  ]

  const returnsFields = [
    { key: "return_policy", label: "Return Policy", type: "url" as const },
    { key: "return_window", label: "Return Window", type: "text" as const },
  ]

  const pricePromotionFields = [
    { key: "price", label: "Price", required: true, prefix: "$" },
    { key: "sale_price", label: "Sale Price", required: false, prefix: "$" },
    { key: "sale_price_effective_date", label: "Sale until", required: false },
    { key: "applicable_taxes_fees", label: "Tax/Fees", required: false },
    { key: "unit_pricing_measure", label: "Unit", required: false },
    { key: "base_measure", label: "Base", required: false },
    { key: "pricing_trend", label: "Trend", required: false },
  ]

  const inventoryFields = [
    { key: "availability", label: "Availability", required: true },
    { key: "inventory_quantity", label: "Quantity", required: true },
    { key: "expiration_date", label: "Expiration", required: false },
    { key: "pickup_method", label: "Pickup Method", required: false },
    { key: "pickup_sla", label: "Pickup SLA", required: false },
  ]

  const toggleVariants = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  // Helper functions
  const getOverallStatusBadge = () => {
    if (overall_score >= 90) return <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">Excellent</span>
    if (overall_score >= 70) return <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Good</span>
    if (overall_score >= 50) return <span className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Needs Improvement</span>
    return <span className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">Poor</span>
  }

  const getStatusBadge = (status: ProductScore["status"]) => {
    const badges = {
      compliant: "bg-green-100 text-green-800",
      needs_improvement: "bg-yellow-100 text-yellow-800",
      non_compliant: "bg-red-100 text-red-800",
    }
    return badges[status]
  }

  const getPriorityBadge = (priority: Recommendation["priority"]) => {
    const badges = {
      high: "bg-red-600",
      medium: "bg-yellow-600",
      low: "bg-blue-600",
    }
    return badges[priority]
  }

  const getFieldStatusBadge = (percentage: number, critical: boolean) => {
    if (!critical && percentage === 0) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">N/A</span>
    if (percentage >= 90) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Complete</span>
    if (percentage >= 70) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Good</span>
    if (percentage >= 50) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Partial</span>
    if (critical) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Critical Missing</span>
    return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Missing</span>
  }

  const renderImportanceBadge = (critical: boolean) => (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${critical ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
      {critical ? "Critical" : "Optional"}
    </span>
  )

  const renderFieldValue = (value: string | null | undefined, type: "text" | "url" | "code") => {
    if (!value) return <span className="text-gray-400 italic">Not set</span>

    if (type === "url") {
      return <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline break-all">{value}</a>
    }
    if (type === "code") {
      return <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-900">{value}</code>
    }
    return <span className="text-gray-900">{value}</span>
  }

  const renderFieldRow = (
    fieldKey: string,
    label: string,
    type: "text" | "url" | "code",
    formatInfo?: { format: string; example: string }
  ) => {
    const field = field_coverage[fieldKey]
    if (!field) return null

    return (
      <tr key={fieldKey} className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm font-medium text-gray-900">{label}</td>
        <td className="px-6 py-4 whitespace-nowrap">{renderImportanceBadge(field.critical)}</td>
        <td className="px-6 py-4 whitespace-nowrap">{getFieldStatusBadge(field.percentage, field.critical)}</td>
        <td className="px-6 py-4 text-sm">{renderFieldValue(field.value, type)}</td>
        {formatInfo && (
          <td className="px-6 py-4 text-xs">
            <div className="text-gray-600">Format: <code className="bg-gray-100 px-1 rounded">{formatInfo.format}</code></div>
            <div className="text-gray-500 mt-1">Example: <code className="bg-gray-100 px-1 rounded">{formatInfo.example}</code></div>
          </td>
        )}
      </tr>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Product Compliance Report</h2>
          {getOverallStatusBadge()}
        </div>
        <p className="text-gray-600 mb-4">
          Analysis of {total_products} products against ACP (Agentic Checkout Protocol) requirements
        </p>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <div className="text-3xl font-bold text-blue-600 mb-1">{overall_score}%</div>
            <div className="text-sm font-semibold text-gray-700">Overall Score</div>
            <div className="text-xs text-gray-500">Weighted average</div>
          </div>
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="text-3xl font-bold text-green-700 mb-1">{compliant_products}</div>
            <div className="text-sm font-semibold text-gray-700">Compliant</div>
            <div className="text-xs text-gray-500">&ge; 90% coverage</div>
          </div>
          <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <div className="text-3xl font-bold text-yellow-700 mb-1">{needs_improvement}</div>
            <div className="text-sm font-semibold text-gray-700">Needs Work</div>
            <div className="text-xs text-gray-500">50-89% coverage</div>
          </div>
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="text-3xl font-bold text-red-700 mb-1">{non_compliant}</div>
            <div className="text-sm font-semibold text-gray-700">Non-Compliant</div>
            <div className="text-xs text-gray-500">&lt; 50% coverage</div>
          </div>
        </div>
      </div>

      {/* Merchant Compliance Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Merchant Compliance</h2>
        <p className="text-gray-600 mb-4">
          Seller information required for ACP product feed
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {merchantFields.map(f => renderFieldRow(f.key, f.label, f.type))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fulfillment Compliance Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fulfillment Compliance</h2>
        <p className="text-gray-600 mb-4">
          Shipping methods, costs, and estimated delivery times for ACP product feed
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format / Example</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fulfillmentFields.map(f => renderFieldRow(f.key, f.label, f.type, { format: f.format, example: f.example }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Returns Compliance Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Returns Compliance</h2>
        <p className="text-gray-600 mb-4">
          Return and refund policies required for ACP product feed
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returnsFields.map(f => renderFieldRow(f.key, f.label, f.type))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product-Level Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Product-Level Compliance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {product_scores.map((product) => {
                const showVariants = expandedProducts.has(product.product_id)

                return (
                  <>
                    <tr key={product.product_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                        <div className="flex items-center gap-2">
                          {product.variants.length > 0 && (
                            <button
                              onClick={() => toggleVariants(product.product_id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg
                                className={`h-4 w-4 transition-transform ${showVariants ? 'rotate-90' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                          <span className="truncate">{product.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl font-bold text-gray-900">{product.compliance_score}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(product.status)}`}>
                          {product.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 text-xs">
                          <span className={performanceData.popularity ? "text-green-600" : "text-gray-400 italic"}>
                            Popularity: {performanceData.popularity || "Not set"}
                          </span>
                          <span className={performanceData.returnRate ? "text-green-600" : "text-gray-400 italic"}>
                            Return Rate: {performanceData.returnRate || "Not set"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 text-xs">
                          {product.media_data?.image_link ? (
                            <a
                              href={product.media_data.image_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Featured Image
                            </a>
                          ) : (
                            <span className="text-red-600 font-semibold">Featured Image: Missing</span>
                          )}
                          <span className={product.media_data?.additional_image_count ? "text-green-600" : "text-gray-400 italic"}>
                            Additional Images: {product.media_data?.additional_image_count || 0}
                          </span>
                          <span className={product.media_data?.has_video ? "text-green-600" : "text-gray-400 italic"}>
                            Video: {product.media_data?.has_video ? "✓" : "Not set"}
                          </span>
                          <span className={product.media_data?.has_3d_model ? "text-green-600" : "text-gray-400 italic"}>
                            3D Model: {product.media_data?.has_3d_model ? "✓" : "Not set"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.missing_fields.length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-red-600 hover:text-red-800">
                              {product.missing_fields.length} missing out of {product.total_fields} fields
                            </summary>
                            <ul className="mt-2 list-disc list-inside text-xs space-y-1">
                              {product.missing_fields.map((field) => {
                                const recommendation = recommendations.find(rec => rec.field === field.field)
                                return (
                                  <li
                                    key={field.field}
                                    className={`${field.critical ? "text-red-700 font-semibold" : ""} group relative`}
                                    title={recommendation?.message || ''}
                                  >
                                    <span className="cursor-help">
                                      {field.displayName}
                                      {field.critical && " (Critical)"}
                                    </span>
                                    {recommendation && (
                                      <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded-md shadow-lg left-0">
                                        <div className="font-semibold mb-1">
                                          {recommendation.displayName}
                                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getPriorityBadge(recommendation.priority)}`}>
                                            {recommendation.priority}
                                          </span>
                                        </div>
                                        <div>{recommendation.message}</div>
                                      </div>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                            {product.warnings.length > 0 && (
                              <div className="mt-2">
                                <div className="text-yellow-700 font-semibold text-xs">Warnings:</div>
                                <ul className="list-disc list-inside text-xs space-y-1 text-yellow-600">
                                  {product.warnings.map((warning, idx) => (
                                    <li key={idx}>{warning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </details>
                        ) : (
                          <span className="text-green-600 font-semibold">All fields present</span>
                        )}
                      </td>
                    </tr>

                    {/* Variant subrows */}
                    {showVariants && product.variants.map((variant) => (
                      <tr key={variant.variant_id} className="bg-gray-50">
                        <td className="px-6 py-2 text-xs text-gray-600 pl-16">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">└</span>
                            <span>{variant.variant_title}</span>
                            {variant.sku && <span className="text-gray-400">({variant.sku})</span>}
                          </div>
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          <div className="space-y-1">
                            <div>
                              Condition: {variant.variant_data.condition}
                            </div>
                            <div>
                              {variant.variant_data.color && <span className="mr-3">Color: {variant.variant_data.color}</span>}
                              {variant.variant_data.size && <span className="mr-3">Size: {variant.variant_data.size}</span>}
                              {variant.variant_data.size_system && <span className="mr-3 text-purple-600">System: {variant.variant_data.size_system}</span>}
                            </div>
                            <div>
                              {variant.variant_data.gender ? <span>Gender: {variant.variant_data.gender}</span> : <span className="text-gray-400 italic">Gender: Not set</span>}
                            </div>
                            <div>
                              {variant.variant_data.offer_id ? <span>Offer ID: {variant.variant_data.offer_id}</span> : <span className="text-gray-400 italic">Offer ID: Not set</span>}
                            </div>
                            <div>
                              {variant.variant_data.weight && <span className="mr-3">Weight: {variant.variant_data.weight}g</span>}
                            </div>
                            <div>
                              {variant.variant_data.inventory_quantity !== undefined && <span className="mr-3">Stock: {variant.variant_data.inventory_quantity}</span>}
                            </div>
                            <div>
                              {variant.variant_data.gtin ? (
                                <span className="mr-3 text-blue-600">GTIN: {variant.variant_data.gtin}</span>
                              ) : (
                                <span className="mr-3 text-gray-400 italic">GTIN: Not set</span>
                              )}
                            </div>
                          </div>
                        </td>
                         <td className="px-6 py-2 text-xs">
                          {(() => {
                            // Only show critical missing fields in the status badge
                            const criticalMissingFields = variant.missing_fields.filter(f => f.critical)
                            if (criticalMissingFields.length > 0) {
                              return (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  {criticalMissingFields.length} critical missing
                                </span>
                              )
                            }
                            return (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Complete
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          <div className="space-y-1">
                            {pricePromotionFields.map((field) => {
                              const value = variant.price_promotion_data[field.key as keyof typeof variant.price_promotion_data]
                              const displayValue = value ? `${field.prefix || ""}${value}` : "Not set"
                              const colorClass = value ? "text-green-600" : "text-gray-400 italic"
                              const fontClass = field.required ? "font-semibold" : ""

                              return (
                                <div key={`price-${variant.variant_id}-${field.key}`}>
                                  <span className={`mr-3 ${colorClass} ${fontClass}`}>
                                    {field.label}: {displayValue}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          <div className="space-y-1">
                            {inventoryFields.map((field) => {
                              const value = variant.inventory_data?.[field.key as keyof typeof variant.inventory_data]
                              const displayValue = value || "Not set"
                              const colorClass = value ? "text-green-600" : "text-gray-400 italic"
                              const fontClass = field.required ? "font-semibold" : ""

                              return (
                                <div key={`inventory-${variant.variant_id}-${field.key}`}>
                                  <span className={`mr-3 ${colorClass} ${fontClass}`}>
                                    {field.label}: {displayValue}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {(() => {
                            // Only show critical missing fields in the issues column
                            const criticalMissingFields = variant.missing_fields.filter(f => f.critical)
                            if (criticalMissingFields.length > 0) {
                              return (
                                <ul className="list-disc list-inside space-y-0.5">
                                  {criticalMissingFields.map((field) => (
                                    <li key={field.field} className="text-red-600 font-semibold">
                                      {field.displayName} (Critical)
                                    </li>
                                  ))}
                                </ul>
                              )
                            }
                            return null
                          })()}
                        </td>
                      </tr>
                    ))}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
