# http-load-test — command reference

[Overview](../README.md) · [Research record](RESEARCH.md)

Describes revision `b487e9c6ca7af9dcfe1e77a741112380c22eca7d`. Commands are source-inspected; no execution results are asserted.

## Workflow

Sends a fixed count or duration-based workload with configurable concurrency, rate, method, body, timeouts and warmup. Produces latency statistics and optional JSON/file output.

Start a local test endpoint before the example. Keep the first run small and use read-only requests.

```bash
node index.js http://127.0.0.1:3000 --requests 10 --concurrency 1 --json
```

## Commands and controls

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--requests N` | Set request count |
| `--concurrency N` | Set concurrent requests |
| `--duration SECONDS` | Use a timed run |
| `--rps N` | Set target request rate |
| `--json` | Emit a final JSON report |

## Interpretation and side effects

The load generator can affect availability and can repeat mutating requests. Use it only against an authorized test target. Client CPU, connection behavior and network conditions constrain the results; this is not a distributed benchmark.

## Implementation reference

- [package.json](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/package.json)
- [index.js](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/index.js)
- [test/smoke.test.js](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/test/smoke.test.js)
