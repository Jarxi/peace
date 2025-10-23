import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import exportOpenAIFeedWorkflow from "../../workflows/marketplace/export-openai-feed"

// GET /openai-feed - Export all marketplace products in OpenAI commerce feed format
// This is a public endpoint for the entire marketplace
export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    // Get base URL from request or environment
    const protocol = req.protocol || 'https'
    const host = req.get('host')
    const baseUrl = process.env.STORE_URL || `${protocol}://${host}`

    // Export all products (no vendor_admin_id filter)
    const { result } = await exportOpenAIFeedWorkflow(req.scope).run({
        input: {
            base_url: baseUrl,
        },
    })

    res.json({
        products: result.products,
        total_count: result.total_count,
        generated_at: new Date().toISOString(),
    })
}
