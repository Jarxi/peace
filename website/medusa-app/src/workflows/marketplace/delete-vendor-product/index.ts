import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/framework/utils"

type WorkflowInput = {
    vendor_admin_id: string
    product_id: string
}

// Step to verify product ownership before deletion
const verifyProductOwnershipStep = createStep(
    "verify-product-ownership-for-delete",
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
                "You do not have permission to delete this product"
            )
        }

        return new StepResponse({ verified: true })
    }
)

const deleteVendorProductWorkflow = createWorkflow(
    "delete-vendor-product",
    (input: WorkflowInput) => {
        // Verify the vendor owns this product
        verifyProductOwnershipStep({
            vendor_admin_id: input.vendor_admin_id,
            product_id: input.product_id,
        })

        // Delete the product using Medusa's built-in workflow
        deleteProductsWorkflow.runAsStep({
            input: {
                ids: [input.product_id],
            },
        })

        return new WorkflowResponse({
            deleted: true,
            id: input.product_id,
        })
    }
)

export default deleteVendorProductWorkflow
