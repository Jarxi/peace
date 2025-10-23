import crypto from 'node:crypto';
import type { BaseHandlerInput, HandlerResult } from './shared.js';
import { authenticateReporter, detectLlmSource, extractHost, getHeader, getOrigin, normalizeMethod, parseBody, supabase } from './shared.js';

type HandlerOptions = BaseHandlerInput;

export async function handleReportTraffic(input: HandlerOptions): Promise<HandlerResult> {
  if (normalizeMethod(input.method) !== 'POST') {
    return {
      status: 405,
      body: { error: 'Method Not Allowed' },
      headers: { Allow: 'POST' }
    };
  }

  const origin = getOrigin(input.headers);

  let payload: Record<string, unknown>;
  try {
    payload = parseBody(input.body);
  } catch (error) {
    return { status: 400, body: { error: (error as Error).message } };
  }

  const sourceHeader = getHeader(input.headers, 'x-source-id');
  if (!sourceHeader) {
    return { status: 400, body: { error: 'Missing X-Source-Id header' } };
  }

  const [platform, storeId] = sourceHeader.split(':');
  if (!platform || !storeId) {
    return { status: 400, body: { error: 'Malformed X-Source-Id header' } };
  }

  const domain = payload.domain?.toString();
  if (!domain) {
    return { status: 400, body: { error: 'domain is required' } };
  }

  const originHost = origin ? extractHost(origin) : null;
  const domainHost = extractHost(domain);
  if (originHost && domainHost && originHost !== domainHost) {
    return { status: 400, body: { error: 'domain does not match request origin' } };
  }

  let source;
  try {
    source = await authenticateReporter(platform, storeId, domainHost);
  } catch (error) {
    return { status: 403, body: { error: (error as Error).message } };
  }

  const path = payload.path?.toString() || '/';
  const primarySource = detectLlmSource(path);
  const occurredAtIso = (() => {
    if (!payload.occurredAt) return new Date().toISOString();
    const parsed = new Date(payload.occurredAt as string);
    if (Number.isNaN(parsed.valueOf())) {
      return null;
    }
    return parsed.toISOString();
  })();

  if (!occurredAtIso) {
    return { status: 400, body: { error: 'occurredAt must be a valid date' } };
  }

  const metadata = payload.metadata ?? null;

  const record = {
    event_id: crypto.randomUUID(),
    store_platform: source.platform,
    store_id: source.id,
    domain,
    path,
    type: payload.type?.toString() || 'generic',
    occurred_at: occurredAtIso,
    metadata,
    primary_source: primarySource
  };

  const { error } = await supabase.from('traffic_events').insert(record);
  if (error) {
    console.error('[report-traffic] Supabase insert failed', error);
    return { status: 500, body: { error: 'Failed to log traffic event' } };
  }

  return { status: 202, body: { status: 'accepted' } };
}
