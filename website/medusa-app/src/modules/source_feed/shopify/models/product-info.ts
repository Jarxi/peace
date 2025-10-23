import { model } from "@medusajs/framework/utils"

const ShopifyProductInfo = model
  .define("feed_shopify.product_info", {
    store_id: model.text().primaryKey(),
    product_id: model.text().primaryKey(),
    version_id: model.id().primaryKey(),
    product_info: model.json().nullable(),
  })
  .indexes([
    {
      name: "idx_product_info_store_version",
      on: ["store_id", "version_id"],
    },

  ])

export default ShopifyProductInfo
