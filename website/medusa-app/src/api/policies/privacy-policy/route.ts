import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * GET /store/policies/privacy-policy
 * Returns Privacy Policy as HTML
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const storeModuleService = req.scope.resolve(Modules.STORE)

  const stores = await storeModuleService.listStores()
  const store = stores[0]

  const content = store?.metadata?.privacy_policy_content as string || "Privacy Policy not configured."

  // Return as HTML page
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            font-size: 2em;
            margin-bottom: 20px;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: inherit;
        }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <pre>${content}</pre>
</body>
</html>
  `

  res.setHeader('Content-Type', 'text/html')
  res.send(html)
}
