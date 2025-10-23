import { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"
import {
    createWorkflow,
    transform,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
    createProductsWorkflow,
    createRemoteLinkStep,
    useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import { Modules } from "@medusajs/framework/utils"

type WorkflowInput = {
    vendor_admin_id: string
    product: CreateProductWorkflowInputDTO
}

const createVendorProductWorkflow = createWorkflow(
    "create-vendor-product",
    (input: WorkflowInput) => {
        // Retrieve vendor admin and their vendor
        const { data: vendorAdmins } = useQueryGraphStep({
            entity: "vendor_admin",
            fields: ["vendor.id", "vendor.name"],
            filters: {
                id: input.vendor_admin_id,
            },
        }).config({ name: "retrieve-vendor-admin" })

        // Retrieve default sales channel to make the product available
        const { data: stores } = useQueryGraphStep({
            entity: "store",
            fields: ["default_sales_channel_id"],
        }).config({ name: "retrieve-store" })

        // Prepare product data with sales channel and OpenAI metadata
        const productData = transform(
            {
                input,
                stores,
                vendorAdmins,
            },
            (data) => {
                const defaultSalesChannelId = (data.stores?.[0]?.default_sales_channel_id ?? undefined) as string | undefined

                // Ensure metadata includes OpenAI commerce feed fields
                const metadata = {
                    ...data.input.product.metadata,
                    // Add vendor as seller_name for OpenAI feed
                    seller_name: data.vendorAdmins[0].vendor.name,
                }

                return {
                    products: [
                        {
                            ...data.input.product,
                            metadata,
                            sales_channels: defaultSalesChannelId
                                ? [
                                      {
                                          id: defaultSalesChannelId,
                                      },
                                  ]
                                : undefined,
                        },
                    ],
                }
            }
        )

        // Create the product using Medusa's built-in workflow
        const createdProducts = createProductsWorkflow.runAsStep({
            input: productData,
        })

        // Create link between vendor and product
        const linksToCreate = transform(
            {
                createdProducts,
                vendorAdmins,
            },
            (data) => {
                return data.createdProducts.map((product) => {
                    return {
                        [MARKETPLACE_MODULE]: {
                            vendor_id: data.vendorAdmins[0].vendor.id,
                        },
                        [Modules.PRODUCT]: {
                            product_id: product.id,
                        },
                    }
                })
            }
        )

        createRemoteLinkStep(linksToCreate)

        // Retrieve the complete product with all relations
        const { data: products } = useQueryGraphStep({
            entity: "product",
            fields: ["*", "variants.*", "images.*", "options.*"],
            filters: {
                id: createdProducts[0].id,
            },
        }).config({ name: "retrieve-created-product" })

        return new WorkflowResponse({
            product: products[0],
        })
    }
)

export default createVendorProductWorkflow
