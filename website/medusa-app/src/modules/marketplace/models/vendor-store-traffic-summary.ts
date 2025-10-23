import { model } from "@medusajs/framework/utils"

const VendorStoreTrafficSummary = model
    .define("vendor_store_traffic_summary", {
        platform_id: model.text().primaryKey(),
        store_id: model.text().primaryKey(),
        primary_source: model.text().primaryKey(),
        metrics: model.json().nullable(),
    })
    .indexes([
        {
            name: "IDX_vendor_store_traffic_summary_platform_store_source",
            on: ["platform_id", "store_id", "primary_source"],
            unique: true,
        },
    ])

export default VendorStoreTrafficSummary
