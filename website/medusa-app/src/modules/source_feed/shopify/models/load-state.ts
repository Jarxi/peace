import { model } from "@medusajs/framework/utils"

const LoadState = model
  .define("feed_shopify.load_state", {
    store_id: model.text().primaryKey(),
    version_id: model.id().primaryKey(),
    version_time: model.dateTime(),
    state: model.text(),
    metrics: model.json().nullable(),
    runtime_log: model.text().nullable(),
  })
  .indexes([
    {
      name: "idx_load_state_store_version",
      on: ["store_id", "version_time"],
    },
    {
      name: "idx_load_state_store_success_version",
      on: ["store_id", "version_time"],
      where: "state = 'success'",
    },
  ])

export default LoadState
