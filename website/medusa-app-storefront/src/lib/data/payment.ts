"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export const listCartPaymentMethods = async (regionId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("payment_providers")),
  }

  console.log('DEBUG: Fetching payment providers for region:', regionId)

  return sdk.client
    .fetch<HttpTypes.StorePaymentProviderListResponse>(
      `/store/payment-providers`,
      {
        method: "GET",
        query: { region_id: regionId },
        headers,
        next,
        cache: "no-store", // Temporarily disable cache to see fresh data
      }
    )
    .then(({ payment_providers }) => {
      console.log('DEBUG: Received payment providers:', payment_providers)
      return payment_providers.sort((a, b) => {
        return a.id > b.id ? 1 : -1
      })
    })
    .catch((err) => {
      console.error('DEBUG: Error fetching payment providers:', err)
      return null
    })
}
