import { model } from "@medusajs/framework/utils"

const ShopifyAcpExport = model
  .define("feed_shopify.acp_export", {
    store_id: model.text().primaryKey(),
    shop_info: model.json(),
    products: model.json(),
  })
  .indexes([
    {
      name: "idx_acp_export_store",
      on: ["store_id"],
    },
  ])

export default ShopifyAcpExport
