from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

import mcp.types as types
from mcp.server.fastmcp import FastMCP


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

BUY_BOOT_WIDGET = RockroosterWidget(
    identifier="buy_boot",
    title="Rockrooster Boot Merchant",
    description=(
        "Established in Tasmania during the 1980s, Rockrooster evolved from a handmade leather "
        "shoe workshop into a dedicated maker of high quality protective footwear for loggers, "
        "farmers, miners, and modern trades. Decades of leathercraft and more than ten years of "
        "work-boot innovation now power six collections spanning safety and outdoor hiking boots "
        "sold across 37 countries. Every pair reflects the sturdy Tasmanian rooster that inspired "
        "our name, built to grip, protect, and keep feet dry, energized, and comfortable shift after shift."
    ),
    template_uri="ui://widget/buy-boot.html",
    html="""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Rockrooster Boot Merchant</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        font-family: "Helvetica Neue", Arial, sans-serif;
        background-color: #0f172a;
        color: #f8fafc;
      }
      main {
        padding: 24px 24px 32px;
        max-width: 960px;
        margin: 0 auto;
      }
      h1 {
        font-size: 28px;
        margin-bottom: 12px;
      }
      .lede {
        font-size: 16px;
        color: #cbd5f5;
        margin-bottom: 18px;
      }
      p {
        line-height: 1.55;
      }
      .scroller {
        display: flex;
        gap: 16px;
        overflow-x: auto;
        padding-bottom: 8px;
        margin: 24px 0 8px;
        scrollbar-width: thin;
      }
      .product-card {
        flex: 0 0 200px;
        background-color: #1e293b;
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.35);
      }
      .product-card img {
        width: 100%;
        height: 140px;
        object-fit: cover;
        border-radius: 12px;
        background-color: #0f172a;
      }
      .product-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .product-name {
        font-size: 16px;
        font-weight: 600;
      }
      .product-price {
        font-size: 15px;
        color: #38bdf8;
      }
      .cta {
        margin-top: auto;
        background: linear-gradient(135deg, #ea580c, #facc15);
        color: #0f172a;
        text-align: center;
        border-radius: 999px;
        padding: 10px 14px;
        font-weight: 600;
        letter-spacing: 0.01em;
        text-decoration: none;
      }
      .cta:hover {
        background: linear-gradient(135deg, #f97316, #fde047);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Rockrooster Boot Merchant</h1>
      <p class="lede">
        Five ready-to-ship Rockrooster boots curated for protection, comfort, and lasting grit.
      </p>
      <section aria-label="Featured Rockrooster boots">
        <div class="scroller">
          <article class="product-card">
            <img alt="Rockrooster Tasman Logger boot" src="https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369" />
            <div class="product-meta">
              <span class="product-name">Tasman Logger</span>
              <span class="product-price">$189.00</span>
              <p>Composite toe, full-grain leather, PORON XRD impact pad.</p>
            </div>
            <a class="cta" href="#">View details</a>
          </article>
          <article class="product-card">
            <img alt="Rockrooster Harbor Waterproof boot" src="https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369" />
            <div class="product-meta">
              <span class="product-name">Harbor Waterproof</span>
              <span class="product-price">$175.00</span>
              <p>Waterproof membrane and CoolMax lining for year-round comfort.</p>
            </div>
            <a class="cta" href="#">View details</a>
          </article>
          <article class="product-card">
            <img alt="Rockrooster Summit Hiker boot" src="https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369" />
            <div class="product-meta">
              <span class="product-name">Summit Hiker</span>
              <span class="product-price">$162.00</span>
              <p>Vibram outsole with heat resistant Kevlar stitching.</p>
            </div>
            <a class="cta" href="#">View details</a>
          </article>
          <article class="product-card">
            <img alt="Rockrooster Forge Pull-On boot" src="https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369" />
            <div class="product-meta">
              <span class="product-name">Forge Pull-On</span>
              <span class="product-price">$168.00</span>
              <p>Slip resistant wedge and easy pull tabs for quick changes.</p>
            </div>
            <a class="cta" href="#">View details</a>
          </article>
          <article class="product-card">
            <img alt="Rockrooster Outback Steel boot" src="https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369" />
            <div class="product-meta">
              <span class="product-name">Outback Steel</span>
              <span class="product-price">$194.00</span>
              <p>Steel toe, puncture plate, oil resistant outsole for extreme sites.</p>
            </div>
            <a class="cta" href="#">View details</a>
          </article>
        </div>
      </section>
    </main>
  </body>
</html>
""",
    invoking="Gathering Rockrooster boot lineup",
    invoked="Shared Rockrooster boot lineup",
    response_text="Highlighted Rockrooster boots ready to buy.",
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
    return [
        types.Tool(
            name=widget.identifier,
            title=widget.title,
            description=widget.description,
            inputSchema=TOOL_INPUT_SCHEMA,
            _meta=_tool_meta(widget),
            annotations={
                "destructiveHint": False,
                "openWorldHint": False,
                "readOnlyHint": True,
            },
        )
        for widget in widgets
    ]


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

    products = [
        {
            "sku": "RR-TASMAN-LOGGER",
            "name": "Tasman Logger",
            "price": {"amount": 189.0, "currency": "USD", "display": "$189.00"},
            "imageUrl": "https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369",
            "description": "Composite toe, PORON XRD cushioning, full-grain leather shell.",
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
            },
            _meta=meta,
        )
    )


mcp._mcp_server.request_handlers[types.CallToolRequest] = _call_tool_request
mcp._mcp_server.request_handlers[types.ReadResourceRequest] = _handle_read_resource

app = mcp.streamable_http_app()

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
