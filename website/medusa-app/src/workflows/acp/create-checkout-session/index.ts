import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"
import { createAcpSessionRecordStep } from "./steps/create-acp-session-record"

export type CreateCheckoutSessionWorkflowInput = {
  buyer?: {
    email?: string
    name?: string
    phone?: string
  }
  line_items: Array<{
    merchant_product_id: string
    quantity: number
  }>
  fulfillment_address?: {
    address_line_1?: string
    address_line_2?: string
    city?: string
    region?: string
    postal_code?: string
    country_code?: string
  }
  region_id?: string
  sales_channel_id?: string
  idempotency_key?: string
  request_id?: string
}

const createCheckoutSessionWorkflow = createWorkflow(
  "create-checkout-session",
  (input: CreateCheckoutSessionWorkflowInput) => {
    // Transform the line items and address data
    const cartInput = transform({ input }, ({ input }) => {
      const items = input.line_items.map(item => ({
        variant_id: item.merchant_product_id,
        quantity: item.quantity,
      }))

      const shipping_address = input.fulfillment_address ? {
        first_name: input.buyer?.name?.split(' ')[0] || '',
        last_name: input.buyer?.name?.split(' ').slice(1).join(' ') || '',
        address_1: input.fulfillment_address.address_line_1 || '',
        address_2: input.fulfillment_address.address_line_2,
        city: input.fulfillment_address.city || '',
        province: input.fulfillment_address.region,
        postal_code: input.fulfillment_address.postal_code || '',
        country_code: input.fulfillment_address.country_code || '',
        phone: input.buyer?.phone,
      } : undefined

      return {
        region_id: input.region_id,
        email: input.buyer?.email || undefined,
        sales_channel_id: input.sales_channel_id,
        items,
        shipping_address,
      }
    })

    // Step 1: Create a Medusa cart with line items
    const cart = createCartWorkflow.runAsStep({
      input: cartInput,
    })

    // Step 2: Create ACP checkout session record
    const session = createAcpSessionRecordStep({
      cart_id: cart.id,
      idempotency_key: input.idempotency_key,
      request_id: input.request_id,
    })

    return new WorkflowResponse({
      session_id: session.session_id,
      cart_id: cart.id,
    })
  }
)

export default createCheckoutSessionWorkflow
