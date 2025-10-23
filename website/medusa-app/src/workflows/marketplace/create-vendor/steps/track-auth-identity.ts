import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { IAuthModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type TrackAuthIdentityStepInput = {
    authIdentityId: string
}

/**
 * This step tracks the auth identity so it can be deleted on workflow rollback
 */
const trackAuthIdentityStep = createStep(
    "track-auth-identity",
    async (input: TrackAuthIdentityStepInput) => {
        // Just pass through - we only need the compensate function
        return new StepResponse(input.authIdentityId, input.authIdentityId)
    },
    async (authIdentityId, { container }) => {
        if (!authIdentityId) {
            return
        }

        // Delete the auth identity on rollback
        const authModuleService: IAuthModuleService =
            container.resolve(Modules.AUTH)

        await authModuleService.deleteAuthIdentities([authIdentityId])
    }
)

export default trackAuthIdentityStep
