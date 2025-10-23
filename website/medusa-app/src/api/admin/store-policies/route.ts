import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

type StorePoliciesRequest = {
  terms_of_use_content?: string | null
  privacy_policy_content?: string | null
  return_policy_content?: string | null
}

/**
 * GET /admin/store-policies
 * Get store policy content
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const storeModuleService = req.scope.resolve(Modules.STORE)

  // Get the store
  const stores = await storeModuleService.listStores()
  const store = stores[0]

  if (!store) {
    return res.status(404).json({
      message: "Store not found",
    })
  }

  // Return policies from metadata
  const policies = {
    terms_of_use_content: store.metadata?.terms_of_use_content || null,
    privacy_policy_content: store.metadata?.privacy_policy_content || null,
    return_policy_content: store.metadata?.return_policy_content || null,
  }

  res.json({ policies })
}

/**
 * POST /admin/store-policies
 * Update store policy content
 */
export const POST = async (
  req: MedusaRequest<StorePoliciesRequest>,
  res: MedusaResponse
) => {
  const {
    terms_of_use_content,
    privacy_policy_content,
    return_policy_content,
  } = req.body

  const storeModuleService = req.scope.resolve(Modules.STORE)

  // Get the store
  const stores = await storeModuleService.listStores()
  const store = stores[0]

  if (!store) {
    return res.status(404).json({
      message: "Store not found",
    })
  }

  // Build updated metadata, only including fields that were sent in the request
  const metadataUpdate: Record<string, string | null> = { ...store.metadata }

  if (terms_of_use_content !== undefined) {
    metadataUpdate.terms_of_use_content = terms_of_use_content
  }
  if (privacy_policy_content !== undefined) {
    metadataUpdate.privacy_policy_content = privacy_policy_content
  }
  if (return_policy_content !== undefined) {
    metadataUpdate.return_policy_content = return_policy_content
  }

  // Update store metadata with policies
  const updatedStore = await storeModuleService.updateStores(store.id, {
    metadata: metadataUpdate,
  })

  const policies = {
    terms_of_use_content: updatedStore.metadata?.terms_of_use_content || null,
    privacy_policy_content: updatedStore.metadata?.privacy_policy_content || null,
    return_policy_content: updatedStore.metadata?.return_policy_content || null,
  }

  res.json({ policies })
}
