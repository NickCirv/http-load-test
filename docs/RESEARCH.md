# http-load-test — research record

## Revision and scope

- Repository: [NickCirv/http-load-test](https://github.com/NickCirv/http-load-test)
- Commit: `b487e9c6ca7af9dcfe1e77a741112380c22eca7d`
- Tree: `f5bae7e3dbefea3076a80260e6ae7f5a988c7d8e`
- Captured: 6 of 6 eligible text files (all eligible text files).
- Recursive tree truncated: `False`.
- Runtime verification: **unverified**; no repository code, installation or test command was executed.

The captured file inventory is broader than the semantic review. Authoring inspected package metadata, entrypoint/argument handling and implementation paths relevant to the claims below, plus test declarations. This is documentation research, not a line-by-line security audit. Generated/binary artifacts, lockfiles and file types outside the acquisition filter were not inspected.

## Claim and evidence

| Claim | Pinned evidence | Status |
| --- | --- | --- |
| Runtime requirement and executable mapping | [package.json](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/package.json) | verified in manifest; installation unverified |
| Measure response latency and status distribution for a controlled HTTP workload. | [implementation](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/index.js) | partially verified by static implementation review |
| Operational limits and side effects | [implementation](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/index.js) and source map in [reference](REFERENCE.md) | partially verified; runtime unverified |
| Test command definition | [package.json](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/package.json) | verified as a declaration only |

## Findings carried into the rewrite

The load generator can affect availability and can repeat mutating requests. Use it only against an authorized test target. Client CPU, connection behavior and network conditions constrain the results; this is not a distributed benchmark.

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

## Documentation inventory and disposition

| Existing document | Disposition |
| --- | --- |
| [README.md](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/README.md) | Rewritten overview; historical copy remains at this pinned URL. |

New supporting documents: `docs/REFERENCE.md` and `docs/RESEARCH.md`. No original source or protected legal/security file was changed.

## Protected-file evidence

- `LICENSE` SHA-256 `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d`.

## Remaining verification

Clean installation, useful-command execution, malformed input, side-effect boundaries, platform compatibility and end-to-end tests remain unverified. Package-registry availability and live API destinations were not checked. No performance, customer-adoption, compliance or production-readiness claim is made.

## Captured evidence index

- [LICENSE](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/LICENSE) · blob `05b804beeec7d1a6c933d087387ba4adf6463d93`.
- [README.md](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/README.md) · blob `b15dbf56457362b2cf5ad138473e220e6cec0bf1`.
- [package.json](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/package.json) · blob `c0163ccc1d14e7ec658500cfde96a9cd5830f121`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/.github/workflows/ci.yml) · blob `44515034a394670de44454a7a1bd2c7ef0c9836e`.
- [index.js](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/index.js) · blob `e78064ea8fd8844e2ffc86f27d93c6c2b06821c1`.
- [test/smoke.test.js](https://github.com/NickCirv/http-load-test/blob/b487e9c6ca7af9dcfe1e77a741112380c22eca7d/test/smoke.test.js) · blob `ebbccaaf2583b4850575f835313e4b0afd21bff7`.

## Tree files outside the captured text set

No additional blob paths are present outside the captured set.
