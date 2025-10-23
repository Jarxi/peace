import { model } from "@medusajs/framework/utils"

const TrafficAggregated = model
  .define("traffic_aggregated", {
    id: model.id().primaryKey(),
    platform_id: model.text(),
    store_id: model.text(),
    primary_source: model.text(),
    hour_bucket: model.dateTime(),
    metrics: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_vendor_store_traffic_aggregated_store",
      on: ["platform_id", "store_id"],
    },
  ])

export default TrafficAggregated
