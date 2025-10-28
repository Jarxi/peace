"use server"

import { sdk } from "@/lib/config"
import type { AggregatedTrafficResponse } from "@/lib/data/traffic"
import { getAuthHeaders, removeAuthToken, setAuthToken } from "./cookies"
import { redirect } from "next/navigation"

type VendorAdmin = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

type VendorMetadata = {
  description?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  return_policy?: string | null
  privacy_policy?: string | null
  shipping_policy?: string | null
  store_hours?: string | null
  location?: string | null
}

export type Vendor = {
  id: string
  name: string
  handle?: string | null
  logo?: string | null
  metadata?: VendorMetadata | null
  admins: VendorAdmin[]
  [key: string]: unknown
}

export async function vendorRegister(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const vendorName = formData.get("vendorName") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string

  let authToken: string | null = null

  try {
    // Step 1: Register with auth
    console.log("Step 1: Registering auth...")
    authToken = await sdk.auth.register("vendor", "emailpass", {
      email,
      password,
    }) as string

    await setAuthToken(authToken)

    // Step 2: Create vendor
    console.log("Step 2: Creating vendor...")
    const headers = {
      ...(await getAuthHeaders()),
    }

    const vendorData = await sdk.client.fetch("/vendors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: {
        name: vendorName,
        admin: {
          email,
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    console.log("Vendor created:", vendorData)

    // Step 3: Login again to get updated token
    console.log("Step 3: Logging in...")
    const loginToken = await sdk.auth.login("vendor", "emailpass", {
      email,
      password,
    })

    await setAuthToken(loginToken as string)

    console.log("Registration complete!")
    return { success: true }
  } catch (error: unknown) {
    console.error("Registration error:", error)

    // Rollback: Delete auth user if vendor creation failed
    if (authToken) {
      try {
        console.log("Rolling back auth registration...")
        await sdk.auth.logout()
        // Note: Medusa doesn't provide a direct delete auth identity API
        // You may need to manually clean up the database
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError)
      }
    }

    await removeAuthToken()
    return { success: false, error: String(error) }
  }
}

export async function vendorLogin(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const token = await sdk.auth.login("vendor", "emailpass", {
      email,
      password,
    })

    await setAuthToken(token as string)

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: String(error) }
  }
}

export async function vendorLogout() {
  await sdk.auth.logout()
  await removeAuthToken()
  redirect("/login")
}

export async function retrieveVendor(): Promise<{ vendor: Vendor | null; error?: string }> {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return { vendor: null }
  }

  try {
    const data = await sdk.client.fetch<{ vendor: Vendor }>("/vendors/me", {
      method: "GET",
      headers,
    })

    console.log("Retrieved vendor:", data)
    return { vendor: data.vendor }
  } catch (error) {
    console.error("Failed to retrieve vendor:", error)
    // Extract error message from the response
    const errorMessage = error instanceof Error
      ? error.message
      : "Failed to retrieve vendor account"
    return { vendor: null, error: errorMessage }
  }
}

