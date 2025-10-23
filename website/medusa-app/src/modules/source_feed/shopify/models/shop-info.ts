import { model } from "@medusajs/framework/utils"

const ShopifyShopInfo = model
  .define("feed_shopify.shop_info", {
    store_id: model.text().primaryKey(),
    version_id: model.id().primaryKey(),
    shop_info: model.json().nullable(),
    shipping: model.json().nullable(),
  })
  .indexes([
    {
      name: "idx_shop_info_store_version",
      on: ["store_id", "version_id"],
    },
  ])

export default ShopifyShopInfo
