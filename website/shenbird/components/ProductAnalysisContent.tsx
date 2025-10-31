"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import UploadCatalogModal from "./UploadCatalogModal"
import ProductComplianceReport from "./ProductComplianceReport"
import { deleteAllProducts } from "@/lib/data/products"
import { fetchComplianceReport, fetchLoadStates } from "@/lib/data/vendor"

type LoadState = {
  store_id: string
  version_id: string
  version_time: string
  state: 'success' | 'failed' | 'pending'
  created_at: string
  updated_at?: string
  runtime_log?: string
  metrics?: Record<string, unknown>
}

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

export default function ProductAnalysisContent() {
  const router = useRouter()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null)
  const [isLoadingReport, setIsLoadingReport] = useState(true)
  const [reportError, setReportError] = useState<string | null>(null)
  const [loadStates, setLoadStates] = useState<LoadState[]>([])
  const [isLoadingStates, setIsLoadingStates] = useState(true)
  const [showAllStates, setShowAllStates] = useState(false)
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
        console.error('[ProductAnalysisContent] Failed to fetch compliance report:', error)
        setReportError(error instanceof Error ? error.message : 'Failed to load compliance data')
      } finally {
        setIsLoadingReport(false)
      }
    }

    loadComplianceReport()
  }, [])

  // Fetch load states on mount
  useEffect(() => {
    const loadSyncStates = async () => {
      setIsLoadingStates(true)
      try {
        console.log('[ProductAnalysisContent] Calling fetchLoadStates...')
        const { states, error } = await fetchLoadStates()
        console.log('[ProductAnalysisContent] fetchLoadStates result:', {
          statesCount: states.length,
          error,
          states: JSON.stringify(states, null, 2)
        })
        if (error) {
          console.error('[ProductAnalysisContent] Failed to fetch load states:', error)
        } else {
          console.log('[ProductAnalysisContent] Setting loadStates with', states.length, 'items')
          setLoadStates(states)
        }
      } catch (error) {
        console.error('[ProductAnalysisContent] Failed to fetch load states:', error)
      } finally {
        setIsLoadingStates(false)
      }
    }

    loadSyncStates()
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

        {/* Sync Status Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync Status</h2>

          {isLoadingStates ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="text-gray-600 mt-2">Loading sync status...</p>
            </div>
          ) : loadStates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sync records found for rockrooster store.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Store ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Version Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Synced At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(showAllStates ? loadStates : loadStates.slice(0, 5)).map((state, index) => (
                      <tr key={`${state.store_id}-${state.version_id}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {state.state === 'success' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              Success
                            </span>
                          )}
                          {state.state === 'failed' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg className="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              Failed
                            </span>
                          )}
                          {state.state === 'pending' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <svg className="mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {state.store_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(state.version_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(state.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {loadStates.length > 5 && (
                <div className="border-t border-gray-200">
                  <button
                    onClick={() => setShowAllStates(!showAllStates)}
                    className="w-full py-3 text-center text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    {showAllStates ? (
                      <>
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Show Less
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Show All ({loadStates.length})
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
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
