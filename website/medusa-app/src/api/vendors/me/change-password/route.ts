import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { IAuthModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

// Validation schema for changing password
export const PostChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
}).strict()

type ChangePasswordRequestBody = z.infer<typeof PostChangePasswordSchema>

// POST /vendors/me/change-password - Change vendor password
export const POST = async (
    req: AuthenticatedMedusaRequest<ChangePasswordRequestBody>,
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

    const { currentPassword, newPassword } = req.validatedBody

    // Get the auth module service
    const authModuleService: IAuthModuleService = req.scope.resolve(Modules.AUTH)

    // Verify current password by attempting to authenticate
    try {
        const authResult = await authModuleService.authenticate("emailpass", {
            url: req.url || "",
            headers: req.headers as Record<string, string>,
            query: req.query as Record<string, string>,
            body: {
                email: vendorAdmin.email,
                password: currentPassword,
            },
            protocol: req.protocol || "http",
        } as any)

        if (!authResult.success) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Current password is incorrect"
            )
        }
    } catch (error) {
        console.error("Authentication error:", error)
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Current password is incorrect"
        )
    }

    // Update password using the auth provider
    try {
        const updateResult = await authModuleService.updateProvider("emailpass", {
            entity_id: vendorAdmin.email,
            password: newPassword,
        })

        if (!updateResult.success) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Failed to update password"
            )
        }
    } catch (error) {
        console.error("Password update error:", error)
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Failed to update password. Please try again."
        )
    }

    res.json({
        success: true,
        message: "Password updated successfully"
    })
}
