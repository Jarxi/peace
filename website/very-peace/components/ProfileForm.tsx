"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Vendor } from "@/lib/data/vendor"

type VendorProfile = Vendor & {
  metadata?: NonNullable<Vendor["metadata"]> | null
}

export default function ProfileForm({ vendor }: { vendor: VendorProfile }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: vendor.name || "",
    handle: vendor.handle ?? "",
    logo: vendor.logo ?? "",
    description: vendor.metadata?.description ?? "",
    contact_email: vendor.metadata?.contact_email ?? "",
    contact_phone: vendor.metadata?.contact_phone ?? "",
    return_policy: vendor.metadata?.return_policy ?? "",
    privacy_policy: vendor.metadata?.privacy_policy ?? "",
    shipping_policy: vendor.metadata?.shipping_policy ?? "",
    store_hours: vendor.metadata?.store_hours ?? "",
    location: vendor.metadata?.location ?? "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/vendors/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          handle: formData.handle,
          logo: formData.logo || undefined,
          metadata: {
            description: formData.description || undefined,
            contact_email: formData.contact_email || undefined,
            contact_phone: formData.contact_phone || undefined,
            return_policy: formData.return_policy || undefined,
            privacy_policy: formData.privacy_policy || undefined,
            shipping_policy: formData.shipping_policy || undefined,
            store_hours: formData.store_hours || undefined,
            location: formData.location || undefined,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to update vendor profile")
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {success && (
            <p className="text-green-600 text-sm font-medium">
              ✓ Profile updated successfully!
            </p>
          )}
          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}
        </div>
      </div>
    </form>
  )
}
