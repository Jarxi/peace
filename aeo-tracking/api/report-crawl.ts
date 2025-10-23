import crypto from 'node:crypto';
import type { BaseHandlerInput, HandlerResult } from './shared.js';
import { authenticateReporter, extractHost, getHeader, normalizeMethod, parseBody, supabase } from './shared.js';

type HandlerOptions = BaseHandlerInput;

export async function handleReportCrawl(input: HandlerOptions): Promise<HandlerResult> {
  if (normalizeMethod(input.method) !== 'POST') {
    return {
      status: 405,
      body: { error: 'Method Not Allowed' },
      headers: { Allow: 'POST' }
    };
  }

  let payload: Record<string, unknown>;
  try {
    payload = parseBody(input.body);
  } catch (error) {
    return { status: 400, body: { error: (error as Error).message } };
  }

  const domain = payload.domain?.toString();
  if (!domain) {
    return { status: 400, body: { error: 'domain is required' } };
  }

  const domainHost = extractHost(domain);

  const sourceHeader = getHeader(input.headers, 'x-source-id');
  if (!sourceHeader) {
    return { status: 400, body: { error: 'Missing X-Source-Id header' } };
  }

  const [platform, storeId] = sourceHeader.split(':');
  if (!platform || !storeId) {
    return { status: 400, body: { error: 'Malformed X-Source-Id header' } };
  }

  let source;
  try {
    source = await authenticateReporter(platform, storeId, domainHost);
  } catch (error) {
    return { status: 403, body: { error: (error as Error).message } };
  }

  const path = payload.path?.toString() || '/';
  const userAgent = payload.userAgent?.toString() || getHeader(input.headers, 'user-agent') || '';
  if (!userAgent) {
    return { status: 400, body: { error: 'userAgent is required' } };
  }

  const ip = payload.ip?.toString().trim() || null;

  const metadata = payload.metadata ?? null;

  let occurredAt = new Date();
  if (payload.occurredAt) {
    const parsed = new Date(payload.occurredAt as string);
    if (Number.isNaN(parsed.valueOf())) {
      return { status: 400, body: { error: 'occurredAt must be a valid date' } };
    }
    occurredAt = parsed;
  }

  const record = {
    event_id: crypto.randomUUID(),
    path,
    domain,
    user_agent: userAgent,
    ip,
    metadata,
    store_platform: source.platform,
    store_id: source.id,
    occurred_at: occurredAt.toISOString()
  };

  const { error } = await supabase.from('crawler_events').insert(record);
  if (error) {
    console.error('[report-crawl] Supabase insert failed', error);
    return { status: 500, body: { error: 'Failed to log crawler event' } };
  }

  return { status: 202, body: { status: 'accepted' } };
}
