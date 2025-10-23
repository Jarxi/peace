import { model } from "@medusajs/framework/utils"

const VendorClientSource = model.define("vendor_client_source", {
    platform_id: model.text().primaryKey(),
    store_id: model.text().primaryKey(),
    client_id: model.text().primaryKey(),
    source: model.text(),
})

export default VendorClientSource
