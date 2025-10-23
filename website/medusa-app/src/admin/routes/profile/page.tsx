import { Container, Heading, Input, Textarea, Button, Text, Label } from "@medusajs/ui"
import { useEffect, useState } from "react"

export const config = {
  link: {
    label: "Profile",
    icon: "user",
  },
}

type VendorProfile = {
  id: string
  name: string
  handle: string
  logo?: string
  metadata?: {
    description?: string
    contact_email?: string
    contact_phone?: string
    return_policy?: string
    privacy_policy?: string
    shipping_policy?: string
    store_hours?: string
    location?: string
  }
}

const VendorProfilePage = () => {
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    handle: "",
    logo: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    return_policy: "",
    privacy_policy: "",
    shipping_policy: "",
    store_hours: "",
    location: "",
  })

  useEffect(() => {
    fetchVendorProfile()
  }, [])

  const fetchVendorProfile = async () => {
    try {
      const response = await fetch("/vendors/me", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch vendor profile")
      }

      const data = await response.json()
      setVendor(data.vendor)

      // Populate form with existing data
      setFormData({
        name: data.vendor.name || "",
        handle: data.vendor.handle || "",
        logo: data.vendor.logo || "",
        description: data.vendor.metadata?.description || "",
        contact_email: data.vendor.metadata?.contact_email || "",
        contact_phone: data.vendor.metadata?.contact_phone || "",
        return_policy: data.vendor.metadata?.return_policy || "",
        privacy_policy: data.vendor.metadata?.privacy_policy || "",
        shipping_policy: data.vendor.metadata?.shipping_policy || "",
        store_hours: data.vendor.metadata?.store_hours || "",
        location: data.vendor.metadata?.location || "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/vendors/me", {
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
        throw new Error("Failed to update vendor profile")
      }

      const data = await response.json()
      setVendor(data.vendor)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container className="p-8">
        <Text>Loading vendor profile...</Text>
      </Container>
    )
  }

  if (error && !vendor) {
    return (
      <Container className="p-8">
        <Text className="text-red-500">{error}</Text>
      </Container>
    )
  }

  return (
    <Container className="p-8 max-w-4xl">
      <div className="mb-6">
        <Heading level="h1">Vendor Profile</Heading>
        <Text className="text-gray-600 mt-2">
          Manage your vendor information and policies
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border">
          <Heading level="h2" className="mb-4">
            Basic Information
          </Heading>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-2 block">
                Vendor Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Acme Outdoor Gear"
              />
            </div>

            <div>
              <Label htmlFor="handle" className="mb-2 block">
                Handle (URL) *
              </Label>
              <Input
                id="handle"
                value={formData.handle}
                onChange={(e) =>
                  setFormData({ ...formData, handle: e.target.value })
                }
                required
                placeholder="acme-outdoor"
              />
              <Text className="text-sm text-gray-500 mt-1">
                Your store URL: /vendors/{formData.handle || "your-handle"}
              </Text>
            </div>

            <div>
              <Label htmlFor="logo" className="mb-2 block">
                Logo URL
              </Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) =>
                  setFormData({ ...formData, logo: e.target.value })
                }
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor="description" className="mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of your store"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg border">
          <Heading level="h2" className="mb-4">
            Contact Information
          </Heading>

          <div className="space-y-4">
            <div>
              <Label htmlFor="contact_email" className="mb-2 block">
                Contact Email
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                placeholder="support@acme.com"
              />
            </div>

            <div>
              <Label htmlFor="contact_phone" className="mb-2 block">
                Contact Phone
              </Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) =>
                  setFormData({ ...formData, contact_phone: e.target.value })
                }
                placeholder="+1-555-0100"
              />
            </div>

            <div>
              <Label htmlFor="location" className="mb-2 block">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Seattle, WA, USA"
              />
            </div>

            <div>
              <Label htmlFor="store_hours" className="mb-2 block">
                Store Hours
              </Label>
              <Textarea
                id="store_hours"
                value={formData.store_hours}
                onChange={(e) =>
                  setFormData({ ...formData, store_hours: e.target.value })
                }
                placeholder="Mon-Fri: 9AM-5PM EST"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Policies - Required for OpenAI Commerce Feed */}
        <div className="bg-white p-6 rounded-lg border">
          <Heading level="h2" className="mb-2">
            Store Policies
          </Heading>
          <Text className="text-sm text-gray-600 mb-4">
            These policies will be displayed on your vendor pages and included
            in the OpenAI Commerce Feed. Markdown formatting supported.
          </Text>

          <div className="space-y-4">
            <div>
              <Label htmlFor="return_policy" className="mb-2 block">
                Return Policy *
              </Label>
              <Textarea
                id="return_policy"
                value={formData.return_policy}
                onChange={(e) =>
                  setFormData({ ...formData, return_policy: e.target.value })
                }
                placeholder="We accept returns within 30 days of purchase..."
                rows={6}
              />
              <Text className="text-sm text-gray-500 mt-1">
                Will be displayed at: /vendors/{formData.handle || "your-handle"}/returns
              </Text>
            </div>

            <div>
              <Label htmlFor="privacy_policy" className="mb-2 block">
                Privacy Policy *
              </Label>
              <Textarea
                id="privacy_policy"
                value={formData.privacy_policy}
                onChange={(e) =>
                  setFormData({ ...formData, privacy_policy: e.target.value })
                }
                placeholder="We respect your privacy and protect your personal information..."
                rows={6}
              />
              <Text className="text-sm text-gray-500 mt-1">
                Will be displayed at: /vendors/{formData.handle || "your-handle"}/privacy
              </Text>
            </div>

            <div>
              <Label htmlFor="shipping_policy" className="mb-2 block">
                Shipping Policy
              </Label>
              <Textarea
                id="shipping_policy"
                value={formData.shipping_policy}
                onChange={(e) =>
                  setFormData({ ...formData, shipping_policy: e.target.value })
                }
                placeholder="We ship worldwide within 2-3 business days..."
                rows={6}
              />
              <Text className="text-sm text-gray-500 mt-1">
                Will be displayed at: /vendors/{formData.handle || "your-handle"}/shipping
              </Text>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            {success && (
              <Text className="text-green-600">Profile updated successfully!</Text>
            )}
            {error && <Text className="text-red-600">{error}</Text>}
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </Container>
  )
}

export default VendorProfilePage
