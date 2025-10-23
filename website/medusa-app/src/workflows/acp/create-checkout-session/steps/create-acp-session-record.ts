import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ACP_MODULE } from "../../../../modules/acp"
import AcpModuleService from "../../../../modules/acp/service"

type CreateAcpSessionRecordInput = {
  cart_id: string
  idempotency_key?: string
  request_id?: string
}

export const createAcpSessionRecordStep = createStep(
  "create-acp-session-record",
  async (input: CreateAcpSessionRecordInput, { container }) => {
    const acpModuleService = container.resolve(ACP_MODULE) as AcpModuleService

    // Create an ACP checkout session record
    const session = await acpModuleService.createAcpCheckoutSessions({
      medusa_cart_id: input.cart_id,
      status: "not_ready_for_payment",
      idempotency_key: input.idempotency_key,
      last_request_id: input.request_id,
    })

    return new StepResponse(
      {
        session_id: session.id,
      },
      {
        session_id: session.id,
      }
    )
  },
  async (compensateInput, { container }) => {
    if (!compensateInput?.session_id) {
      return
    }

    const acpModuleService = container.resolve(ACP_MODULE) as AcpModuleService
    // Delete the session if the workflow fails
    await acpModuleService.deleteAcpCheckoutSessions(compensateInput.session_id)
  }
)
