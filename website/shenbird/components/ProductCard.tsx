import { MedusaProduct } from "@/lib/data/products"
import Image from "next/image"

type ProductCardProps = {
  product: MedusaProduct
  onClick: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const variantCount = product.variants?.length || 0
  const firstPrice = product.variants?.[0]?.prices?.[0]

  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left w-full"
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          {product.thumbnail ? (
            <div className="relative w-20 h-20">
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                className="object-cover rounded"
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
            {product.title}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            ID: {product.id}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {variantCount} variant{variantCount !== 1 ? 's' : ''}
            </span>
            {firstPrice && (
              <span className="font-medium text-gray-900">
                ${(firstPrice.amount / 100).toFixed(2)} {firstPrice.currency_code.toUpperCase()}
              </span>
            )}
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              product.status === 'published'
                ? 'bg-green-100 text-green-800'
                : product.status === 'draft'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {product.status}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
