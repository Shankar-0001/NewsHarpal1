const http = require('http')
const { performance } = require('perf_hooks')

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3200'
const scenarios = [
  { path: '/', concurrency: 10, requestsPerWorker: 60 },
  { path: '/', concurrency: 25, requestsPerWorker: 60 },
  { path: '/', concurrency: 50, requestsPerWorker: 60 },
  { path: '/web-stories', concurrency: 25, requestsPerWorker: 60 },
  { path: '/search?q=india', concurrency: 25, requestsPerWorker: 60 },
]

function reqOnce(path) {
  return new Promise((resolve) => {
    const start = performance.now()
    const req = http.get(`${BASE}${path}`, (res) => {
      res.on('data', () => {})
      res.on('end', () => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, ms: performance.now() - start })
      })
    })
    req.on('error', () => resolve({ ok: false, status: 0, ms: performance.now() - start }))
    req.setTimeout(30000, () => {
      req.destroy()
      resolve({ ok: false, status: 0, ms: performance.now() - start, timeout: true })
    })
  })
}

async function runScenario({ path, concurrency, requestsPerWorker }) {
  const totalRequests = concurrency * requestsPerWorker
  const latencies = []
  let errors = 0
  let statuses = {}

  const started = performance.now()

  const workers = Array.from({ length: concurrency }, async () => {
    for (let i = 0; i < requestsPerWorker; i++) {
      const r = await reqOnce(path)
      latencies.push(r.ms)
      if (!r.ok) errors++
      statuses[r.status] = (statuses[r.status] || 0) + 1
    }
  })

  await Promise.all(workers)

  const elapsedSec = (performance.now() - started) / 1000
  latencies.sort((a, b) => a - b)
  const pick = (p) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))] || 0

  return {
    path,
    concurrency,
    totalRequests,
    elapsedSec: Number(elapsedSec.toFixed(2)),
    rps: Number((totalRequests / elapsedSec).toFixed(2)),
    errorRate: Number((errors / totalRequests).toFixed(4)),
    latencyMs: {
      avg: Number((latencies.reduce((a, b) => a + b, 0) / Math.max(1, latencies.length)).toFixed(2)),
      p50: Number(pick(0.5).toFixed(2)),
      p90: Number(pick(0.9).toFixed(2)),
      p95: Number(pick(0.95).toFixed(2)),
      p99: Number(pick(0.99).toFixed(2)),
      max: Number((latencies[latencies.length - 1] || 0).toFixed(2)),
    },
    statuses,
  }
}

;(async () => {
  const out = []
  for (const s of scenarios) {
    out.push(await runScenario(s))
  }
  console.log(JSON.stringify(out, null, 2))
})()
