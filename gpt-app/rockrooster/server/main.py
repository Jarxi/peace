from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

import re
from urllib.parse import urlparse

import mcp.types as types
from mcp.server.fastmcp import FastMCP
from starlette.staticfiles import StaticFiles


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
    title="Rockrooster Boot Merchant",
    description="Browse five spotlighted Rockrooster boots ready to buy for demanding worksites.",
    template_uri="ui://widget/buy-boot.html",
    html=_load_widget_html("buy-boot"),
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
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

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
