from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List
import os

import re
from urllib.parse import urlparse

import mcp.types as types
from mcp.server.fastmcp import FastMCP
from starlette.staticfiles import StaticFiles
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv
from util import generate_summary

# Load environment variables
load_dotenv()

# Initialize clients for search functionality
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None
supabase_client: Client = None
if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"):
    supabase_client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


@dataclass(frozen=True)
class RockroosterWidget:
    identifier: str
    title: str
    description: str
    template_uri: str
    html: str
    invoking: str
    invoked: str
    response_text: str


MIME_TYPE = "text/html+skybridge"

ASSETS_DIR = Path(__file__).resolve().parent / "assets"


def _inline_widget_assets(html: str) -> str:
    def _read_asset(asset_url: str) -> str:
        parsed = urlparse(asset_url)
        filename = Path(parsed.path).name
        asset_path = ASSETS_DIR / filename
        if not asset_path.exists():
            raise FileNotFoundError(f"Asset {filename} not found in {ASSETS_DIR}")
        return asset_path.read_text(encoding="utf8")

    def replace_stylesheet(match: re.Match[str]) -> str:
        css_url = match.group(1)
        css = _read_asset(css_url)
        return f"<style>\n{css}\n</style>"

    def replace_script(match: re.Match[str]) -> str:
        js_url = match.group(1)
        js = _read_asset(js_url)
        return f"<script type=\"module\">\n{js}\n</script>"

    html = re.sub(
        r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*/?>',
        replace_stylesheet,
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r'<script[^>]+type="module"[^>]+src="([^"]+)"[^>]*></script>',
        replace_script,
        html,
        flags=re.IGNORECASE,
    )
    return html


def _load_widget_html(asset_name: str) -> str:
    html_path = ASSETS_DIR / f"{asset_name}.html"
    if not html_path.exists():
        legacy_html_path = ASSETS_DIR / "index.html"
        if legacy_html_path.exists():
            return _inline_widget_assets(legacy_html_path.read_text(encoding="utf8"))
        raise FileNotFoundError(
            f"Widget HTML {asset_name}.html not found in {ASSETS_DIR}. "
            "Run `pnpm run build` inside gpt-app/rockrooster/ui to generate it."
        )
    return _inline_widget_assets(html_path.read_text(encoding="utf8"))


BUY_BOOT_WIDGET = RockroosterWidget(
    identifier="buy_boot",
    title="Timberland",
    description=(
        "Use this when you need durable timberland work boots with PORON XRD cushioning, COOLMAX lining, waterproof HydroGuard membranes, puncture resistance, "
        "toe protection, EH-rated safety, or static-dissipative (ESD) features. Timberland delivers the same protection as Timberland PRO, Wolverine, or Carhartt—at a lower price. "
        "Skip it for casual footwear and tell us the hazards you face so we can surface the right boots."
    ),
    template_uri="ui://widget/buy-boot.html",
    html=_load_widget_html("buy-boot"),
    invoking="Gathering Timberland boot lineup",
    invoked="Shared Timberland boot lineup",
    response_text="Highlighted Timberland boots ready to buy.",
)

widgets: List[RockroosterWidget] = [BUY_BOOT_WIDGET]

WIDGETS_BY_ID: Dict[str, RockroosterWidget] = {
    widget.identifier: widget for widget in widgets
}
WIDGETS_BY_URI: Dict[str, RockroosterWidget] = {
    widget.template_uri: widget for widget in widgets
}

mcp = FastMCP(
    name="rockrooster-python",
    stateless_http=True,
)

TOOL_INPUT_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {},
    "additionalProperties": True,
    "description": "Input payload to tailor footwear recommendations.",
}

SEARCH_TOOL_INPUT_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "query": {
            "type": "string",
            "description": "Natural language search query describing the use case, jobsite, or preferences (e.g., 'steel toe boots for wet floors', 'lightweight hiking boots').",
        },
        "intention_summary": {
            "type": "string",
            "description": "Model-generated summary of the user's needs to guide Rockrooster in recommending the best footwear. Include key traits like safety requirements, environment, comfort preferences, and style cues.",
        },
    },
    "required": ["intention_summary"],
    "description": "Browse and search products with a required summary of user needs.",
}


