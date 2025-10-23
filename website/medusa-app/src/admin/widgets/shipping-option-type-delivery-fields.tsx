import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Input, Label, Button, toast } from "@medusajs/ui"
import {
  DetailWidgetProps,
} from "@medusajs/framework/types"
import { useState, useEffect } from "react"

type AdminShippingOptionType = {
  id: string
  label: string
  description?: string
  code: string
  shipping_option?: {
    id: string
    name: string
    data?: {
      earliest_delivery_days?: number
      latest_delivery_days?: number
      carrier?: string
    } | null
  }
}

// The widget
const ShippingOptionDeliveryFields = ({
  data,
}: DetailWidgetProps<AdminShippingOptionType>) => {
  const [earliestDays, setEarliestDays] = useState<string>("")
  const [latestDays, setLatestDays] = useState<string>("")
  const [carrier, setCarrier] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shippingOptionId, setShippingOptionId] = useState<string | null>(null)

  // Fetch the shipping option that uses this type
  useEffect(() => {
    const fetchShippingOption = async () => {
      setIsLoading(true)
      try {
        // Query for shipping options that use this type
        const response = await fetch(
          `/admin/shipping-options?fields=id,name,data&shipping_option_type_id=${data.id}`,
          {
            credentials: "include",
          }
        )

        if (!response.ok) {
          throw new Error("Failed to fetch shipping option")
        }

        const result = await response.json()

        if (result.shipping_options && result.shipping_options.length > 0) {
          const shippingOption = result.shipping_options[0]
          setShippingOptionId(shippingOption.id)

          if (shippingOption.data) {
            setEarliestDays(String(shippingOption.data.earliest_delivery_days || ""))
            setLatestDays(String(shippingOption.data.latest_delivery_days || ""))
            setCarrier(shippingOption.data.carrier || "")
          }
        }
      } catch (error) {
        console.error("Error fetching shipping option:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShippingOption()
  }, [data.id])

  const handleSave = async () => {
    if (!shippingOptionId) {
      toast.error("Error", {
        description: "No shipping option found for this type. Create a shipping option with this type first.",
        duration: 5000,
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/admin/shipping-options/${shippingOptionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          data: {
            earliest_delivery_days: earliestDays ? Number(earliestDays) : undefined,
            latest_delivery_days: latestDays ? Number(latestDays) : undefined,
            carrier: carrier || undefined,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response:", errorData)
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      toast.success("Success", {
        description: "Delivery fields updated successfully!",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error updating shipping option:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update delivery fields. Check console for details.",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">
            Delivery Time Configuration
          </Heading>
          <p className="text-sm text-ui-fg-subtle">Loading shipping option data...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">
          Delivery Time Configuration
        </Heading>
        <p className="text-sm text-ui-fg-subtle mb-4">
          Configure delivery time expectations for this shipping option. These values are used in the checkout flow.
        </p>

        {!shippingOptionId && (
          <div className="mb-4 p-4 bg-ui-bg-subtle border border-ui-border-base rounded">
            <p className="text-sm text-ui-fg-muted">
              No shipping option found using this type. The delivery fields will be available once a shipping option is created with this type.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="earliest_delivery_days">
              Earliest Delivery (days)
            </Label>
            <Input
              id="earliest_delivery_days"
              type="number"
              min="0"
              value={earliestDays}
              onChange={(e) => setEarliestDays(e.target.value)}
              placeholder="e.g., 2"
            />
            <p className="text-xs text-ui-fg-subtle mt-1">
              Minimum number of days for delivery
            </p>
          </div>

          <div>
            <Label htmlFor="latest_delivery_days">
              Latest Delivery (days)
            </Label>
            <Input
              id="latest_delivery_days"
              type="number"
              min="0"
              value={latestDays}
              onChange={(e) => setLatestDays(e.target.value)}
              placeholder="e.g., 5"
            />
            <p className="text-xs text-ui-fg-subtle mt-1">
              Maximum number of days for delivery
            </p>
          </div>

          <div>
            <Label htmlFor="carrier">
              Carrier Name
            </Label>
            <Input
              id="carrier"
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g., USPS, FedEx"
            />
            <p className="text-xs text-ui-fg-subtle mt-1">
              Name of the shipping carrier
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Delivery Configuration"}
          </Button>
        </div>
      </div>
    </Container>
  )
}

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "shipping_option_type.details.after",
})

export default ShippingOptionDeliveryFields
