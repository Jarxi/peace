import { model } from "@medusajs/framework/utils"

const VendorStoreClaimState = model.define("vendor_store_claim_state", {
    platform_id: model.text().primaryKey(),
    store_id: model.text().primaryKey(),
    store_info: model.json().nullable(),
    vendor_id: model.text().nullable(),
    claim_code: model.text().nullable(),
    claimed_at: model.dateTime().nullable(),
    deletion_requested_at: model.dateTime().nullable(),
})

export default VendorStoreClaimState
