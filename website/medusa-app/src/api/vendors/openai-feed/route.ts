import {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import exportOpenAIFeedWorkflow from "../../../workflows/marketplace/export-openai-feed"

// GET /vendors/openai-feed - Export vendor's products in OpenAI commerce feed format
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

    // Get base URL from request or environment
    const protocol = req.protocol || 'https'
    const host = req.get('host')
    const baseUrl = process.env.STORE_URL || `${protocol}://${host}`

    // Export products using workflow
    const { result } = await exportOpenAIFeedWorkflow(req.scope).run({
        input: {
            vendor_admin_id: req.auth_context.actor_id,
            base_url: baseUrl,
        },
    })

    res.json({
        products: result.products,
        total_count: result.total_count,
        generated_at: new Date().toISOString(),
    })
}