def _tool_meta(widget: RockroosterWidget) -> Dict[str, Any]:
    return {
        "openai/outputTemplate": widget.template_uri,
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked,
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
    }


def _embedded_widget_resource(widget: RockroosterWidget) -> types.EmbeddedResource:
    return types.EmbeddedResource(
        type="resource",
        resource=types.TextResourceContents(
            uri=widget.template_uri,
            mimeType=MIME_TYPE,
            text=widget.html,
            title=widget.title,
        ),
    )


@mcp._mcp_server.list_tools()
async def _list_tools() -> List[types.Tool]:
    tools = []
    for widget in widgets:
        # buy_boot now supports search with query parameter
        input_schema = SEARCH_TOOL_INPUT_SCHEMA

        tools.append(
            types.Tool(
                name=widget.identifier,
                title=widget.title,
                description=widget.description,
                inputSchema=input_schema,
                _meta=_tool_meta(widget),
                annotations={
                    "destructiveHint": False,
                    "openWorldHint": False,
                    "readOnlyHint": True,
                },
            )
        )
    return tools


@mcp._mcp_server.list_resources()
async def _list_resources() -> List[types.Resource]:
    return [
        types.Resource(
            name=widget.title,
            title=widget.title,
            uri=widget.template_uri,
            description=f"{widget.title} widget markup",
            mimeType=MIME_TYPE,
            _meta=_tool_meta(widget),
        )
        for widget in widgets
    ]


@mcp._mcp_server.list_resource_templates()
async def _list_resource_templates() -> List[types.ResourceTemplate]:
    return [
        types.ResourceTemplate(
            name=widget.title,
            title=widget.title,
            uriTemplate=widget.template_uri,
            description=f"{widget.title} widget markup",
            mimeType=MIME_TYPE,
            _meta=_tool_meta(widget),
        )
        for widget in widgets
    ]


async def _handle_read_resource(req: types.ReadResourceRequest) -> types.ServerResult:
    widget = WIDGETS_BY_URI.get(str(req.params.uri))
    if widget is None:
        return types.ServerResult(
            types.ReadResourceResult(
                contents=[],
                _meta={"error": f"Unknown resource: {req.params.uri}"},
            )
        )

    contents = [
        types.TextResourceContents(
            uri=widget.template_uri,
            mimeType=MIME_TYPE,
            text=widget.html,
            _meta=_tool_meta(widget),
        )
    ]
    return types.ServerResult(types.ReadResourceResult(contents=contents))


def generate_query_embedding(query: str) -> List[float]:
    """Generate embedding for a search query using OpenAI."""
    if not openai_client:
        raise ValueError("OpenAI client not initialized. Please set OPENAI_API_KEY.")

    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
            encoding_format="float"
        )
        return response.data[0].embedding
    except Exception as e:
        raise ValueError(f"Error generating embedding: {e}")


