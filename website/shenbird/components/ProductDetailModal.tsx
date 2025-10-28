"use client"

import { MedusaProduct } from "@/lib/data/products"
import { useEffect, useRef } from "react"

type ProductDetailModalProps = {
  product: MedusaProduct | null
  isOpen: boolean
  onClose: () => void
}

type FieldMapping = {
  chatgptField: string
  medusaField: string
  shopifyField: string
  value: unknown
  category: "required" | "recommended" | "optional"
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.showModal()
    } else if (!isOpen && dialogRef.current) {
      dialogRef.current.close()
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!product) return null

  // Build field mappings
  const fieldMappings: FieldMapping[] = [
    // Core product fields
    {
      chatgptField: "title",
      medusaField: "title",
      shopifyField: "title",
      value: product.title,
      category: "required"
    },
    {
      chatgptField: "description",
      medusaField: "description",
      shopifyField: "body_html",
      value: product.description,
      category: "required"
    },
    {
      chatgptField: "link",
      medusaField: "handle",
      shopifyField: "handle",
      value: product.handle,
      category: "required"
    },
    {
      chatgptField: "image_link",
      medusaField: "thumbnail",
      shopifyField: "image.src / images[].src",
      value: product.thumbnail,
      category: "required"
    },
    {
      chatgptField: "brand",
      medusaField: "metadata.brand",
      shopifyField: "vendor",
      value: product.metadata?.brand,
      category: "required"
    },
    {
      chatgptField: "product_type",
      medusaField: "metadata.product_type",
      shopifyField: "product_type",
      value: product.metadata?.product_type,
      category: "recommended"
    },
    {
      chatgptField: "availability",
      medusaField: "metadata.availability",
      shopifyField: "(calculated from inventory)",
      value: product.metadata?.availability || "in_stock",
      category: "required"
    },
    {
      chatgptField: "condition",
      medusaField: "metadata.condition",
      shopifyField: "(not in Shopify)",
      value: product.metadata?.condition || "new",
      category: "optional"
    },
  ]

  // Variant-specific fields
  const firstVariant = product.variants?.[0]
  if (firstVariant) {
    fieldMappings.push(
      {
        chatgptField: "price",
        medusaField: "variants[].prices[].amount",
        shopifyField: "variants[].price",
        value: firstVariant.prices?.[0] ? `$${(firstVariant.prices[0].amount / 100).toFixed(2)}` : null,
        category: "required"
      },
      {
        chatgptField: "gtin (barcode/ean/upc)",
        medusaField: "variants[].barcode / ean / upc",
        shopifyField: "variants[].barcode",
        value: firstVariant.barcode || firstVariant.ean || firstVariant.upc,
        category: "required"
      },
      {
        chatgptField: "mpn",
        medusaField: "metadata.mpn",
        shopifyField: "variants[].sku",
        value: firstVariant.sku,
        category: "required"
      },
      {
        chatgptField: "material",
        medusaField: "material / variants[].material",
        shopifyField: "(not in Shopify)",
        value: firstVariant.material,
        category: "recommended"
      }
    )
  }

  const requiredFields = fieldMappings.filter(f => f.category === "required")
  const recommendedFields = fieldMappings.filter(f => f.category === "recommended")

  return (
    <>
      <style jsx>{`
        dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.5);
        }
      `}</style>
      <dialog
        ref={dialogRef}
        style={{
          padding: 0,
          margin: 0,
          border: 'none',
          maxWidth: 'none',
          maxHeight: 'none',
          width: '90vw',
          height: '90vh',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'transparent'
        }}
        className="rounded-lg"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            onClose()
          }
        }}
      >
        <div className="bg-white rounded-lg shadow-xl w-full h-full relative overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{product.title}</h2>
                <p className="text-sm text-gray-500 mt-1">Product ID: {product.id}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Required Fields */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Required Fields
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ChatGPT Field
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medusa Field
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shopify Field
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requiredFields.map((field, idx) => (
                      <tr key={idx} className={field.value ? "" : "bg-red-50"}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {field.chatgptField}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                          {field.medusaField}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                          {field.shopifyField}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {field.value ? (
                            <span className="break-words">{String(field.value)}</span>
                          ) : (
                            <span className="text-red-600 font-medium">Missing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommended Fields */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Recommended Fields
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ChatGPT Field
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medusa Field
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shopify Field
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recommendedFields.map((field, idx) => (
                      <tr key={idx} className={field.value ? "" : "bg-yellow-50"}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {field.chatgptField}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                          {field.medusaField}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                          {field.shopifyField}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {field.value ? (
                            <span className="break-words">{String(field.value)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Variant Info */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Variants ({product.variants.length})
                </h3>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="border border-gray-200 rounded p-3 text-sm">
                      <div className="font-medium text-gray-900">{variant.title}</div>
                      <div className="text-gray-600 text-xs mt-1">ID: {variant.id}</div>
                      {variant.sku && (
                        <div className="text-gray-600 text-xs">SKU: {variant.sku}</div>
                      )}
                      {variant.prices && variant.prices.length > 0 && (
                        <div className="text-gray-900 font-medium mt-1">
                          ${(variant.prices[0].amount / 100).toFixed(2)} {variant.prices[0].currency_code.toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
