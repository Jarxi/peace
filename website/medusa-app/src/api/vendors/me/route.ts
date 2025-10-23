import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import MarketplaceModuleService from "../../../modules/marketplace/service"

// Validation schema for updating vendor settings
export const PostVendorMeUpdateSchema = z.object({
    name: z.string().optional(),
    handle: z.string().optional(),
    logo: z.string().optional(),
    metadata: z.object({
        // Vendor Profile Information
        description: z.string().optional(),
        contact_email: z.string().email().optional(),
        contact_phone: z.string().optional(),

        // Policy Text (displayed on platform pages)
        // URLs will be automatically generated as: {base_url}/vendors/{handle}/policies
        return_policy: z.string().optional(), // Return policy text/HTML
        privacy_policy: z.string().optional(), // Privacy policy text/HTML
        shipping_policy: z.string().optional(), // Shipping policy text/HTML

        // Store Settings
        store_hours: z.string().optional(),
        location: z.string().optional(),
    }).passthrough().optional(),
}).strict()

type UpdateVendorMeRequestBody = z.infer<typeof PostVendorMeUpdateSchema>

export const GET = async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) => {
    // Ensure the request is authenticated as a vendor
    if (!req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Unauthorized: No vendor authenticated"
        )
    }

    const marketplaceModuleService: MarketplaceModuleService =
        req.scope.resolve(MARKETPLACE_MODULE)

    // Get vendor admin by actor_id
    let vendorAdmin
    try {
        vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
            req.auth_context.actor_id,
            {
                relations: ["vendor"],
            }
        )
    } catch (error) {
        // retrieveVendorAdmin throws if not found
        vendorAdmin = null
    }

    if (!vendorAdmin) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "No vendor account found for this user. Please contact support or register as a vendor."
        )
    }

    // Get full vendor details with admins
    const vendor = await marketplaceModuleService.retrieveVendor(
        vendorAdmin.vendor_id,
        {
            relations: ["admins"],
        }
    )

    res.json({
        vendor,
    })
}

// POST /vendors/me - Update vendor settings
export const POST = async (
    req: AuthenticatedMedusaRequest<UpdateVendorMeRequestBody>,
    res: MedusaResponse
) => {
    // Ensure the request is authenticated as a vendor
    if (!req.auth_context?.actor_id) {
        throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Unauthorized: No vendor authenticated"
        )
    }

    const marketplaceModuleService: MarketplaceModuleService =
        req.scope.resolve(MARKETPLACE_MODULE)

    // Get vendor admin by actor_id
    const vendorAdmin = await marketplaceModuleService.retrieveVendorAdmin(
        req.auth_context.actor_id,
        {
            relations: ["vendor"],
        }
    )

    if (!vendorAdmin) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "No vendor account found for this user"
        )
    }

    const updateData = req.validatedBody

    // Update vendor
    await marketplaceModuleService.updateVendors({
        selector: {
            id: vendorAdmin.vendor_id,
        },
        data: updateData,
    })

    // Get full vendor details with admins
    const vendor = await marketplaceModuleService.retrieveVendor(
        vendorAdmin.vendor_id,
        {
            relations: ["admins"],
        }
    )

    res.json({
        vendor,
    })
}
