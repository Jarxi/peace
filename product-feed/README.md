# product-feed

Minimal pipeline bootstrap for pulling Shopify Admin API snapshots with a platform-aware layout.

## Usage

1. Create `platforms/shopify/shops.json` (already ignored by Git via the root `.gitignore`) with entries like:
   ```json
   {
     "stores": [
       {
         "store_id": "your-store-id",
         "admin_token": "shpat_your_admin_token",
         "enabled": true,
         "return_window_days": 30
       }
     ]
   }
   ```
   Share the file securely and keep it out of source control. Set `"enabled": false` to temporarily skip a store. `"return_window_days"` is required for any enabled store and surfaces a structured return window in the captured snapshot.
2. Ensure you are running on Python 3.11+ (the script only relies on the standard library).
3. Run the snapshot script (it defaults to `product-feed/platforms/shopify/shops.json` for secrets if you omit `--config`):
   ```bash
   python platforms/shopify/fetch_admin.py --config platforms/shopify/shops.json
   ```
   The script paginates through all products via the Admin GraphQL API and captures end-customer detail including:
   - plain-text `description` plus rich `descriptionHtml`
   - `vendor` (brand), `productType`, `tags`, and an optional material metafield (`metafield(namespace="custom", key="material")`)
   - product imagery (`featuredImage`, `images.edges`), collection membership (`collections.edges`), and canonical storefront links (`products.edges[].node.productUrl`)
   - per-variant data such as barcode/GTIN, SKU, measurement-derived weight (`inventoryItem.measurement.weight`), and storefront URLs (`products.edges[].node.variants.edges[].node.variantUrl`)
   - shop-level policy links (`shop.policyUrls`), structured shipping rates (`shop.shippingRates` in `country:region:service_class:price` format, e.g. `US:CA:Overnight:16.00 USD`), and the configured return window (`shop.returnWindowDays`)
   Snapshots land in `data/shopify/raw-admin/<store_id>/<timestamp>.json`, trimming to the 30 most recent files per store by default. Use `--page-size` if you need to change per-request batch size, and `--history-retention` to adjust how many historical snapshots are kept per store. Pass `--log-to-stdout` during local development to mirror log lines in the console instead of `/tmp/integrations/product-feed/shopify/log`.
4. Inspect run logs under `/tmp/integrations/product-feed/shopify/log/` (each run writes `admin-<timestamp>.log`, mirrors the latest run to `admin-latest.log`, and older per-run files are pruned after 30 runs).

The next phase will materialize these raw captures into the database and expose enriched exports once the enrichment logic is ready.

## Layout

- `platforms/<platform>/` contains platform-specific collectors (currently Shopify via `fetch_admin.py`).
- `common/` is reserved for shared helpers to be reused across platforms.
- Snapshots default to `data/<platform>/` within each component directory, and logs default to `/tmp/integrations/product-feed/<platform>/log/`.
