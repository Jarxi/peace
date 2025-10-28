"use client"

import { claimStore } from "@/lib/data/vendor"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type ClaimStoreProps = {
  isTestAccount?: boolean
}

export default function ClaimStore({ isTestAccount = false }: ClaimStoreProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(claimStore, null)
  const formRef = useRef<HTMLFormElement>(null)
  const [claimCode, setClaimCode] = useState("")

  // Handle test account - just redirect without API call
  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (claimCode) {
      router.push("/dashboard?claimed=true")
    }
  }

  useEffect(() => {
    if (state?.success && state?.store?.vendorStore?.id) {
      // Navigate to dashboard with vendorStoreId
      router.push(`/dashboard?vendorStoreId=${state.store.vendorStore.id}`)
    }
  }, [state?.success, state?.store, router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-900">
              Link Your Store
            </h3>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Enter your store claim code to connect your store and view its analytics
          </p>

          <form
            ref={formRef}
            action={isTestAccount ? undefined : formAction}
            onSubmit={isTestAccount ? handleTestSubmit : undefined}
            className="space-y-4"
          >
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {state.error}
              </div>
            )}

            {state?.success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                Store linked successfully! Redirecting...
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={!claimCode || (!isTestAccount && state?.success)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {!isTestAccount && state?.success ? "Linking..." : "Link Store"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
