import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import createVendorStoreStep from "./steps/create-vendor-store"

export type CreateVendorStoreWorkflowInput = {
  vendor_admin_id?: string
  platform_id: "SHOPIFY" | "AMAZON" | "TIKTOK"
  store_id: string
  claim_code: string
  store_info?: Record<string, any>
}

const createVendorStoreWorkflow = createWorkflow(
  "create-vendor-store",
  (input: CreateVendorStoreWorkflowInput) => {
    const vendorId = transform({ input }, ({ input }) => {
      if (!input.vendor_admin_id) {
        return null
      }

      const { data: vendorAdmins } = useQueryGraphStep({
        entity: "vendor_admin",
        fields: ["vendor.id"],
        filters: {
          id: input.vendor_admin_id,
        },
      }).config({ name: "retrieve-vendor-admins" })

      return vendorAdmins[0]?.vendor?.id || null
    })

    const vendorStore = createVendorStoreStep({
      store_id: input.store_id,
      claim_code: input.claim_code,
      vendor_id: vendorId,
    })

    const { data: vendorStores } = useQueryGraphStep({
      entity: "vendor_store",
      fields: ["*"],
      filters: {
        id: vendorStore.id,
      },
    }).config({ name: "retrieve-vendor-store" })

    return new WorkflowResponse({
      vendorStore: vendorStores[0],
    })
  }
)

export default createVendorStoreWorkflow