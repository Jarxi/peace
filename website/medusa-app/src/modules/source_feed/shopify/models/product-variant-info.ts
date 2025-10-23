import { model } from "@medusajs/framework/utils"

const ShopifyProductVariantInfo = model
  .define("feed_shopify.product_variant_info", {
    store_id: model.text().primaryKey(),
    product_id: model.text().primaryKey(),
    variant_id: model.text().primaryKey(),
    version_id: model.id().primaryKey(),
    variant_info: model.json().nullable(),
  })
  .indexes([
    {
      name: "idx_product_variant_info_store_product_variant",
      on: ["store_id", "product_id", "version_id"],
    },
  ])

export default ShopifyProductVariantInfo
