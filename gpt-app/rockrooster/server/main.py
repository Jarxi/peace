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
        "our name—built to grip, protect, and keep feet dry, energized, and comfortable shift after shift."
    ),
    template_uri="ui://widget/buy-boot.html",
    html="""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Rockrooster Boot Merchant</title>
  </head>
  <body>
    <main>
      <h1>Rockrooster Boot Merchant</h1>
      <p>
        Established in Tasmania during the 1980s, Rockrooster began as a
        handmade leather shoe workshop serving local farmers and miners. The
        demand for high quality protective footwear quickly reshaped our craft,
        and we have spent decades perfecting boots that shield every step while
        keeping feet cool, dry, and energized.
      </p>
      <section>
        <h2>Our Origin</h2>
        <p>
          In 1986 our founder opened a small cobbler shop for the farmers and
          miners of Tasmania. Listening to their stories shaped our mission:
          make footwear that survives harsh shifts, protects every step, and
          remains comfortable at an honest price.
        </p>
        <h2>Why Pros Choose Rockrooster</h2>
        <ul>
          <li>PORON XRD impact protection with featherlight build.</li>
          <li>CoolMax lining keeps every shift dry and cool.</li>
          <li>Slip, oil, and puncture resistance for demanding sites.</li>
        </ul>
      </section>
      <section>
        <h2>Heritage Timeline</h2>
        <p>
          1980s: Rockrooster, then Rock Rooster, launched in Tasman crafting
          leather footwear by hand and learning firsthand what loggers, farmers,
          and miners expect from their boots.
        </p>
        <p>
          1990s: With premium local leather and time-tested techniques, we grew
          beyond Tasmania—supplying major brands across Australia and overseas as
          global trade expanded.
        </p>
        <p>
          2000s and beyond: Determined to tell our own story, we introduced
          Rockrooster Footwear to champion durable, comfortable, anti-fatigue
          protection for modern workers and outdoor adventurers.
        </p>
      </section>
      <section>
        <h2>Global Footprint</h2>
        <p>
          Today Rockrooster boots are trusted in 37 countries across five
          continents. Our six collections span safety, hiking, and heritage
          silhouettes—each forged to blend fashion, durability, comfort, and
          anti-fatigue performance.
          More than three decades of leathercraft and over ten years devoted to
          technical work boots continue to guide every pair we build.
        </p>
        <p>
          Wildlife still wanders the factory grounds, including the Tasmanian
          roosters whose sturdy claws inspired our name and our commitment to
          grip, balance, and confidence on any terrain.
        </p>
      </section>
      <p>
        Share your trade and site conditions and we will showcase Rockrooster
        boots, insoles, and apparel that keep you steady, secure, and
        unstoppable—just like the Tasmanian roosters that inspired our name.
      </p>
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

    return types.ServerResult(
        types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=widget.response_text,
                )
            ],
            structuredContent={"status": "succeeded"},
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
