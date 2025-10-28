"use client"

import { claimStore } from "@/lib/data/vendor"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type ClaimStoreModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function ClaimStoreModal({ isOpen, onClose }: ClaimStoreModalProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(claimStore, null)
  const formRef = useRef<HTMLFormElement>(null)
  const [claimCode, setClaimCode] = useState("")

  useEffect(() => {
    if (state?.success && state?.store?.vendorStore?.id) {
      // Small delay to show success message, then navigate
      setTimeout(() => {
        router.push(`/dashboard?vendorStoreId=${state.store.vendorStore.id}`)
        onClose()
      }, 1000)
    }
  }, [state?.success, state?.store, router, onClose])

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
                    Link Additional Store
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
                  Enter your store claim code to connect another store and view its analytics
                </p>

                <form ref={formRef} action={formAction} className="space-y-4">
                  {state?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                      {state.error}
                    </div>
                  )}

                  {state?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                      Store linked successfully! Refreshing...
                    </div>
                  )}

                  <div>
                    <label htmlFor="claimCode" className="block text-sm font-medium text-slate-700 mb-2">
                      Claim Code
                    </label>
                    <input
                      id="claimCode"
                      name="claimCode"
                      type="text"
                      required
                      value={claimCode}
                      onChange={(e) => setClaimCode(e.target.value)}
                      placeholder="Enter your claim code"
                      className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      You can find your claim code in your store&apos;s integration settings
                    </p>
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
                      disabled={!claimCode || state?.success}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {state?.success ? "Linking..." : "Link Store"}
                    </button>
                  </div>
                </form>
          </div>
        </div>
    </div>
  )
}
