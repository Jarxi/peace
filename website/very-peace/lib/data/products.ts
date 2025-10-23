"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "./cookies"

export type MedusaProduct = {
  id: string
  title: string
  subtitle?: string
  description?: string
  handle?: string
  thumbnail?: string
  status: string
  metadata?: Record<string, unknown>
  variants?: Array<{
    id: string
    title: string
    sku?: string
    barcode?: string
    ean?: string
    upc?: string
    inventory_quantity?: number
    weight?: number
    material?: string
    options?: Record<string, string>
    prices?: Array<{
      amount: number
      currency_code: string
    }>
    metadata?: Record<string, unknown>
  }>
  images?: Array<{
    id: string
    url: string
  }>
  options?: Array<{
    id: string
    title: string
    values: string[]
  }>
}

export async function fetchProducts(offset: number = 0, limit: number = 10) {
  try {
    const headers = await getAuthHeaders()

    const result = await sdk.client.fetch<{
      products: MedusaProduct[]
      count: number
      total: number
      offset: number
      limit: number
    }>(`/vendors/products?offset=${offset}&limit=${limit}`, {
      method: "GET",
      headers,
    })

    return {
      products: result.products,
      count: result.count,
      total: result.total,
      offset: result.offset,
      limit: result.limit,
      hasMore: result.products.length === limit,
    }
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return {
      products: [],
      count: 0,
      total: 0,
      offset: 0,
      limit: 10,
      hasMore: false,
      error: error instanceof Error ? error.message : "Failed to fetch products"
    }
  }
}

export async function deleteAllProducts() {
  try {
    console.log("Deleting all products...")
    const headers = await getAuthHeaders()

    console.log("Sending DELETE request to /vendors/products")
    const result = await sdk.client.fetch<{
      message: string
      deleted_count: number
    }>(`/vendors/products`, {
      method: "DELETE",
      headers,
    })

    console.log("Delete result:", result)
    return {
      success: true,
      message: result.message,
      deletedCount: result.deleted_count,
    }
  } catch (error) {
    console.error("Failed to delete products:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete products",
    }
  }
}
