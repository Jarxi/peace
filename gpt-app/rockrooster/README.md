# Rockrooster MCP App

Follow this flow whenever you want to run the Rockrooster widget against ChatGPT:

1. **Build the widget assets**
   ```bash
   cd gpt-app/rockrooster/ui
   pnpm install          # first run only
   pnpm run build
   ```
   This drops the compiled HTML/JS/CSS into `gpt-app/rockrooster/server/assets/`. The MCP server inlines the bundles automatically, so you don’t have to copy anything by hand.

2. **Start the MCP server**
   ```bash
   cd gpt-app/rockrooster/server
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The server exposes both the MCP transport and the `/assets` static mount that the build step populated.

3. **Expose the server with ngrok**
   ```bash
   ngrok http 8000
   ```
   Grab the HTTPS forwarding URL from ngrok (for example, `https://your-subdomain.ngrok-free.app`) and use it when registering the connector inside ChatGPT.

4. **(Optional) Regenerate with a custom `BASE_URL`**
   If you want the HTML to reference an external CDN instead of inlining, rebuild with:
   ```bash
   cd gpt-app/rockrooster/ui
   BASE_URL=https://your-subdomain.ngrok-free.app/assets pnpm run build
   ```
   Restart `uvicorn` after rebuilding so the latest HTML (and inline bundle) is served.

Whenever you change the UI, repeat steps 1 and 2 before testing the connector in ChatGPT.
