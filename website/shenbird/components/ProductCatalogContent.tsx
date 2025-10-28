"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { fetchProducts, MedusaProduct } from "@/lib/data/products"
import ProductCard from "./ProductCard"
import ProductDetailModal from "./ProductDetailModal"

export default function ProductCatalogContent() {
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<MedusaProduct | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const observerTarget = useRef<HTMLDivElement>(null)

  // Load initial products
  useEffect(() => {
    loadProducts(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProducts = useCallback(async (currentOffset: number) => {
    if (loading) return

    setLoading(true)
    const result = await fetchProducts(currentOffset, 10)

    if (currentOffset === 0) {
      setProducts(result.products)
    } else {
      setProducts(prev => [...prev, ...result.products])
    }

    setHasMore(result.hasMore)
    setTotalCount(result.total)
    setOffset(currentOffset + result.products.length)
    setLoading(false)
  }, [loading])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadProducts(offset)
        }
      },
      { threshold: 1.0 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [offset, hasMore, loading, loadProducts])

  const handleProductClick = (product: MedusaProduct) => {
    setSelectedProduct(product)
    setIsDetailModalOpen(true)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
        <p className="mt-2 text-gray-600">
          Debug view: Browse all products and see field mappings
        </p>
      </div>

      {/* Products Grid */}
      <div className="space-y-4">
        {products.length === 0 && !loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload a product catalog to get started.
            </p>
          </div>
        ) : (
          <>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && <div ref={observerTarget} className="h-4" />}

        {/* End of list */}
        {!hasMore && products.length > 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Showing all {totalCount} products
          </div>
        )}

        {/* Pagination info */}
        {products.length > 0 && hasMore && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Showing {products.length} of {totalCount} products
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  )
}
