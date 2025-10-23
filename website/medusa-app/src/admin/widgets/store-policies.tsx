import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  toast,
  Drawer,
  Label,
  Textarea,
} from "@medusajs/ui"
import { PencilSquare, Trash } from "@medusajs/icons"
import { useState, useEffect } from "react"
import { DetailWidgetProps } from "@medusajs/framework/types"

type AdminStore = {
  id: string
  name: string
  metadata?: Record<string, unknown>
}

type PolicyType = "terms_of_use" | "privacy_policy" | "return_policy"

type Policy = {
  type: PolicyType
  label: string
  content: string
}

const StorePoliciesWidget = ({ data }: DetailWidgetProps<AdminStore>) => {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPolicy, setEditingPolicy] = useState<PolicyType | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Load existing policies from store metadata
  useEffect(() => {
    setIsLoading(true)
    try {
      const loadedPolicies: Policy[] = [
        {
          type: "terms_of_use",
          label: "Terms of Use",
          content: (data.metadata?.terms_of_use_content as string) || "",
        },
        {
          type: "privacy_policy",
          label: "Privacy Policy",
          content: (data.metadata?.privacy_policy_content as string) || "",
        },
        {
          type: "return_policy",
          label: "Return Policy",
          content: (data.metadata?.return_policy_content as string) || "",
        },
      ]
      setPolicies(loadedPolicies)
    } catch (error) {
      console.error("Error loading policies:", error)
    } finally {
      setIsLoading(false)
    }
  }, [data])

  const handleEdit = (policyType: PolicyType) => {
    const policy = policies.find((p) => p.type === policyType)
    setEditContent(policy?.content || "")
    setEditingPolicy(policyType)
  }

  const handleSave = async () => {
    if (!editingPolicy) return

    setIsSaving(true)
    try {
      const response = await fetch("/admin/store-policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          [`${editingPolicy}_content`]: editContent || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      // Update local state
      setPolicies((prev) =>
        prev.map((p) =>
          p.type === editingPolicy ? { ...p, content: editContent } : p
        )
      )

      toast.success("Success", {
        description: "Policy updated successfully!",
        duration: 3000,
      })

      setEditingPolicy(null)
    } catch (error) {
      console.error("Error updating policy:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update policy",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (policyType: PolicyType) => {
    setIsSaving(true)
    try {
      const response = await fetch("/admin/store-policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          [`${policyType}_content`]: null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete policy")
      }

      // Update local state
      setPolicies((prev) =>
        prev.map((p) => (p.type === policyType ? { ...p, content: "" } : p))
      )

      toast.success("Success", {
        description: "Policy deleted successfully!",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error deleting policy:", error)
      toast.error("Error", {
        description: "Failed to delete policy",
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
          <Heading level="h2">Store Policies</Heading>
          <p className="text-sm text-ui-fg-subtle mt-2">Loading...</p>
        </div>
      </Container>
    )
  }

  const currentPolicy = policies.find((p) => p.type === editingPolicy)

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Store Policies</Heading>
        </div>

        <div>
          <div className="flex flex-col">
            {policies.map((policy, index) => (
              <div
                key={policy.type}
                className={`grid grid-cols-2 items-center px-6 py-4 ${
                  index !== policies.length - 1 ? "border-b border-ui-border-base" : ""
                }`}
              >
                <div className="flex flex-col gap-y-1">
                  <span className="text-ui-fg-subtle text-sm font-medium">
                    {policy.label}
                  </span>
                  {!policy.content && (
                    <span className="text-ui-fg-muted text-xs italic">
                      Not configured
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-x-2">
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={() => handleEdit(policy.type)}
                    className="text-ui-fg-subtle"
                  >
                    <PencilSquare className="text-ui-fg-subtle" />
                    Edit
                  </Button>
                  {policy.content && (
                    <Button
                      size="small"
                      variant="transparent"
                      onClick={() => handleDelete(policy.type)}
                      disabled={isSaving}
                      className="text-ui-fg-subtle"
                    >
                      <Trash className="text-ui-fg-subtle" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <Drawer open={!!editingPolicy} onOpenChange={() => setEditingPolicy(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit {currentPolicy?.label}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="policy-content">Policy Content</Label>
              <Textarea
                id="policy-content"
                rows={15}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter your policy content here..."
              />
              <p className="text-xs text-ui-fg-subtle">
                This content will be displayed to customers during checkout.
              </p>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Drawer.Close>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

// Widget configuration - inject into store details page
export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StorePoliciesWidget