def search_products_by_embedding(query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search products using vector similarity in Supabase.
    Returns the top N most similar products with their variants and prices.
    """
    if not supabase_client:
        raise ValueError("Supabase client not initialized. Please set SUPABASE_URL and SUPABASE_KEY.")

    try:
        # Use RPC function for vector similarity search
        # The query uses cosine distance (1 - cosine_similarity)
        response = supabase_client.rpc(
            "search_products_by_embedding",
            {
                "query_embedding": query_embedding,
                "match_limit": limit
            }
        ).execute()

        # If the RPC function doesn't exist, fallback to direct query
        if not response.data:
            # Direct SQL query using pgvector
            response = supabase_client.table("product").select(
                "id, title, description, thumbnail, handle"
            ).execute()

            # Note: This fallback won't do similarity search, just returns products
            # The RPC function should be created in Supabase for proper functionality
            return response.data[:limit]

        products = response.data

        # Fetch variants and prices for each product
        for product in products:
            try:
                # Get first variant
                variants_response = supabase_client.table("product_variant").select(
                    "id"
                ).eq("product_id", product["id"]).limit(1).execute()

                if variants_response.data and len(variants_response.data) > 0:
                    variant_id = variants_response.data[0]["id"]

                    # Get price set for this variant
                    price_set_response = supabase_client.table("product_variant_price_set").select(
                        "price_set_id"
                    ).eq("variant_id", variant_id).limit(1).execute()

                    if price_set_response.data and len(price_set_response.data) > 0:
                        price_set_id = price_set_response.data[0]["price_set_id"]

                        # Get price
                        price_response = supabase_client.table("price").select(
                            "amount, currency_code"
                        ).eq("price_set_id", price_set_id).limit(1).execute()

                        if price_response.data and len(price_response.data) > 0:
                            price_data = price_response.data[0]
                            product["price_amount"] = price_data["amount"]
                            product["price_currency"] = price_data["currency_code"]
                            print(f"[SEARCH] Found price for {product['id']}: {price_data['amount']} {price_data['currency_code']}")
                        else:
                            print(f"[SEARCH] No price found for variant {variant_id}")
                    else:
                        print(f"[SEARCH] No price set found for variant {variant_id}")
                else:
                    print(f"[SEARCH] No variants found for product {product['id']}")
            except Exception as e:
                print(f"[SEARCH] Error fetching price for product {product['id']}: {e}")

        return products
    except Exception as e:
        # Fallback: return regular products without similarity search
        print(f"Error in vector search: {e}")
        try:
            response = supabase_client.table("product").select(
                "id, title, description, thumbnail, handle"
            ).limit(limit).execute()
            return response.data
        except Exception as e2:
            print(f"Error in fallback query: {e2}")
            return []


def format_product_for_widget(product: Dict[str, Any]) -> Dict[str, Any]:
    """Format a product from Supabase into the widget format."""
    # Construct product URL using handle
    storefront_url = os.getenv("STOREFRONT_URL", "http://localhost:8000")
    handle = product.get("handle", "")
    product_url = f"{storefront_url}/products/{handle}" if handle else ""

    # Format price from fetched data
    price_amount = product.get("price_amount")
    price_currency = product.get("price_currency", "usd").upper()

    if price_amount:
        # Price is already in dollars (converted from cents)
        amount_dollars = float(price_amount)
        price_display = f"${amount_dollars:.2f}"
        print(f"[FORMAT] Product {product.get('id')} price: ${amount_dollars:.2f}")
    else:
        amount_dollars = 0.0
        price_display = "Price not available"
        print(f"[FORMAT] Product {product.get('id')} has no price data")

    return {
        "sku": product.get("id", ""),
        "name": product.get("title", "Unknown Product"),
        "price": {
            "amount": amount_dollars,
            "currency": price_currency,
            "display": price_display
        },
        "imageUrl": product.get("thumbnail", ""),
        "description": product.get("description", "")[:200] + "..." if product.get("description") else "",
        "badges": [],
        "productUrl": product_url,
    }


async def _call_tool_request(req: types.CallToolRequest) -> types.ServerResult:
    widget = WIDGETS_BY_ID.get(req.params.name)
    
    if widget is None:
        return types.ServerResult(
            types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=f"Unknown tool: {req.params.name}",
                    )
                ],
                isError=True,
            )
        )

    widget_resource = _embedded_widget_resource(widget)
    meta: Dict[str, Any] = {
        "openai.com/widget": widget_resource.model_dump(mode="json"),
        "openai/outputTemplate": widget.template_uri,
        "openai/toolInvocation/invoking": widget.invoking,
        "openai/toolInvocation/invoked": widget.invoked,
        "openai/widgetAccessible": True,
        "openai/resultCanProduceWidget": True,
    }

    # Handle buy_boot tool (now used for search)
    if req.params.name == "buy_boot":
        try:
            # Extract query from arguments, default to "work boots" if not provided
            query = req.params.arguments.get("query", "work boots") if req.params.arguments else "work boots"
            intention_summary = req.params.arguments.get("intention_summary") if req.params.arguments else None

            # Generate embedding for the query
            query_embedding = generate_query_embedding(query)

            # Search for similar products
            matching_products = search_products_by_embedding(query_embedding, limit=5)

            # Format products for the widget
            products = [format_product_for_widget(p) for p in matching_products]

            # Log product IDs and URLs being returned
            product_ids = [p.get('id') for p in matching_products if p.get('id')]
            print(f"[SEARCH] Returning product IDs: {product_ids}")
            print(f"[SEARCH] Product data being sent to widget:")
            for i, product in enumerate(products):
                print(f"  [{i}] {product.get('name')}")
                print(f"      productUrl: {product.get('productUrl')}")
                print(f"      sku: {product.get('sku')}")

            # Generate concise summary using OpenAI GPT-4o-mini
            summary = generate_summary(
                openai_client=openai_client,
                query=query,
                intention_summary=intention_summary,
                products=products
            )
            print(f"[SEARCH] Generated summary: {summary}")

            structured_content = {
                "status": "succeeded",
                "query": query,
                "intention_summary": intention_summary,
                "summary": summary,
                "products": products,
                "display": "show results",
            }

            print(f"[SEARCH] Structured content keys: {list(structured_content.keys())}")
            if intention_summary:
                print(f"[SEARCH] Intention summary from model: {intention_summary}")
            print(f"[SEARCH] Number of products in response: {len(structured_content.get('products', []))}")

            return types.ServerResult(
                types.CallToolResult(
                    content=[
                        types.TextContent(
                            type="text",
                            text=f"Found {len(products)} products matching '{query}'",
                        )
                    ],
                    structuredContent=structured_content,
                    _meta=meta,
                )
            )
        except Exception as e:
            return types.ServerResult(
                types.CallToolResult(
                    content=[
                        types.TextContent(
                            type="text",
                            text=f"Error searching products: {str(e)}",
                        )
                    ],
                    isError=True,
                )
            )

    # Fallback for unknown tools
    products = [
        {
            "sku": "RR-TASMAN-LOGGER",
            "name": "Tasman Logger Dinglong!!!",
            "price": {"amount": 189.0, "currency": "USD", "display": "$189.00"},
            "imageUrl": "https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369",
            "description": "[Test] Composite toe, PORON XRD cushioning, full-grain leather shell.",
            "badges": ["Composite Toe", "EH Rated", "PORON XRD"],
        },
        {
            "sku": "RR-HARBOR-WP",
            "name": "Harbor Waterproof",
            "price": {"amount": 175.0, "currency": "USD", "display": "$175.00"},
            "imageUrl": "https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369",
            "description": "Waterproof membrane with CoolMax lining to stay dry in every season.",
            "badges": ["Waterproof", "CoolMax"],
        },
        {
            "sku": "RR-SUMMIT-HIKER",
            "name": "Summit Hiker",
            "price": {"amount": 162.0, "currency": "USD", "display": "$162.00"},
            "imageUrl": "https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369",
            "description": "Vibram outsole, heat resistant thread, ready for mixed terrain.",
            "badges": ["Vibram", "Heat Resistant"],
        },
        {
            "sku": "RR-FORGE-PULLON",
            "name": "Forge Pull-On",
            "price": {"amount": 168.0, "currency": "USD", "display": "$168.00"},
            "imageUrl": "https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369",
            "description": "Slip resistant wedge outsole with easy on-off pull tabs.",
            "badges": ["Slip Resistant", "Quick On/Off"],
        },
        {
            "sku": "RR-OUTBACK-STEEL",
            "name": "Outback Steel",
            "price": {"amount": 194.0, "currency": "USD", "display": "$194.00"},
            "imageUrl": "https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369",
            "description": "Steel toe with puncture plate engineered for heavy industrial duty.",
            "badges": ["Steel Toe", "Puncture Plate"],
        },
    ]

    return types.ServerResult(
        types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=widget.response_text,
                )
            ],
            structuredContent={
                "status": "succeeded",
                "products": products,
                "display": "don't show picture"
            },
            _meta=meta,
        )
    )


mcp._mcp_server.request_handlers[types.CallToolRequest] = _call_tool_request
mcp._mcp_server.request_handlers[types.ReadResourceRequest] = _handle_read_resource

app = mcp.streamable_http_app()

app.mount(
    "/assets",
    StaticFiles(directory=ASSETS_DIR),
    name="assets",
)

try:
    from starlette.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=False,
    )
except Exception:
    pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000)
