# @varve/statcan-wds

[![Test @varve/statcan-wds](https://github.com/varve-ca/agency-sdks/actions/workflows/test-statcan-wds.yml/badge.svg)](https://github.com/varve-ca/agency-sdks/actions/workflows/test-statcan-wds.yml)
[![npm](https://img.shields.io/npm/v/@varve/statcan-wds)](https://www.npmjs.com/package/@varve/statcan-wds)

An isomorphic, Zod-validated TypeScript client for the Statistics Canada Web Data Service (WDS) API.

## Features
- **Pragmatic Validation:** Every API response is validated at runtime using `zod`. While we maintain strict typing, schemas are permissive regarding `null` and `optional` fields to handle StatCan's inconsistent real-world data (e.g., suppressed metadata or Census edge cases).
- **Defensive Parsing:** Specifically detects non-JSON responses (HTML error pages) and categorizes them into actionable error classes rather than crashing on generic syntax errors.
- **Resilient:** Built-in exponential backoff and retry logic handles the government's infamous `409 Conflict` (table updating) and `500 Internal Server` errors gracefully.
- **Isomorphic:** Works in Node.js, Next.js, Cloudflare Workers, and modern browsers.
- **Complete Coverage:** Supports all 16 data access and metadata endpoints documented in the official WDS specification.

## Installation

```bash
npm install @varve/statcan-wds zod
```

*(Note: `zod` is a required peer dependency).*

## Quick Start

```typescript
import { StatCanClient } from '@varve/statcan-wds';

async function main() {
  const client = new StatCanClient();

  // 1. Get Table Metadata
  const metadata = await client.getCubeMetadata([35100003]);
  console.log(metadata[0].object?.cubeTitleEn); 

  // 2. Fetch Data by Coordinate
  const data = await client.getDataFromCubePidCoordAndLatestNPeriods([{ 
    productId: 35100003, 
    coordinate: '1.12.0.0.0.0.0.0.0.0', 
    latestN: 3 
  }]);
  
  console.log(data[0].object?.vectorDataPoint);
}

main();
```

## Error Handling

The client uses a hierarchy of specific error classes to help you handle StatCan's various failure modes:

| Error Class | Trigger |
| ----------- | ------- |
| `InvalidCoordinateError` | Thrown for 400 status codes or when the API returns "Response Code 1". |
| `AgencyInternalError` | Thrown when the agency returns a 500 HTML error page. |
| `AgencyResponseError` | Thrown for non-JSON content types or malformed JSON. |
| `SuppressedDataError` | Thrown when a series is requested but the API returns zero data points (suppressed data). |
| `StatCanApiError` | Generic catch-all for other non-200 API responses. |

```typescript
import { StatCanClient, InvalidCoordinateError, SuppressedDataError } from '@varve/statcan-wds';

const client = new StatCanClient();

try {
  const data = await client.getDataFromVectorsAndLatestNPeriods([{ vectorId: 999, latestN: 1 }]);
} catch (error) {
  if (error instanceof InvalidCoordinateError) {
    console.error("The requested vector ID or coordinate does not exist.");
  } else if (error instanceof SuppressedDataError) {
    console.error("The series exists but is currently suppressed (no data points).");
  }
}
```

## Configuration

You can pass options to the client constructor to override the base URL (e.g., for local proxying) or adjust the retry behavior.

```typescript
const client = new StatCanClient({
  baseUrl: 'https://proxy.your-company.com/statcan',
  maxRetries: 5 // Default is 2
});
```

## Notes on Official Documentation

The [official WDS user guide](https://www.statcan.gc.ca/en/developers/wds/user-guide) contains several discrepancies from the actual API behaviour, discovered through live testing against the production endpoints:

- **`getChangedCubeList` and `getChangedSeriesList`:** The docs show a double-nested response structure (`object: [[...]]`) that does not reflect what the API actually returns. The real response is `object: [...]`.
- **`value` field in datapoints:** One doc example shows `"value": "18381"` as a string. The API always returns `value` as a JSON number or `null`.
- **`geoAttribute` in cube metadata:** The docs omit this, but the API can return `null` for this field (not just absent). The schema accounts for this.
- **`getDataFromVectorByReferencePeriodRange`:** The docs show `vectorIds` as a single quoted value. The API accepts a comma-separated list (e.g. `vectorIds=1,2,3`). This client's method accepts `number | number[]` and handles the formatting.
- **`dimensions` in `getAllCubesList`:** The field uses `hasUOM` (capital) in the bulk list response, whereas `getCubeMetadata` dimensions use `hasUom`. These are typed as `unknown[]` to handle the inconsistency safely.

The schemas in this package reflect observed live API behaviour, not the documentation.

## License
MIT