type VendorStore = {
  id: string
  store_id: string | null
  claim_code: string | null
  claimed_at: Date | null
  vendor_id: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

type DashboardActivityEvent = {
  clientId: string
  eventType: string
  details: Array<{ description: string; url: string }>
  primarySource: string
  time: string
}

export type StoreActivity = {
  storeId: string
  events: DashboardActivityEvent[]
}

export type SourceMostPopular = {
  title: string
  url: string
  product_id?: string
  total_events?: number
}

export type SourceMetric = {
  total_events: number
  unique_users: number
  most_popular: SourceMostPopular | null
}

export type SourcePerformanceRow = {
  primary_source: string
  metrics: {
    product_view: SourceMetric
    product_added_to_cart: SourceMetric
    sale: SourceMetric
  }
}

export type StoreSourcePerformance = {
  vendor_store_id: string
  platform_id: string
  source_performance: SourcePerformanceRow[]
}

export type SourcePerformanceResponse = {
  stores: StoreSourcePerformance[]
  refreshed_at: string
}

export type SourcePerformanceMap = Record<string, SourcePerformanceRow[]>

export type DashboardSourceFilter =
  | "all"
  | "chatgpt"
  | "gemini"
  | "google"
  | "facebook"
  | "reddit"
  | "youtube"
  | "bing"
  | "duckduckgo"
  | "instagram"
  | "pinterest"
  | "copilot"
  | "claude"
  | "perplexity"
  | "mistral"

export async function checkVendorStores() {
  try {
    const headers = await getAuthHeaders()
    const data = await sdk.client.fetch<{ stores: VendorStore[], hasStores: boolean }>("/vendors/stores", {
      method: "GET",
      headers,
    })
    return { stores: data.stores, hasStores: data.hasStores, error: null }
  } catch (error) {
    console.error("Failed to check vendor stores:", error)
    return { stores: null, hasStores: false, error: String(error) }
  }
}

export async function fetchDashboardActivity(sourceFilter: DashboardSourceFilter, limit: number): Promise<StoreActivity[]> {
  try {
    const headers = await getAuthHeaders()

    if (!("authorization" in headers)) {
      return []
    }

    const params = new URLSearchParams({
      n: String(limit),
      source: sourceFilter,
    })

    const response = await sdk.client.fetch<{ stores?: unknown[] }>(
      `/vendors/dashboard/aeo/recent_activity?${params.toString()}`,
      {
        method: "GET",
        headers,
      },
    )

    const rawStores = Array.isArray(response?.stores) ? response.stores : []

    return rawStores.map((storeEntry) => {
      const storeRecord = isRecord(storeEntry) ? storeEntry : {}

      const storeId =
        typeof storeRecord.vendor_store_id === "string"
          ? storeRecord.vendor_store_id
          : "unknown-store"

      const rawActivities = Array.isArray(storeRecord.recent_activity)
        ? storeRecord.recent_activity
        : []

      const events = rawActivities.map((activityEntry) => {
        const activityRecord = isRecord(activityEntry) ? activityEntry : {}

        const eventTypeValue =
          typeof activityRecord.event_type === "string"
            ? activityRecord.event_type
            : typeof activityRecord.eventType === "string"
            ? activityRecord.eventType
            : "unknown"

        const rawDetails = Array.isArray(activityRecord.details)
          ? activityRecord.details
          : []

        const details = rawDetails
          .map((detailEntry) => {
            const detailRecord = isRecord(detailEntry) ? detailEntry : {}
            const description =
              typeof detailRecord.description === "string"
                ? detailRecord.description
                : "N/A"
            const url =
              typeof detailRecord.url === "string" ? detailRecord.url : ""

            return { description, url }
          })
          .filter((detail) => detail.description || detail.url)

        const primarySource = (() => {
          if (typeof activityRecord.primary_source === "string") {
            return activityRecord.primary_source
          }
          if (typeof activityRecord.primarySource === "string") {
            return activityRecord.primarySource
          }
          return ""
        })()

        const timeValue =
          typeof activityRecord.time === "string"
            ? activityRecord.time
            : new Date().toISOString()

        const clientId =
          typeof activityRecord.client_id === "string"
            ? activityRecord.client_id
            : "anonymous"

        return {
          clientId,
          eventType: eventTypeValue,
          details,
          primarySource,
          time: timeValue,
        }
      })

      return {
        storeId,
        events,
      }
    })
  } catch (error) {
    console.error("Failed to fetch dashboard activity:", error)
    return []
  }
}

export async function fetchSourcePerformance(): Promise<SourcePerformanceResponse> {
  try {
    const headers = await getAuthHeaders()

    if (!("authorization" in headers)) {
      return { stores: [], refreshed_at: new Date().toISOString() }
    }

    const response = await sdk.client.fetch<Partial<SourcePerformanceResponse>>(
      "/vendors/dashboard/aeo/source_performance",
      {
        method: "GET",
        headers,
      },
    )

    const stores = Array.isArray(response?.stores)
      ? (response!.stores as StoreSourcePerformance[])
      : []

    const refreshedAt =
      typeof response?.refreshed_at === "string"
        ? response.refreshed_at
        : new Date().toISOString()

    return { stores, refreshed_at: refreshedAt }
  } catch (error) {
    console.error("Failed to fetch source performance:", error)
    return { stores: [], refreshed_at: new Date().toISOString() }
  }
}

export async function fetchAggregatedTraffic(): Promise<AggregatedTrafficResponse> {
  try {
    const headers = await getAuthHeaders()

    if (!("authorization" in headers)) {
      return {
        stores: {},
        interval_hours: 0,
        timezone: "UTC",
        generated_at: new Date().toISOString(),
      }
    }

    const response = await sdk.client.fetch<Partial<AggregatedTrafficResponse>>(
      "/vendors/dashboard/aeo/aggregated",
      {
        method: "GET",
        headers,
      },
    )

    const stores =
      response?.stores && typeof response.stores === "object"
        ? (response.stores as AggregatedTrafficResponse["stores"])
        : {}

    return {
      stores,
      interval_hours:
        typeof response?.interval_hours === 'number'
          ? response.interval_hours
          : 6,
      timezone:
        typeof response?.timezone === "string" ? response.timezone : "UTC",
      generated_at:
        typeof response?.generated_at === "string"
          ? response.generated_at
          : new Date().toISOString(),
    }
  } catch (error) {
    console.error("Failed to fetch aggregated traffic:", error)
    return {
      stores: {},
      interval_hours: 0,
      timezone: "UTC",
      generated_at: new Date().toISOString(),
    }
  }
}

export async function claimStore(_currentState: unknown, formData: FormData) {
  const claimCode = formData.get("claimCode") as string

  if (!claimCode) {
    return { success: false, error: "Claim code is required" }
  }

  try {
    const headers = await getAuthHeaders()

    const result = await sdk.client.fetch<{ vendorStore: { id: string } }>("/vendors/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: {
        claim_code: claimCode,
      },
    })

    return {
      success: true,
      store: result
    }
  } catch (error) {
    console.error("Failed to claim store:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
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

export async function fetchComplianceReport(): Promise<{ report: ComplianceReport | null; error?: string }> {
  try {
    const headers = await getAuthHeaders()

    if (!("authorization" in headers)) {
      return { report: null, error: "Not authenticated" }
    }

    const response = await sdk.client.fetch<ComplianceReport>(
      "/vendors/compliance",
      {
        method: "GET",
        headers,
      },
    )

    return { report: response }
  } catch (error) {
    console.error("Failed to fetch compliance report:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    // If it's a 404, that's expected (no data yet)
    if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
      return { report: null }
    }

    return { report: null, error: errorMessage }
  }
}

export async function changePassword(_currentState: unknown, formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validate inputs
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All fields are required" }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match" }
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" }
  }

  try {
    const headers = await getAuthHeaders()

    // Call the custom change password endpoint
    const response = await sdk.client.fetch<{ success: boolean; message?: string }>(
      "/vendors/me/change-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: {
          currentPassword,
          newPassword,
        },
      }
    )

    if (response.success) {
      return { success: true }
    }

    return {
      success: false,
      error: response.message || "Failed to change password"
    }
  } catch (error: unknown) {
    console.error("Password change error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}
