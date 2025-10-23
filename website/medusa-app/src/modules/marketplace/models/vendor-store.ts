import { model } from "@medusajs/framework/utils"
import Vendor from "./vendor"

const VendorStore = model.define("vendor_store", {
    id: model.id().primaryKey(),
    store_id: model.text().nullable(),
    claim_code: model.text().nullable(),
    claimed_at: model.dateTime().nullable(),
    vendor: model.belongsTo(() => Vendor, {
        mappedBy: "stores",
    }).nullable(),
})

export default VendorStore