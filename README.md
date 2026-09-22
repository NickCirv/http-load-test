![http-load-test — Nicholas Ashkar repository collection](assets/nicholas-ashkar/banner.png)

# http-load-test

Measure response latency and status distribution for a controlled HTTP workload.


<a id="usage"></a>

## What it does

Sends a fixed count or duration-based workload with configurable concurrency, rate, method, body, timeouts and warmup. Produces latency statistics and optional JSON/file output. See the pinned [implementation](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/index.js).


<a id="install"></a>

## Quickstart

Node requirement from the inspected manifest: **`>=20`**. Start a local test endpoint before the example. Keep the first run small and use read-only requests.

The following example is **source-inspected, not executed**. It uses a pinned checkout; npm package publication is not assumed. Replace project paths or provide the stated input fixtures before running it.

```bash
git clone https://github.com/NickCirv/http-load-test.git
cd http-load-test
git checkout b487e9c6ca7af9dcfe1e77a741112380c22eca7d
npm install --ignore-scripts
node index.js http://127.0.0.1:3000 --requests 10 --concurrency 1 --json
```

Dependencies are installed with lifecycle scripts disabled in this recipe. Read the package scripts before enabling any lifecycle step required by your environment.

## Usage and reference

`http-load-test` | `hlt` are the executable names declared by the package. [Command reference](docs/REFERENCE.md) covers source-backed options and entry points.

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--requests N` | Set request count |
| `--concurrency N` | Set concurrent requests |
| `--duration SECONDS` | Use a timed run |
| `--rps N` | Set target request rate |
| `--json` | Emit a final JSON report |

## Limits and operational notes

The load generator can affect availability and can repeat mutating requests. Use it only against an authorized test target. Client CPU, connection behavior and network conditions constrain the results; this is not a distributed benchmark.

## Development

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

| Script | Declared command |
| --- | --- |
| `test` | `node --test` |

Work from the pinned source, keep changes focused, and reproduce the affected behavior with a small fixture before proposing a change. Existing contribution and security policies remain authoritative where present.

## Research and status

[Research record](docs/RESEARCH.md) identifies the inspected revision, source evidence, documentation disposition and verification gaps. Static inspection supports the descriptions here; runtime behavior, dependency installation and current hosted services remain unverified.

## License and author

[License](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/LICENSE)

[Nicholas Ashkar](https://nicholashkar.com) · Applied AI, systems and consulting.
