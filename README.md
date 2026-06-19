<div align="center">

# http-load-test

**Stress-test any HTTP endpoint from the terminal — concurrency, RPS cap, latency percentiles, ASCII histogram.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?labelColor=0B0A09)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?labelColor=0B0A09)](package.json)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-informational?labelColor=0B0A09)](package.json)

</div>

## Install

```bash
npx github:NickCirv/http-load-test
```

Or clone and link globally:

```bash
git clone https://github.com/NickCirv/http-load-test.git
cd http-load-test && npm link
```

## Usage

```bash
# 100 requests, 10 concurrent (defaults)
hlt https://example.com

# High concurrency, 500 requests
hlt https://api.example.com/users -c 20 -n 500

# Duration-based test, capped at 50 RPS
hlt https://api.example.com/users -d 30 --rps 50

# POST with JSON body and auth header
hlt https://api.example.com/data \
  -m POST \
  -b '{"key":"value"}' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Warmup requests, JSON output saved to file
hlt https://example.com --warmup 5 --json -o report.json
```

| Flag | Default | Description |
|------|---------|-------------|
| `-c, --concurrency <n>` | 10 | Concurrent connections |
| `-n, --requests <n>` | 100 | Total requests to send |
| `-d, --duration <s>` | — | Run for N seconds (overrides `--requests`) |
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

## What it does

Sends a configurable flood of HTTP requests and reports p50/p75/p90/p95/p99 latency percentiles, RPS achieved, success rate, per-status-code counts, and an ASCII histogram of the latency distribution. Supports both fixed-count and duration-based runs, per-request RPS throttling, warmup requests, custom headers/body, and JSON output for scripting. Uses only Node.js built-in modules — no `npm install` needed.

---

<sub>Zero dependencies · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
