import catalog from './catalog.json';

const origins = new Set(['https://l0calweb.github.io', 'null']);
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const maxBytes = 12_000;

function reply(status, headers, body) {
  return Response.json(body, {
    status,
    headers: { ...headers, 'Cache-Control': 'no-store' },
  });
}

async function parsePayload(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let content = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return JSON.parse(content + decoder.decode());
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      content += decoder.decode(value, { stream: true });
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (new URL(request.url).pathname !== '/feedback') return reply(404, {}, { error: 'not-found' });
    if (!origins.has(origin)) return reply(403, {}, { error: 'origin' });

    const headers = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '600',
        },
      });
    }
    if (request.method !== 'POST') return reply(405, { ...headers, Allow: 'POST, OPTIONS' }, { error: 'method' });
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
      return reply(415, headers, { error: 'type' });
    }
    if (Number(request.headers.get('Content-Length')) > maxBytes) return reply(413, headers, { error: 'size' });

    try {
      const key = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const { success } = await env.SUBMISSIONS.limit({ key });
      if (!success) return reply(429, { ...headers, 'Retry-After': '60' }, { error: 'rate' });

      const payload = await parsePayload(request);
      const { id, section, entryId, message } = payload ?? {};
      const title = (section === 'dela' || section === 'teme') && Number.isSafeInteger(entryId)
        ? catalog[section][entryId]
        : null;
      const note = typeof message === 'string' ? message.trim() : '';
      if (typeof id !== 'string' || !uuidPattern.test(id) || !title || note.length < 5 || note.length > 1500) {
        return reply(400, headers, { error: 'invalid' });
      }

      await env.DB.prepare(`
        INSERT INTO feedback (id, section, entry_id, title, message)
        VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING
      `).bind(id, section, entryId, title, note).run();
      return reply(200, headers, { ok: true });
    } catch {
      return reply(503, headers, { error: 'unavailable' });
    }
  },
};
