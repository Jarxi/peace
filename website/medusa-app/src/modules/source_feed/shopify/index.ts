import { Module } from "@medusajs/framework/utils"
import ShopifyFeedModuleService from "./service"

export const SHOPIFY_SOURCE_FEED_MODULE = "source_feed_shopify"

export default Module(SHOPIFY_SOURCE_FEED_MODULE, {
  service: ShopifyFeedModuleService,
})
