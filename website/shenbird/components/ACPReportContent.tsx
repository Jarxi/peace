"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UploadCatalogModal from "./UploadCatalogModal"
import ProductComplianceReport from "./ProductComplianceReport"
import { deleteAllProducts } from "@/lib/data/products"
import { fetchComplianceReport } from "@/lib/data/vendor"

type ComplianceReport = {
  vendor_id: string
  vendor_name: string
  analyzed_at: string
  overall_score: number
  total_products: number
  compliant_products: number
  needs_improvement: number
  non_compliant: number
  field_coverage: Record<string, unknown>
  product_scores: Array<unknown>
  recommendations: Array<unknown>
  shop_data?: {
    seller_name?: string
    seller_url?: string
    seller_privacy_policy?: string
    seller_tos?: string
    shipping_rates_count?: number
    first_shipping_rate?: string
  } | null
}

export default function ACPReportContent() {
  const router = useRouter()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null)
  const [isLoadingReport, setIsLoadingReport] = useState(true)
  const [reportError, setReportError] = useState<string | null>(null)
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Fetch compliance report on mount
  useEffect(() => {
    const loadComplianceReport = async () => {
      setIsLoadingReport(true)
      setReportError(null)

      try {
        const { report, error } = await fetchComplianceReport()

        if (error) {
          setReportError(error)
          setComplianceReport(null)
        } else if (report) {
          setComplianceReport(report)
        } else {
          // No report available yet (404 case)
          setComplianceReport(null)
        }
      } catch (error) {
        console.error('[ACPReportContent] Failed to fetch compliance report:', error)
        setReportError(error instanceof Error ? error.message : 'Failed to load compliance data')
      } finally {
        setIsLoadingReport(false)
      }
    }

    loadComplianceReport()
  }, [])

  const handleAnalysisComplete = (report: ComplianceReport) => {
    setComplianceReport(report)
  }

  const handleDeleteAllProducts = async () => {
    if (!confirm("Are you sure you want to delete ALL products? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteAllProducts()
      if (result.success) {
        alert(`Success! Deleted ${result.deletedCount} products.`)
        router.refresh()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Failed to delete products"}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Analysis Report</h1>
        </div>

        {/* Loading state */}
        {isLoadingReport && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Report</h3>
            <p className="text-gray-600">
              Fetching your product data...
            </p>
          </div>
        )}

        {/* Error state */}
        {!isLoadingReport && reportError && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Report</h3>
            <p className="text-gray-600 mb-6">{reportError}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Show compliance report if available */}
        {!isLoadingReport && !reportError && complianceReport && (
          <ProductComplianceReport
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(complianceReport as any)}
          />
        )}

        {/* Show placeholder if no report yet */}
        {!isLoadingReport && !reportError && !complianceReport && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
            <p className="text-gray-600 mb-6">
              Upload your Shopify product catalog to get a detailed analysis
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload Catalog
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
        {/* Debug Buttons - Always visible in development */}
        {isDevelopment && (
          <>
            <button
              onClick={handleDeleteAllProducts}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              title="Delete all products"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeleting ? "Deleting..." : "[Debug] Delete Products"}
            </button>
            <button
              onClick={() => router.push('/dashboard/products')}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              title="View product catalog"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              [Debug] Product Catalog
            </button>
          </>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          title="Analyze product catalog"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Upload Catalog Modal */}
      <UploadCatalogModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
      />
    </>
  )
}
