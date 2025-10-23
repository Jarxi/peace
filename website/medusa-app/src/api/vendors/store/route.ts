import { z } from "zod"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import MarketplaceModuleService from "../../../modules/marketplace/service"

export const PostVendorStoreCreateSchema = z.object({
    claim_code: z.string(),
}).strict()

type VendorStoreRequestBody = z.infer<typeof PostVendorStoreCreateSchema>

export const POST = async (
    req: AuthenticatedMedusaRequest<VendorStoreRequestBody>,
    res: MedusaResponse
) => {
    // Ensure the request is authenticated
    if (!req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Unauthorized: No vendor authenticated"
        )
    }

    const marketplaceModuleService: MarketplaceModuleService =
        req.scope.resolve(MARKETPLACE_MODULE)

    // Get vendor admin to get vendor_id
    const vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
        req.auth_context.actor_id,
        {
            relations: ["vendor"],
        }
    )

    if (!vendorAdmin || !vendorAdmin.vendor_id) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "No vendor account found for this user"
        )
    }

    const { claim_code } = req.validatedBody

    // Special test claim code - bypass database check
    if (claim_code === "shopify-testClaimCode") {
        const vendorStore = await marketplaceModuleService.createVendorStores({
            store_id: "test-store-id",
            claim_code,
            claimed_at: new Date(),
            vendor_id: vendorAdmin.vendor_id,
        })

        return res.json({
            vendorStore,
        })
    }

    // Find the claim code in vendor_store_claim_state
    const claimStates = await marketplaceModuleService.listVendorStoreClaimStates({
        claim_code,
    })

    if (!claimStates || claimStates.length === 0) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "Invalid claim code"
        )
    }

    const claimState = claimStates[0]

    // Check if already claimed
    if (claimState.claimed_at) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "This claim code has already been used"
        )
    }

    // Create vendor_store record
    const vendorStore = await marketplaceModuleService.createVendorStores({
        store_id: claimState.store_id,
        claim_code,
        claimed_at: new Date(),
        vendor_id: vendorAdmin.vendor_id,
    })

    // Update claim state to mark as claimed
    await marketplaceModuleService.updateVendorStoreClaimStates({
        selector: {
            platform_id: claimState.platform_id,
            store_id: claimState.store_id,
        },
        data: {
            claimed_at: new Date(),
            vendor_id: vendorAdmin.vendor_id,
        },
    })

    res.json({
        vendorStore,
    })
}