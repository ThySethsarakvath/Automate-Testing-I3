#!/usr/bin/env node
'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT         = process.env.PORT            || 3000;
const CONCURRENCY  = parseInt(process.env.CONCURRENCY,  10) || 200;   // max concurrent upstream fetches
const MAX_QUEUE    = parseInt(process.env.MAX_QUEUE,     10) || 5000;  // max queued requests
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS, 10) || 60_000; // cache TTL in ms
const CACHE_MAX    = parseInt(process.env.CACHE_MAX_ENTRIES, 10) || 10_000;
const UPSTREAM_HOST = 'jsonplaceholder.typicode.com';

// ─── TTL Cache ───────────────────────────────────────────────────────────────
class TTLCache {
  constructor(ttl = CACHE_TTL_MS, max = CACHE_MAX) {
    this.ttl = ttl;
    this.max = max;
    this.map = new Map();
  }

  get(key) {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expire) { this.map.delete(key); return undefined; }
    return e.value;
  }

  set(key, value) {
    if (this.map.size >= this.max) {
      // evict oldest entry (LRU-lite: Map preserves insertion order)
      const first = this.map.keys().next().value;
      this.map.delete(first);
    }
    this.map.set(key, { value, expire: Date.now() + this.ttl });
  }

  cleanup() {
    const now = Date.now();
    for (const [k, v] of this.map) if (v.expire <= now) this.map.delete(k);
  }

  size() { return this.map.size; }
}

const cache = new TTLCache();

// ─── Worker Queue ─────────────────────────────────────────────────────────────
let currentWorkers = 0;
const queue    = [];
const inFlight = new Map(); // deduplicate concurrent fetches by cache key

function processQueue() {
  while (currentWorkers < CONCURRENCY && queue.length > 0) {
    const job = queue.shift();
    currentWorkers++;
    job().finally(() => { currentWorkers--; processQueue(); });
  }
}

function enqueueJob(job) {
  if (queue.length >= MAX_QUEUE) return false;
  queue.push(job);
  processQueue();
  return true;
}

// ─── Upstream Fetch ───────────────────────────────────────────────────────────
function fetchUpstream(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: UPSTREAM_HOST,
      port: 443,
      path,
      method: 'GET',
      headers: { 'User-Agent': 'jmeter-lab05/1.0' },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        const status = res.statusCode || 0;
        if (status >= 200 && status < 300) {
          try { resolve({ status, body: JSON.parse(data) }); }
          catch { resolve({ status, body: data }); }
        } else {
          reject(new Error(`Upstream ${status}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15_000, () => req.destroy(new Error('Timeout')));
    req.end();
  });
}

// ─── Scheduled Fetch (cache → dedup → queue) ─────────────────────────────────
function scheduleFetch(key, path) {
  // 1. cache hit
  const cached = cache.get(key);
  if (cached !== undefined) return Promise.resolve({ status: 200, body: cached });

  // 2. already in-flight — share the promise
  if (inFlight.has(key)) return inFlight.get(key);

  // 3. create a deduplication placeholder
  let resolvePlaceholder, rejectPlaceholder;
  const placeholder = new Promise((res, rej) => {
    resolvePlaceholder = res;
    rejectPlaceholder  = rej;
  });
  inFlight.set(key, placeholder);

  const job = async () => {
    try {
      const result = await fetchUpstream(path);
      if (result.status === 200) cache.set(key, result.body);
      resolvePlaceholder(result);
      return result;
    } catch (err) {
      rejectPlaceholder(err);
      throw err;
    } finally {
      inFlight.delete(key);
    }
  };

  // 4. run immediately or enqueue
  if (currentWorkers < CONCURRENCY) {
    currentWorkers++;
    job().finally(() => { currentWorkers--; processQueue(); });
  } else {
    const ok = enqueueJob(job);
    if (!ok) {
      inFlight.delete(key);
      const err = new Error('QueueFull');
      rejectPlaceholder(err);
      throw err;
    }
  }

  return placeholder;
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);

    // /status endpoint — returns internal stats
    if (u.pathname === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        port: PORT,
        concurrency: CONCURRENCY,
        currentWorkers,
        queueLength: queue.length,
        cacheSize:   cache.size(),
      }));
      return;
    }

    if (req.method !== 'GET') {
      res.writeHead(405, { Allow: 'GET' });
      res.end('Method Not Allowed');
      return;
    }

    // only /posts and /posts/:id are routed
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'posts') {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const id   = parts[1];
    const path = id ? `/posts/${id}${u.search}` : `/posts${u.search}`;
    const key  = id ? `posts:${id}${u.search}`  : `posts${u.search}`;

    // fast-path cache check before entering queue
    const hot = cache.get(key);
    if (hot !== undefined) {
      res.writeHead(200, { 'Content-Type': 'application/json', 'X-Cache': 'HIT' });
      res.end(JSON.stringify(hot));
      return;
    }

    try {
      const result = await scheduleFetch(key, path);
      res.writeHead(200, { 'Content-Type': 'application/json', 'X-Cache': 'MISS' });
      res.end(JSON.stringify(result.body));
    } catch (err) {
      if (err && err.message === 'QueueFull') {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('Server busy: queue full');
      } else {
        console.error('[upstream]', err.message);
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Upstream error');
      }
    }
  } catch (err) {
    console.error('[handler]', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Error');
    }
  }
});

// periodic cache cleanup
setInterval(() => cache.cleanup(), CACHE_TTL_MS);

server.listen(PORT, () => {
  console.log(
    `api.js  port=${PORT}  concurrency=${CONCURRENCY}  ` +
    `queue=${MAX_QUEUE}  cacheTTL=${CACHE_TTL_MS}ms`
  );
});

module.exports = { server, cache, scheduleFetch };
