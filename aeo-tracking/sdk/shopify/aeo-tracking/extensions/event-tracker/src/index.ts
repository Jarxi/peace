import { register } from "@shopify/web-pixels-extension";

const REPORT_ENDPOINT = "https://api.Peace.ai/report-traffic/v0";
const DEFAULT_SOURCE_ID = "shopify;unknown";

register(({ analytics, settings }) => {
  analytics.subscribe("all_events", (event) => {
    const shopId = stringValue(settings.shopId);
    const sourceId = shopId ? `shopify;${shopId}` : DEFAULT_SOURCE_ID;
    const payload = buildPayload(event as Record<string, unknown> | null | undefined);
    if (!payload) {
      return;
    }

    void fetch(REPORT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Source-Id": sourceId,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((error) => {
      console.error("[event-tracker] Failed to report event", error);
    });
  });
});

interface EventPayload {
  name?: unknown;
  type?: unknown;
  clientTimestamp?: unknown;
  data?: unknown;
  context?: Record<string, unknown>;
}

function buildPayload(rawEvent: Record<string, unknown> | null | undefined) {
  if (!rawEvent || typeof rawEvent !== "object") {
    return null;
  }

  const event = rawEvent as EventPayload;

  const eventType = stringValue(event.name) || stringValue(event.type) || "unknown";
  const occurredAt = stringValue(event.clientTimestamp) ?? new Date().toISOString();

  const location = resolveLocation(event.context);
  if (!location) {
    return null;
  }

  const path = `${location.pathname ?? "/"}${location.search ?? ""}`;

  const referer = resolveReferer(event.context);

  const metadata = buildMetadata(event, referer);
  if (!metadata) {
    return null;
  }

  return {
    domain: location.origin ?? location.fallbackOrigin,
    path,
    type: eventType,
    occurredAt,
    metadata,
  };
}

interface LocationDetails {
  origin: string | null;
  fallbackOrigin: string | null;
  pathname: string | null;
  search: string | null;
}

function resolveLocation(context?: Record<string, unknown>): LocationDetails | null {
  if (!context) {
    return null;
  }

  const windowLocation = objectValue(objectValue(context, "window"), "location");
  const documentLocation = objectValue(objectValue(context, "document"), "location");
  const location = windowLocation ?? documentLocation;

  if (!location) {
    return null;
  }

  const origin = stringValue(location.origin);
  const protocol = stringValue(location.protocol) ?? "https:";
  const host = stringValue(location.host) ?? stringValue(location.hostname);

  return {
    origin,
    fallbackOrigin: host ? `${protocol}//${host}` : null,
    pathname: stringValue(location.pathname),
    search: stringValue(location.search),
  };
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function objectValue(source: Record<string, unknown> | null | undefined, key: string) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null;
  }
  const value = (source as Record<string, unknown>)[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function resolveReferer(context?: Record<string, unknown>): string | null {
  if (!context) {
    return null;
  }

  const documentReferrer = stringValue(objectValue(context, "document")?.referrer);
  if (documentReferrer) {
    return documentReferrer;
  }

  const windowDocument = objectValue(objectValue(context, "window"), "document");
  return stringValue(windowDocument?.referrer);
}

function buildMetadata(event: EventPayload, referer: string | null) {
  const metadata: Record<string, unknown> = {};

  const eventObj = event as Record<string, unknown>;
  const clientId = stringValue(eventObj.clientId);
  if (clientId) {
    metadata.clientId = clientId;
  }

  const sessionId = stringValue(eventObj.sessionId) ?? stringValue(eventObj.visitId);
  if (sessionId) {
    metadata.sessionId = sessionId;
  }

  if (event.data !== undefined) {
    metadata.data = event.data;

    const orderId = extractNestedId(event.data, "order");
    if (orderId) {
      metadata.orderId = orderId;
    }

    const checkoutId = extractNestedId(event.data, "checkout");
    if (checkoutId) {
      metadata.checkoutId = checkoutId;
    }
  }

  if (referer) {
    metadata.referer = referer;
  }

  return Object.keys(metadata).length > 0 ? metadata : null;
}

function extractNestedId(data: unknown, key: string): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const nested = record[key];
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return stringValue((nested as Record<string, unknown>).id);
  }

  return null;
}
