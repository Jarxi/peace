import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text, toast } from "@medusajs/ui"
import { useState } from "react"

// Widget for importing products from Shopify JSON files
const ShopifyProductImport = () => {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    message: string
    success: string[]
    failed: Array<{ product: string; error: string }>
    total: number
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null) // Clear previous results
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error("Error", {
        description: "Please select a Shopify JSON file to import",
        duration: 3000,
      })
      return
    }

    setImporting(true)
    try {
      // Read file content
      const fileContent = await file.text()
      let jsonData: any

      try {
        jsonData = JSON.parse(fileContent)
      } catch (parseError) {
        throw new Error("Invalid JSON file. Please ensure the file contains valid JSON.")
      }

      // Send to admin import endpoint
      const response = await fetch("/admin/products/import/shopify-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(jsonData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const importResult = await response.json()
      setResult(importResult)

      if (importResult.failed.length === 0) {
        toast.success("Success", {
          description: `Successfully imported ${importResult.success.length} product(s)`,
          duration: 5000,
        })
      } else {
        toast.warning("Partial Success", {
          description: `Imported ${importResult.success.length} product(s), ${importResult.failed.length} failed`,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error importing products:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to import products",
        duration: 5000,
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">
          Import from Shopify
        </Heading>
        <Text className="text-sm text-ui-fg-subtle mb-4">
          Upload a Shopify GraphQL JSON export file to import products with inventory data.
          The file should contain product data in the Shopify GraphQL format with variants and inventory levels.
        </Text>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="flex flex-col gap-2">
            <label htmlFor="shopify-file" className="block">
              <div className="border-2 border-dashed border-ui-border-base rounded p-6 text-center cursor-pointer hover:border-ui-border-strong transition-colors">
                <input
                  id="shopify-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Text className="text-sm font-medium">
                    {file ? file.name : "Click to select Shopify JSON file"}
                  </Text>
                  <Text className="text-xs text-ui-fg-subtle">
                    Accepts .json files exported from Shopify GraphQL API
                  </Text>
                </div>
              </div>
            </label>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Importing..." : "Import Products"}
          </Button>

          {/* Results Display */}
          {result && (
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-ui-bg-subtle border border-ui-border-base rounded">
                <Text className="text-sm font-medium mb-2">
                  Import Summary
                </Text>
                <Text className="text-xs text-ui-fg-subtle">
                  Total: {result.total} | Success: {result.success.length} | Failed: {result.failed.length}
                </Text>
              </div>

              {result.success.length > 0 && (
                <div className="p-4 bg-ui-bg-subtle border border-ui-border-base rounded">
                  <Text className="text-sm font-medium text-ui-fg-success mb-2">
                    Successfully Imported ({result.success.length})
                  </Text>
                  <ul className="text-xs text-ui-fg-subtle space-y-1">
                    {result.success.map((productTitle, idx) => (
                      <li key={idx}>✓ {productTitle}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="p-4 bg-ui-bg-subtle border border-ui-border-base rounded">
                  <Text className="text-sm font-medium text-ui-fg-error mb-2">
                    Failed Imports ({result.failed.length})
                  </Text>
                  <ul className="text-xs text-ui-fg-subtle space-y-2">
                    {result.failed.map((failure, idx) => (
                      <li key={idx} className="border-l-2 border-ui-fg-error pl-2">
                        <div className="font-medium">{failure.product}</div>
                        <div className="text-ui-fg-muted">{failure.error}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

// Widget configuration - inject after the product list (near import actions)
export const config = defineWidgetConfig({
  zone: "product.list.after",
})

export default ShopifyProductImport
