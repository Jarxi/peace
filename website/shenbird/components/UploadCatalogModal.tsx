"use client"

import { uploadCatalogFile } from "@/lib/data/upload"
import { useActionState } from "react"
import { useEffect, useRef, useState } from "react"

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
}

type UploadCatalogModalProps = {
  isOpen: boolean
  onClose: () => void
  onAnalysisComplete?: (report: ComplianceReport) => void
}

type UploadState = {
  success?: boolean
  error?: string
  warning?: string
  filename?: string
  url?: string
  analysis?: ComplianceReport
} | null

export default function UploadCatalogModal({ isOpen, onClose, onAnalysisComplete }: UploadCatalogModalProps) {
  const [state, formAction, isPending] = useActionState<UploadState, FormData>(uploadCatalogFile, null)
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      formRef.current?.reset()
    }
  }, [isOpen])

  // Handle analysis complete - pass data to parent and close modal
  useEffect(() => {
    if (state?.success && state?.analysis && onAnalysisComplete) {
      onAnalysisComplete(state.analysis)
      setTimeout(() => {
        setSelectedFile(null)
        formRef.current?.reset()
        onClose()
      }, 1500)
    }
  }, [state?.success, state?.analysis, onClose, onAnalysisComplete])

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Keep the file in the input for re-submission
      if (fileInputRef.current && e.target.files) {
        fileInputRef.current.files = e.target.files
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.json')) {
      setSelectedFile(file)
      // Update the file input
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        fileInputRef.current.files = dataTransfer.files
      }
    }
  }

  // Preserve file in input after form submission attempt
  useEffect(() => {
    if (selectedFile && fileInputRef.current && fileInputRef.current.files?.length === 0) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(selectedFile)
      fileInputRef.current.files = dataTransfer.files
    }
  }, [selectedFile, state])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full z-10" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-900">
              Import Product Catalog
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Upload your Shopify product catalog JSON file. Products will be automatically imported to your store.
          </p>

          <form ref={formRef} action={formAction} className="space-y-4">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {state.error}
              </div>
            )}

            {state?.warning && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
                {state.warning}
              </div>
            )}

            {state?.success && !state?.warning && state?.analysis && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                <div className="font-semibold mb-1">Analysis Complete!</div>
                <div className="text-xs mt-2 space-y-1">
                  <div>Overall Score: <span className="font-bold">{state.analysis.overall_score}%</span></div>
                  <div>Total Products: {state.analysis.total_products}</div>
                  <div className="flex gap-4">
                    <span className="text-green-700">✓ Ready: {state.analysis.compliant_products}</span>
                    <span className="text-yellow-700">⚠ Needs Work: {state.analysis.needs_improvement}</span>
                    <span className="text-red-700">✗ Needs Attention: {state.analysis.non_compliant}</span>
                  </div>
                </div>
              </div>
            )}

            {/* File upload area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
            >
              <input
                ref={fileInputRef}
                id="file"
                name="file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Click to upload
                    </button>
                    {' '}or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-500">JSON files only</p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || state?.success || isPending}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPending ? "Analyzing..." : state?.success ? "Analysis Complete!" : "Analyze Products"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
