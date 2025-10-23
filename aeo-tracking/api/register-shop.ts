import type { BaseHandlerInput, HandlerResult } from './shared.js';
import { extractHost, normalizeMethod, parseBody, supabase } from './shared.js';

type HandlerOptions = BaseHandlerInput;

interface SanitizedPayload {
  storePlatform: string;
  storeId: string;
  allowedDomains: string[];
}

export async function handleRegisterShop(input: HandlerOptions): Promise<HandlerResult> {
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

  const sanitized = sanitizePayload(payload);
  if ('error' in sanitized) {
    return { status: 400, body: { error: sanitized.error } };
  }

  const { storePlatform, storeId, allowedDomains } = sanitized;
  const record = {
    store_platform: storePlatform,
    store_id: storeId,
    allowed_domains: allowedDomains.length > 0 ? allowedDomains : null,
    status: 'active'
  };

  const { error } = await supabase
    .from('event_report_sources')
    .upsert(record, { onConflict: 'store_platform,store_id' });

  if (error) {
    console.error('[register-shop] Supabase upsert failed', error);
    return { status: 500, body: { error: 'Failed to register shop' } };
  }

  return {
    status: 200,
    body: {
      status: 'ok',
      store_platform: storePlatform,
      store_id: storeId,
      allowed_domains: allowedDomains
    }
  };
}

type SanitizationResult = SanitizedPayload | { error: string };

function sanitizePayload(payload: Record<string, unknown>): SanitizationResult {
  const rawPlatform = payload.store_platform;
  const rawStoreId = payload.store_id;

  const storePlatform = typeof rawPlatform === 'string' ? rawPlatform.trim() : null;
  const storeId = typeof rawStoreId === 'string' ? rawStoreId.trim() : null;

  if (!storePlatform) {
    return { error: 'store_platform is required' };
  }
  if (!storeId) {
    return { error: 'store_id is required' };
  }

  const allowedDomains = normalizeAllowedDomains(payload.allowed_domains);

  return {
    storePlatform,
    storeId,
    allowedDomains
  };
}

function normalizeAllowedDomains(value: unknown): string[] {
  if (!value) return [];

  const hosts = new Set<string>();

  const pushHost = (candidate: string | null) => {
    if (!candidate) return;
    const host = extractHost(candidate.trim());
    if (host) {
      hosts.add(host.toLowerCase());
    }
  };

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === 'string') {
        pushHost(item);
      }
    });
  } else if (typeof value === 'string') {
    value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .forEach((item) => pushHost(item));
  } else if (typeof value === 'object') {
    const maybeRecord = value as Record<string, unknown>;
    if (Array.isArray(maybeRecord.domains)) {
      return normalizeAllowedDomains(maybeRecord.domains);
    }
    return [];
  }

  return Array.from(hosts);
}

