"use server"

import { supabase } from "@/lib/supabase"
import { retrieveVendor } from "./vendor"
import { sdk } from "@/lib/config"
import { getAuthHeaders } from "./cookies"

type ComplianceAnalysis = {
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

type UploadResult = {
  success: boolean
  error?: string
  warning?: string
  filename?: string
  url?: string
  analysis?: ComplianceAnalysis
}

export async function uploadCatalogFile(_currentState: unknown, formData: FormData): Promise<UploadResult> {
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "No file provided" }
  }

  // Validate file type
  if (!file.name.endsWith('.json')) {
    return { success: false, error: "Please upload a JSON file" }
  }

  // Get vendor information
  const { vendor, error: vendorError } = await retrieveVendor()
  if (!vendor || vendorError) {
    return { success: false, error: "Failed to identify vendor. Please log in again." }
  }

  // Helper function to extract options from variants when options aren't provided
  function extractOptionsFromVariants(variants: Record<string, unknown>[]): Record<string, unknown>[] {
    const optionsMap = new Map<string, Set<string>>()

    variants.forEach(variant => {
      if (variant.selectedOptions && Array.isArray(variant.selectedOptions)) {
        variant.selectedOptions.forEach((opt: Record<string, unknown>, index: number) => {
          const optionName = (opt.name as string) || `Option${index + 1}`
          if (!optionsMap.has(optionName)) {
            optionsMap.set(optionName, new Set())
          }
          if (opt.value && typeof opt.value === 'string') {
            optionsMap.get(optionName)!.add(opt.value)
          }
        })
      }
    })

    const options: Record<string, unknown>[] = []
    let position = 1
    optionsMap.forEach((values, name) => {
      options.push({
        name,
        position,
        values: Array.from(values),
      })
      position++
    })

    return options
  }

  try {
    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate JSON
    let jsonData
    try {
      jsonData = JSON.parse(buffer.toString('utf-8'))

      // Validate it's GraphQL format: { data: { products: { edges: [...] }, shop: {...} } }
      if (!jsonData.data?.products?.edges || !Array.isArray(jsonData.data.products.edges)) {
        return {
          success: false,
          error: "Invalid file format. Expected Shopify GraphQL format with data.products.edges array."
        }
      }

      // Validate we have products
      if (jsonData.data.products.edges.length === 0) {
        return { success: false, error: "No products found in the file." }
      }
    } catch {
      return { success: false, error: "Invalid JSON file. Please check your file format." }
    }

    // Create filename with vendor ID and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${vendor.id}/${timestamp}-${file.name}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('vendor-catalogs')
      .upload(filename, buffer, {
        contentType: 'application/json',
        upsert: false,
      })

    if (error) {
      console.error("Supabase upload error:", error)
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      }
    }

    // Get public URL (optional)
    const { data: urlData } = supabase.storage
      .from('vendor-catalogs')
      .getPublicUrl(filename)

    // Analyze products for ACP compliance (vendors get compliance report, not actual import)
    console.log("Analyzing products for ACP compliance...")
    try {
      const headers = await getAuthHeaders()

      const analysisResult = await sdk.client.fetch<ComplianceAnalysis>("/analyze/products/shopify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: jsonData,
      })

      console.log("Compliance analysis result:", analysisResult)

      return {
        success: true,
        filename: data.path,
        url: urlData?.publicUrl,
        analysis: analysisResult
      }
    } catch (analysisError) {
      console.error("Analysis error:", analysisError)
      // Still return success for upload, but note analysis failed
      return {
        success: true,
        filename: data.path,
        url: urlData?.publicUrl,
        warning: `File uploaded but compliance analysis failed: ${analysisError instanceof Error ? analysisError.message : "Unknown error"}`
      }
    }
  } catch (error) {
    console.error("Upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}
