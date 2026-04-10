# Varve Agency SDKs

Isomorphic, Zod-validated TypeScript clients for government statistical APIs. Each package targets a specific agency API, ships CJS + ESM bundles with full TypeScript declarations, and validates every response at runtime so your types reflect the actual shape of the data.

**Live API status:** [varve-ca.github.io/agency-sdks](https://varve-ca.github.io/agency-sdks)

## Packages

| Package | Description | Status |
|---|---|---|
| [`@varve/ons-api`](packages/ons-api) | UK Office for National Statistics API | [![Test @varve/ons-api](https://github.com/varve-ca/agency-sdks/actions/workflows/test-ons-api.yml/badge.svg)](https://github.com/varve-ca/agency-sdks/actions/workflows/test-ons-api.yml) |
| [`@varve/statcan-wds`](packages/statcan-wds) | Statistics Canada Web Data Service | [![Test @varve/statcan-wds](https://github.com/varve-ca/agency-sdks/actions/workflows/test-statcan-wds.yml/badge.svg)](https://github.com/varve-ca/agency-sdks/actions/workflows/test-statcan-wds.yml) |
| [`@varve/statcan-rdaas`](packages/statcan-rdaas) | Statistics Canada Reference Data as a Service | [![Test @varve/statcan-rdaas](https://github.com/varve-ca/agency-sdks/actions/workflows/test-statcan-rdaas.yml/badge.svg)](https://github.com/varve-ca/agency-sdks/actions/workflows/test-statcan-rdaas.yml) |

Each package has its own README with installation instructions, a full API reference, and notes on any discrepancies between the official documentation and the live API behaviour.

## Design

- **Runtime validation** — all responses are parsed with [Zod](https://zod.dev). Schema mismatches throw immediately with a structured error rather than silently passing bad data through.
- **Isomorphic** — uses the standard `fetch` API. Works in Node.js 18+, modern browsers, and edge runtimes (Cloudflare Workers, Next.js Edge).
- **Zod peer dependency** — `zod` is a peer dependency so it deduplications correctly if you already use it in your project.
- **Schemas are exported** — every Zod schema is a named export, available for use in your own validation pipelines.

## Repository structure

```
packages/
  ons-api/          @varve/ons-api
  statcan-wds/      @varve/statcan-wds
  statcan-rdaas/    @varve/statcan-rdaas
docs/
  index.html        live status dashboard
  status.json       test results updated weekly by CI
.github/
  workflows/        one scheduled workflow per package (runs every Monday)
  scripts/          update-status.js — parses test output into status.json
```

## License

MIT
