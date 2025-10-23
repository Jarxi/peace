import { UpdateProductWorkflowInputDTO } from "@medusajs/framework/types"
import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
    updateProductsWorkflow,
    useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/framework/utils"

type WorkflowInput = {
    vendor_admin_id: string
    product_id: string
    product: UpdateProductWorkflowInputDTO
}

// Step to verify product ownership
const verifyProductOwnershipStep = createStep(
    "verify-product-ownership",
    async (
        { vendor_admin_id, product_id }: { vendor_admin_id: string; product_id: string },
        { container }
    ) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)

        // Get vendor admin and their vendor
        const { data: [vendorAdmin] } = await query.graph({
            entity: "vendor_admin",
            fields: ["vendor.id"],
            filters: {
                id: [vendor_admin_id],
            },
        })

        if (!vendorAdmin) {
            throw new MedusaError(
                MedusaError.Types.UNAUTHORIZED,
                "Vendor admin not found"
            )
        }

        // Check if product belongs to vendor
        const { data: [product] } = await query.graph({
            entity: "product",
            fields: ["id", "vendor.id"],
            filters: {
                id: [product_id],
            },
        })

        if (!product) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                "Product not found"
            )
        }

        if (product.vendor?.id !== vendorAdmin.vendor.id) {
            throw new MedusaError(
                MedusaError.Types.UNAUTHORIZED,
                "You do not have permission to update this product"
            )
        }

        return new StepResponse({ verified: true })
    }
)

const updateVendorProductWorkflow = createWorkflow(
    "update-vendor-product",
    (input: WorkflowInput) => {
        // Verify the vendor owns this product
        verifyProductOwnershipStep({
            vendor_admin_id: input.vendor_admin_id,
            product_id: input.product_id,
        })

        // Update the product using Medusa's built-in workflow
        updateProductsWorkflow.runAsStep({
            input: {
                products: [
                    {
                        id: input.product_id,
                        ...input.product,
                    },
                ],
            },
        })

        // Retrieve the updated product with all relations
        const { data: products } = useQueryGraphStep({
            entity: "product",
            fields: ["*", "variants.*", "images.*", "options.*", "vendor.*"],
            filters: {
                id: input.product_id,
            },
        })

        return new WorkflowResponse({
            product: products[0],
        })
    }
)

export default updateVendorProductWorkflow
