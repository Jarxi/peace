import type { IncomingHttpHeaders } from 'node:http';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type HeaderMap = IncomingHttpHeaders | Record<string, string | string[] | undefined>;

export interface BaseHandlerInput {
  method?: string | null;
  headers: HeaderMap;
  body: unknown;
}

export interface HandlerResult {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

export interface ReporterSource {
  platform: string;
  id: string;
}

export function getHeader(headers: HeaderMap, key: string): string | undefined {
  const value = headers[key.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export async function authenticateReporter(platform: string, storeId: string, domainHost: string | null): Promise<ReporterSource> {
  if (!platform || !storeId) {
    throw new Error('store_platform and store_id are required');
  }

  const { data, error } = await supabase
    .from('event_report_sources')
    .select('status, allowed_domains')
    .eq('store_platform', platform)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    console.error('[auth] Failed to fetch event_report_sources', error);
    throw new Error('Unable to validate reporter');
  }
  if (!data) {
    throw new Error('Reporter not registered');
  }
  if ((data.status ?? '').toLowerCase() !== 'active') {
    throw new Error('Reporter is not active');
  }

  if (domainHost) {
    const allowed = normalizeAllowedDomains(data.allowed_domains);
    if (allowed.length > 0) {
      const matches = allowed.some((allowedHost) => {
        return domainHost === allowedHost || domainHost.endsWith(`.${allowedHost}`);
      });
      if (!matches) {
        throw new Error('Domain not permitted for reporter');
      }
    }
  }

  return { platform, id: storeId };
}

function normalizeAllowedDomains(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? extractHost(item) ?? item : null))
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value === 'string') {
    const host = extractHost(value) ?? value;
    return host ? [host] : [];
  }

  if (typeof value === 'object') {
    const maybeRecord = value as Record<string, unknown>;
    if (Array.isArray(maybeRecord.domains)) {
      return normalizeAllowedDomains(maybeRecord.domains);
    }
  }

  return [];
}

export function detectLlmSource(rawPath: string): string {
  try {
    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const url = new URL(normalizedPath, 'http://placeholder');
    const utmSource = url.searchParams.get('utm_source');
    if (typeof utmSource === 'string' && utmSource.toLowerCase() === 'chatgpt.com') {
      return 'chatgpt';
    }
  } catch {
    // ignore parse errors and fall through to unknown
  }
  return 'unknown';
}

export function normalizeMethod(method?: string | null): string {
  return method ? method.toUpperCase() : 'GET';
}

export function parseBody(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) return {};
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      throw new Error('Request body must be valid JSON');
    }
  }
  if (typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  throw new Error('Request body must be a JSON object');
}

export function getOrigin(headers: HeaderMap): string | null {
  const origin = getHeader(headers, 'origin');
  if (origin) return origin;
  const referer = getHeader(headers, 'referer');
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function extractHost(value: string): string | null {
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return new URL(value).host;
    }
    return value.replace(/^\/*/, '').split('/')[0] || null;
  } catch {
    return null;
  }
}
