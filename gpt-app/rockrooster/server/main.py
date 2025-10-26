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

RECOMMEND_FOOTWEAR_WIDGET = RockroosterWidget(
    identifier="recommend_footwear",
    title="Rockrooster Fit Finder",
    description=(
        "Celebrate Rockrooster's rugged Australian heritage while discovering "
        "lightweight, long-wear safety boots tailored to your workday."
    ),
    template_uri="ui://widget/recommend-footwear.html",
    html="""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Rockrooster Fit Finder</title>
  </head>
  <body>
    <main>
      <h1>Rockrooster Fit Finder</h1>
      <p>
        Rockrooster has crafted hardworking footwear for makers and trade
        professionals since 1980, blending Australian grit with all-day comfort.
      </p>
      <section>
        <h2>Why Pros Choose Rockrooster</h2>
        <ul>
          <li>PORON XRD impact protection with featherlight build.</li>
          <li>CoolMax lining keeps every shift dry and cool.</li>
          <li>Slip, oil, and puncture resistance for demanding sites.</li>
        </ul>
      </section>
      <p>
        Tell us about your terrain and tasks—we will line up the best
        Rockrooster models to keep you steady, secure, and unstoppable.
      </p>
    </main>
  </body>
</html>
""",
    invoking="Gathering footwear picks",
    invoked="Shared footwear picks",
    response_text="Served Rockrooster footwear picks grounded in our heritage.",
)

widgets: List[RockroosterWidget] = [RECOMMEND_FOOTWEAR_WIDGET]

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
            structuredContent={"status": "pending"},
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
