#!/usr/bin/env node
/**
 * http-load-test — HTTP load testing CLI
 * Zero external dependencies. Built-in modules only.
 * License: MIT
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import fs from 'fs';
import os from 'os';
import { performance } from 'perf_hooks';

const VERSION = '1.0.0';

// ─── CLI Parsing ─────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    url: null,
    concurrency: 10,
    requests: 100,
    duration: null,
    rps: null,
    method: 'GET',
    body: null,
    headers: {},
    timeout: 10000,
    keepalive: true,
    json: false,
    output: null,
    warmup: 0,
    maxRedirects: 5,
    help: false,
    version: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    switch (arg) {
      case '--help': case '-h':
        opts.help = true; break;
      case '--version': case '-v':
        opts.version = true; break;
      case '--concurrency': case '-c':
        opts.concurrency = parseInt(args[++i], 10); break;
      case '--requests': case '-n':
        opts.requests = parseInt(args[++i], 10); break;
      case '--duration': case '-d':
        opts.duration = parseFloat(args[++i]); break;
      case '--rps':
        opts.rps = parseFloat(args[++i]); break;
      case '--method': case '-m':
        opts.method = args[++i].toUpperCase(); break;
      case '--body': case '-b':
        opts.body = args[++i]; break;
      case '--header': case '-H': {
        const hdr = args[++i];
        const colon = hdr.indexOf(':');
        if (colon > 0) {
          const key = hdr.slice(0, colon).trim();
          const val = hdr.slice(colon + 1).trim();
          opts.headers[key] = val;
        }
        break;
      }
      case '--timeout':
        opts.timeout = parseInt(args[++i], 10); break;
      case '--no-keepalive':
        opts.keepalive = false; break;
      case '--json':
        opts.json = true; break;
      case '--output': case '-o':
        opts.output = args[++i]; break;
      case '--warmup':
        opts.warmup = parseInt(args[++i], 10); break;
      case '--max-redirects':
        opts.maxRedirects = parseInt(args[++i], 10); break;
      default:
        if (!arg.startsWith('-')) opts.url = arg;
    }
    i++;
  }
  return opts;
}

// ─── Help / Version ──────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
http-load-test v${VERSION} — HTTP load testing CLI

USAGE
  http-load-test <url> [options]
  hlt <url> [options]

OPTIONS
  -c, --concurrency <n>      Concurrent connections (default: 10)
  -n, --requests <n>         Total requests to send (default: 100)
  -d, --duration <s>         Run for N seconds instead of fixed count
      --rps <n>              Target requests per second (rate limiter)
  -m, --method <method>      HTTP method: GET POST PUT DELETE PATCH (default: GET)
  -b, --body <json>          Request body (string or JSON)
  -H, --header "Key: Value"  Add request header (repeatable)
      --timeout <ms>         Per-request timeout in ms (default: 10000)
      --no-keepalive         Disable HTTP keep-alive
      --warmup <n>           Warmup requests before counting stats (default: 0)
      --max-redirects <n>    Max redirect hops (default: 5)
      --json                 Output final report as JSON
  -o, --output <file>        Save report to file
  -h, --help                 Show help
  -v, --version              Show version

EXAMPLES
  hlt https://example.com
  hlt https://api.example.com/users -c 20 -n 500
  hlt https://api.example.com/users -d 30 --rps 50
  hlt https://api.example.com/data -m POST -b '{"key":"value"}' -H "Authorization: Bearer TOKEN"
  hlt https://example.com --warmup 5 --json -o report.json
`);
}

// ─── HTTP Request ─────────────────────────────────────────────────────────────

function makeRequest(opts, agent, redirectCount = 0) {
  return new Promise((resolve) => {
    const start = performance.now();
    let parsed;
    try {
      parsed = new URL(opts.url);
    } catch {
      return resolve({ ok: false, error: 'Invalid URL', latency: 0, status: 0, bytes: 0 });
    }

    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const port = parsed.port || (isHttps ? 443 : 80);

    const reqHeaders = { ...opts.headers };
    if (opts.body && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (opts.body) {
      reqHeaders['Content-Length'] = Buffer.byteLength(opts.body);
    }

    const reqOpts = {
      hostname: parsed.hostname,
      port,
      path: parsed.pathname + parsed.search,
      method: opts.method,
      headers: reqHeaders,
      agent,
      timeout: opts.timeout,
    };

    const req = lib.request(reqOpts, (res) => {
      const status = res.statusCode;

      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(status) && res.headers.location && redirectCount < opts.maxRedirects) {
        res.resume();
        const redirectUrl = new URL(res.headers.location, opts.url).toString();
        const redirectOpts = { ...opts, url: redirectUrl };
        return resolve(makeRequest(redirectOpts, agent, redirectCount + 1));
      }

      let bytes = 0;
      res.on('data', (chunk) => { bytes += chunk.length; });
      res.on('end', () => {
        const latency = performance.now() - start;
        resolve({ ok: status >= 200 && status < 400, status, latency, bytes, error: null });
      });
      res.on('error', (err) => {
        const latency = performance.now() - start;
        resolve({ ok: false, status, latency, bytes, error: err.message });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const latency = performance.now() - start;
      resolve({ ok: false, status: 0, latency, bytes: 0, error: 'Timeout' });
    });

    req.on('error', (err) => {
      const latency = performance.now() - start;
      resolve({ ok: false, status: 0, latency, bytes: 0, error: err.message });
    });

    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeStats(latencies, statusCodes, errors, bytesTotal, elapsedMs) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const elapsedSec = elapsedMs / 1000;
  const totalRequests = latencies.length;

  return {
    totalRequests,
    successCount: [...statusCodes.values()].filter((_, i) => [...statusCodes.keys()][i] >= 200).reduce((a, b) => a + b, 0),
    elapsedSec,
    rpsAchieved: totalRequests / elapsedSec,
    mbReceived: bytesTotal / (1024 * 1024),
    mbPerSec: (bytesTotal / (1024 * 1024)) / elapsedSec,
    latency: {
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      mean: mean(sorted),
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    },
    statusCodes: Object.fromEntries(statusCodes),
    errors: Object.fromEntries(errors),
    sorted,
  };
}

// ─── ASCII Histogram ──────────────────────────────────────────────────────────

function buildHistogram(sorted, width = 50) {
  if (sorted.length === 0) return '';
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const buckets = 10;
  const range = max - min || 1;
  const counts = new Array(buckets).fill(0);

  for (const v of sorted) {
    const idx = Math.min(buckets - 1, Math.floor(((v - min) / range) * buckets));
    counts[idx]++;
  }

  const maxCount = Math.max(...counts);
  const lines = [];
  lines.push('\nLatency Distribution (ms):');
  for (let i = 0; i < buckets; i++) {
    const lo = (min + (range / buckets) * i).toFixed(1);
    const hi = (min + (range / buckets) * (i + 1)).toFixed(1);
    const bar = '█'.repeat(Math.round((counts[i] / maxCount) * width));
    const label = `${lo.padStart(8)} - ${hi.padStart(8)}`;
    lines.push(`  ${label} | ${bar.padEnd(width)} ${counts[i]}`);
  }
  return lines.join('\n');
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function renderProgress(done, total, currentRps, successRate, p50, p95, isDuration, elapsedSec, durationSec) {
  const width = 30;
  let pct;
  if (isDuration) {
    pct = Math.min(1, elapsedSec / durationSec);
  } else {
    pct = total > 0 ? Math.min(1, done / total) : 0;
  }
  const filled = Math.round(pct * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const progress = isDuration
    ? `${elapsedSec.toFixed(1)}s/${durationSec}s`
    : `${done}/${total}`;
  process.stdout.write(
    `\r  [${bar}] ${progress} | RPS: ${currentRps.toFixed(1)} | OK: ${(successRate * 100).toFixed(1)}% | p50: ${p50.toFixed(0)}ms | p95: ${p95.toFixed(0)}ms  `
  );
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run(opts) {
  const parsed = new URL(opts.url);
  const isHttps = parsed.protocol === 'https:';

  const agentOpts = {
    keepAlive: opts.keepalive,
    maxSockets: opts.concurrency,
    maxFreeSockets: opts.concurrency,
    timeout: opts.timeout,
  };
  const agent = isHttps ? new https.Agent(agentOpts) : new http.Agent(agentOpts);

  // ── Warmup ──
  if (opts.warmup > 0 && !opts.json) {
    process.stdout.write(`  Warming up with ${opts.warmup} requests...\n`);
    const warmupTasks = [];
    for (let i = 0; i < opts.warmup; i++) {
      warmupTasks.push(makeRequest(opts, agent));
    }
    await Promise.all(warmupTasks);
    process.stdout.write(`  Warmup complete.\n\n`);
  }

  const latencies = [];
  const statusCodes = new Map();
  const errors = new Map();
  let bytesTotal = 0;
  let successCount = 0;
  let completedCount = 0;

  const startTime = performance.now();
  const isDuration = opts.duration !== null;
  const totalRequests = isDuration ? Infinity : opts.requests;

  // RPS tracking window
  let windowStart = startTime;
  let windowCount = 0;
  let currentRps = 0;

  // Live stats for progress
  let lastP50 = 0;
  let lastP95 = 0;

  // Update progress every 200ms
  const progressInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    const sr = completedCount > 0 ? successCount / completedCount : 0;
    renderProgress(completedCount, opts.requests, currentRps, sr, lastP50, lastP95, isDuration, elapsed, opts.duration);
  }, 200);

  // Queue-based concurrency
  let requestsSent = 0;
  let active = 0;
  let done = false;

  await new Promise((resolveAll) => {
    function maybeSpawn() {
      const elapsed = (performance.now() - startTime) / 1000;
      if (isDuration && elapsed >= opts.duration) {
        done = true;
      }
      if (!isDuration && requestsSent >= totalRequests) {
        done = true;
      }
      if (done && active === 0) {
        resolveAll();
        return;
      }
      while (active < opts.concurrency && !done) {
        const nowElapsed = (performance.now() - startTime) / 1000;
        if (isDuration && nowElapsed >= opts.duration) { done = true; break; }
        if (!isDuration && requestsSent >= totalRequests) { done = true; break; }

        // RPS throttle
        if (opts.rps !== null) {
          const expectedSent = opts.rps * nowElapsed;
          if (requestsSent >= expectedSent + opts.concurrency) {
            // Yield and retry
            setTimeout(maybeSpawn, 50);
            return;
          }
        }

        requestsSent++;
        active++;
        makeRequest(opts, agent).then((result) => {
          active--;
          completedCount++;
          windowCount++;

          // Update RPS window every second
          const now = performance.now();
          const windowElapsed = (now - windowStart) / 1000;
          if (windowElapsed >= 1) {
            currentRps = windowCount / windowElapsed;
            windowStart = now;
            windowCount = 0;
          }

          if (result.ok) successCount++;
          latencies.push(result.latency);
          bytesTotal += result.bytes || 0;

          const sc = result.status || 0;
          statusCodes.set(sc, (statusCodes.get(sc) || 0) + 1);

          if (result.error) {
            errors.set(result.error, (errors.get(result.error) || 0) + 1);
          }

          // Update live percentiles periodically
          if (completedCount % 10 === 0 && latencies.length > 0) {
            const sorted = [...latencies].sort((a, b) => a - b);
            lastP50 = percentile(sorted, 50);
            lastP95 = percentile(sorted, 95);
          }

          maybeSpawn();
        });
      }
    }
    maybeSpawn();
  });

  clearInterval(progressInterval);
  process.stdout.write('\n');

  const elapsedMs = performance.now() - startTime;
  agent.destroy();

  return computeStats(latencies, statusCodes, errors, bytesTotal, elapsedMs);
}

// ─── Report Formatting ────────────────────────────────────────────────────────

function formatReport(stats, opts) {
  const failCount = stats.totalRequests - successCount(stats);
  function successCount(s) {
    let ok = 0;
    for (const [code, count] of Object.entries(s.statusCodes)) {
      if (parseInt(code) >= 200 && parseInt(code) < 400) ok += count;
    }
    return ok;
  }
  const sc = successCount(stats);
  const fc = stats.totalRequests - sc;

  const lines = [
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '  HTTP Load Test — Final Report',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `  URL          : ${opts.url}`,
    `  Method       : ${opts.method}`,
    `  Concurrency  : ${opts.concurrency}`,
    `  Duration     : ${stats.elapsedSec.toFixed(2)}s`,
    '',
    '  ── Requests ───────────────────────────────────────',
    `  Total        : ${stats.totalRequests}`,
    `  Success      : ${sc}`,
    `  Failed       : ${fc}`,
    `  Success Rate : ${((sc / stats.totalRequests) * 100).toFixed(2)}%`,
    '',
    '  ── Throughput ─────────────────────────────────────',
    `  RPS Achieved : ${stats.rpsAchieved.toFixed(2)}`,
    `  Data Recv    : ${stats.mbReceived.toFixed(3)} MB`,
    `  Throughput   : ${stats.mbPerSec.toFixed(3)} MB/s`,
    '',
    '  ── Latency (ms) ───────────────────────────────────',
    `  Min          : ${stats.latency.min.toFixed(2)}`,
    `  Mean         : ${stats.latency.mean.toFixed(2)}`,
    `  p50 (median) : ${stats.latency.p50.toFixed(2)}`,
    `  p75          : ${stats.latency.p75.toFixed(2)}`,
    `  p90          : ${stats.latency.p90.toFixed(2)}`,
    `  p95          : ${stats.latency.p95.toFixed(2)}`,
    `  p99          : ${stats.latency.p99.toFixed(2)}`,
    `  Max          : ${stats.latency.max.toFixed(2)}`,
    '',
    '  ── Status Codes ───────────────────────────────────',
  ];

  for (const [code, count] of Object.entries(stats.statusCodes).sort()) {
    lines.push(`  ${code === '0' ? 'ERR' : code}          : ${count}`);
  }

  if (Object.keys(stats.errors).length > 0) {
    lines.push('');
    lines.push('  ── Errors ─────────────────────────────────────────');
    for (const [err, count] of Object.entries(stats.errors).sort((a, b) => b[1] - a[1])) {
      lines.push(`  [${count}x] ${err}`);
    }
  }

  lines.push(buildHistogram(stats.sorted));
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

function buildJsonReport(stats, opts) {
  function successCount(s) {
    let ok = 0;
    for (const [code, count] of Object.entries(s.statusCodes)) {
      if (parseInt(code) >= 200 && parseInt(code) < 400) ok += count;
    }
    return ok;
  }
  const sc = successCount(stats);
  return JSON.stringify({
    url: opts.url,
    method: opts.method,
    concurrency: opts.concurrency,
    elapsedSec: parseFloat(stats.elapsedSec.toFixed(3)),
    totalRequests: stats.totalRequests,
    successCount: sc,
    failCount: stats.totalRequests - sc,
    successRate: parseFloat(((sc / stats.totalRequests) * 100).toFixed(2)),
    rpsAchieved: parseFloat(stats.rpsAchieved.toFixed(2)),
    mbReceived: parseFloat(stats.mbReceived.toFixed(4)),
    mbPerSec: parseFloat(stats.mbPerSec.toFixed(4)),
    latency: {
      min: parseFloat(stats.latency.min.toFixed(2)),
      mean: parseFloat(stats.latency.mean.toFixed(2)),
      p50: parseFloat(stats.latency.p50.toFixed(2)),
      p75: parseFloat(stats.latency.p75.toFixed(2)),
      p90: parseFloat(stats.latency.p90.toFixed(2)),
      p95: parseFloat(stats.latency.p95.toFixed(2)),
      p99: parseFloat(stats.latency.p99.toFixed(2)),
      max: parseFloat(stats.latency.max.toFixed(2)),
    },
    statusCodes: stats.statusCodes,
    errors: stats.errors,
  }, null, 2);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.version) {
    console.log(`http-load-test v${VERSION}`);
    process.exit(0);
  }

  if (opts.help || !opts.url) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  // Validate URL
  try {
    const parsed = new URL(opts.url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.error('Error: URL must use http:// or https://');
      process.exit(1);
    }
  } catch {
    console.error(`Error: Invalid URL: ${opts.url}`);
    process.exit(1);
  }

  // Validate options
  if (opts.concurrency < 1) { console.error('Error: --concurrency must be >= 1'); process.exit(1); }
  if (opts.requests < 1 && !opts.duration) { console.error('Error: --requests must be >= 1'); process.exit(1); }
  if (opts.timeout < 1) { console.error('Error: --timeout must be >= 1'); process.exit(1); }

  if (!opts.json) {
    console.log(`\n  http-load-test v${VERSION}`);
    console.log(`  Target : ${opts.url}`);
    console.log(`  Method : ${opts.method} | Concurrency: ${opts.concurrency} | ${opts.duration ? `Duration: ${opts.duration}s` : `Requests: ${opts.requests}`}${opts.rps ? ` | RPS cap: ${opts.rps}` : ''}`);
    console.log('');
  }

  try {
    const stats = await run(opts);

    if (opts.json) {
      const report = buildJsonReport(stats, opts);
      if (opts.output) {
        fs.writeFileSync(opts.output, report, 'utf8');
        console.error(`Report saved to ${opts.output}`);
      } else {
        console.log(report);
      }
    } else {
      const report = formatReport(stats, opts);
      console.log(report);
      if (opts.output) {
        fs.writeFileSync(opts.output, report, 'utf8');
        console.log(`\n  Report saved to: ${opts.output}`);
      }
    }
  } catch (err) {
    console.error(`\nFatal error: ${err.message}`);
    process.exit(1);
  }
}

main();
