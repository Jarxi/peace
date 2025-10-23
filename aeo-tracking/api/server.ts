import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { handleRegisterShop } from './register-shop.js';
import { handleReportCrawl } from './report-crawl.js';
import { handleReportTraffic } from './report-traffic.js';

const REPORT_CRAWL_PATH = '/report-crawl/v0';
const REPORT_TRAFFIC_PATH = '/report-traffic/v0';
const REGISTER_SHOP_PATH = '/register-shop/v0';

const DEFAULT_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, X-Source-Id, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '600',
};

function setHeaders(res: ServerResponse, extra: Record<string, string> = {}): void {
  Object.entries({ ...DEFAULT_HEADERS, ...extra }).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw || '{}';
}

function send(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  if (!res.headersSent) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
  }
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      setHeaders(res);
      send(res, 404, { error: 'Not Found' });
      return;
    }

    const host = req.headers.host ?? 'localhost';
    const { pathname } = new URL(req.url, `http://${host}`);
    const method = req.method?.toUpperCase() ?? 'GET';

    if (method === 'OPTIONS') {
      setHeaders(res, { 'Content-Length': '0' });
      res.statusCode = 204;
      res.end();
      return;
    }

    if (method !== 'POST') {
      setHeaders(res, { Allow: 'POST' });
      send(res, 405, { error: 'Method Not Allowed' });
      return;
    }

    const body = await readBody(req);

    if (pathname === REGISTER_SHOP_PATH) {
      const result = await handleRegisterShop({
        method: req.method,
        headers: req.headers,
        body,
      });
      setHeaders(res, result.headers ?? {});
      send(res, result.status, result.body);
      return;
    }

    if (pathname === REPORT_CRAWL_PATH) {
      const result = await handleReportCrawl({
        method: req.method,
        headers: req.headers,
        body,
      });
      setHeaders(res, result.headers ?? {});
      send(res, result.status, result.body);
      return;
    }

    if (pathname === REPORT_TRAFFIC_PATH) {
      const result = await handleReportTraffic({
        method: req.method,
        headers: req.headers,
        body,
      });
      setHeaders(res, result.headers ?? {});
      send(res, result.status, result.body);
      return;
    }

    setHeaders(res);
    send(res, 404, { error: 'Not Found' });
  } catch (error) {
    console.error('[api-server] Unexpected error', error);
    if (!res.headersSent) {
      setHeaders(res);
      send(res, 500, { error: 'Internal Server Error' });
    } else {
      res.end();
    }
  }
});

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`[api-server] listening on http://${HOST}:${PORT}`);
});
