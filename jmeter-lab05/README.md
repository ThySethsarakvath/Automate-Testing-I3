# Lab05 Exercise-A — JMeter Load Test with Cache & Queue

## Architecture

```
JMeter (50 users, 30s ramp-up)
        │
        ▼  HTTP GET /posts, /posts/1, /status
┌───────────────────────────────┐
│         api.js (Node.js)      │
│                               │
│  ┌─────────────────────────┐  │
│  │   TTL Cache (in-memory) │  │  ← CACHE layer
│  │   key → body, 60s TTL   │  │
│  └──────────┬──────────────┘  │
│             │ miss             │
│  ┌──────────▼──────────────┐  │
│  │   Worker Queue          │  │  ← QUEUE layer
│  │   max 200 concurrent    │  │
│  │   max 5000 queued       │  │
│  └──────────┬──────────────┘  │
└─────────────┼─────────────────┘
              │ HTTPS
              ▼
  jsonplaceholder.typicode.com
```

## What satisfies the assignment requirements

| Requirement | Implementation |
|---|---|
| Thread Group: 50 users | `ThreadGroup.num_threads = 50` in `plan.jmx` |
| 30-second ramp-up | `ThreadGroup.ramp_time = 30` in `plan.jmx` |
| HTTP Sampler for public API | `GET /posts`, `GET /posts/1`, `GET /status` → proxied to jsonplaceholder |
| Response Assertion | HTTP 200 + body content checked on every sampler |
| Summary Report listener | `ResultCollector (SummaryReport)` in plan |
| Headless run | `jmeter -n -t plan.jmx -l results.jtl` |
| **Cache** | `TTLCache` in `api.js` + JMeter `CacheManager` in plan |
| **Queue** | Worker queue with concurrency limit in `api.js` |

---

## Quick Start

### 1. Install JMeter locally (no system install needed)
```bash
npm run jmeter:install
```
Downloads Apache JMeter 5.6.3 into `./tools/`. Works on Windows, macOS, Linux.

### 2. Start the API server
```bash
npm start
# → api.js listening on port 3000
```

### 3. Run JMeter headlessly
```bash
npm run jmeter:run
# Equivalent to: jmeter -n -t plan.jmx -l results.jtl
```

### 4. Generate HTML report
```bash
npm run jmeter:report
# Opens jmeter-report/index.html
```

---

## Manual headless command (as per exercise requirement)
```bash
# Using local JMeter binary:
./tools/apache-jmeter-5.6.3/bin/jmeter -n -t plan.jmx -l results.jtl

# Generate HTML dashboard from results:
./tools/apache-jmeter-5.6.3/bin/jmeter -g results.jtl -o jmeter-report
```

---

## File Structure

```
jmeter-lab05/
├── api.js              ← Node.js proxy server (cache + queue)
├── package.json        ← npm scripts
├── plan.jmx            ← JMeter test plan
├── results.jtl         ← generated after run
├── jmeter-report/      ← generated HTML dashboard
│   └── index.html
├── scripts/
│   ├── install-jmeter.js
│   ├── run-jmeter.js
│   └── report-jmeter.js
└── tools/
    └── apache-jmeter-5.6.3/   ← downloaded by install script
```

---

## How Cache & Queue Work

**TTL Cache (`api.js`):**
- Stores upstream responses in memory for 60 seconds
- First user to hit `/posts` fetches from jsonplaceholder; all subsequent hits within 60s get the cached response instantly
- In-flight deduplication: if 50 users all request `/posts` simultaneously and the cache is cold, only **one** upstream fetch is made — all 50 share the result

**Worker Queue (`api.js`):**
- Limits concurrent upstream HTTPS connections to 200
- Requests beyond that limit are placed in a queue (max 5000)
- If the queue is full, the server responds with `503 Server busy`

**JMeter HTTP Cache Manager (`plan.jmx`):**
- Adds a client-side HTTP cache to JMeter itself
- Respects `Cache-Control` and `Expires` headers from responses
- Prevents JMeter from re-requesting resources that haven't changed

---

## Environment Variables (api.js)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server listen port |
| `CONCURRENCY` | `200` | Max concurrent upstream fetches |
| `MAX_QUEUE` | `5000` | Max queued requests |
| `CACHE_TTL_MS` | `60000` | Cache TTL in milliseconds |
| `CACHE_MAX_ENTRIES` | `10000` | Max cache entries |
