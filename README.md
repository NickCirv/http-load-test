# http-load-test

HTTP load testing CLI — concurrency, RPS control, latency percentiles, ASCII histogram.

**Zero external dependencies.** Built-in Node.js modules only (`http`, `https`, `url`, `fs`, `os`, `perf_hooks`).

## Install

```bash
npm install -g http-load-test
```

Or run directly with npx:

```bash
npx http-load-test https://example.com
```

## Usage

```
http-load-test <url> [options]
hlt <url> [options]
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `-c, --concurrency <n>` | 10 | Concurrent connections |
| `-n, --requests <n>` | 100 | Total requests to send |
| `-d, --duration <s>` | — | Run for N seconds (overrides --requests) |
| `--rps <n>` | — | Target requests per second (rate limiter) |
| `-m, --method <method>` | GET | HTTP method: GET POST PUT DELETE PATCH |
| `-b, --body <string>` | — | Request body |
| `-H, --header "Key: Value"` | — | Add request header (repeatable) |
| `--timeout <ms>` | 10000 | Per-request timeout |
| `--no-keepalive` | — | Disable HTTP keep-alive |
| `--warmup <n>` | 0 | Warmup requests excluded from stats |
| `--max-redirects <n>` | 5 | Max redirect hops |
| `--json` | — | Output final report as JSON |
| `-o, --output <file>` | — | Save report to file |
| `-h, --help` | — | Show help |
| `-v, --version` | — | Show version |

## Examples

**Basic test — 100 requests, 10 concurrent:**
```bash
hlt https://example.com
```

**High concurrency, 500 requests:**
```bash
hlt https://api.example.com/users -c 20 -n 500
```

**Duration-based test — 30 seconds, capped at 50 RPS:**
```bash
hlt https://api.example.com/users -d 30 --rps 50
```

**POST with JSON body and auth header:**
```bash
hlt https://api.example.com/data \
  -m POST \
  -b '{"key":"value"}' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**With warmup requests, JSON output saved to file:**
```bash
hlt https://example.com --warmup 5 --json -o report.json
```

**Quick benchmark against localhost:**
```bash
hlt http://localhost:3000/api/health -c 50 -n 1000
```

## Sample Output

```
  http-load-test v1.0.0
  Target : https://example.com
  Method : GET | Concurrency: 10 | Requests: 100

  [██████████████████████████████] 100/100 | RPS: 48.2 | OK: 100.0% | p50: 201ms | p95: 387ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HTTP Load Test — Final Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  URL          : https://example.com
  Method       : GET
  Concurrency  : 10
  Duration     : 2.07s

  ── Requests ───────────────────────────────────────
  Total        : 100
  Success      : 100
  Failed       : 0
  Success Rate : 100.00%

  ── Throughput ─────────────────────────────────────
  RPS Achieved : 48.21
  Data Recv    : 1.234 MB
  Throughput   : 0.596 MB/s

  ── Latency (ms) ───────────────────────────────────
  Min          : 145.20
  Mean         : 198.43
  p50 (median) : 201.17
  p75          : 245.80
  p90          : 312.40
  p95          : 387.22
  p99          : 421.05
  Max          : 450.88

  ── Status Codes ───────────────────────────────────
  200          : 100

Latency Distribution (ms):
     145.2 -    175.7 | ██████████████████████████████                    15
     175.7 -    206.2 | ██████████████████████████████████████████████████ 25
     206.2 -    236.7 | █████████████████████████████████████████         21
     236.7 -    267.2 | ████████████████████████████████                  16
     ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## JSON Output

Use `--json` for machine-readable output:

```json
{
  "url": "https://example.com",
  "method": "GET",
  "concurrency": 10,
  "elapsedSec": 2.074,
  "totalRequests": 100,
  "successCount": 100,
  "failCount": 0,
  "successRate": 100.00,
  "rpsAchieved": 48.21,
  "mbReceived": 1.2341,
  "mbPerSec": 0.5952,
  "latency": {
    "min": 145.20,
    "mean": 198.43,
    "p50": 201.17,
    "p75": 245.80,
    "p90": 312.40,
    "p95": 387.22,
    "p99": 421.05,
    "max": 450.88
  },
  "statusCodes": { "200": 100 },
  "errors": {}
}
```

## Requirements

- Node.js >= 18
- No npm dependencies

## License

MIT
