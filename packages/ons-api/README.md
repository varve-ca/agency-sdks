# @varve/ons-api

An isomorphic, Zod-validated TypeScript client for the [UK Office for National Statistics (ONS) API](https://developer.ons.gov.uk/).

Works in Node.js 18+ and modern browsers. All responses are parsed at runtime with [Zod](https://zod.dev) so your types reflect the actual shape of the data.

## Installation

```bash
npm install @varve/ons-api zod
```

`zod` is a required peer dependency.

## Quick start

```ts
import { OnsClient } from '@varve/ons-api';

const client = new OnsClient();

// Search for timeseries by CDID
const results = await client.search({ content_type: 'timeseries', cdids: ['LGEU'] });

// Fetch full data for a timeseries URI
const data = await client.getData(results.items[0].uri);
console.log(data.years); // annual datapoints
console.log(data.quarters); // quarterly datapoints
console.log(data.months); // monthly datapoints

// Convenience: search + fetch data in one call
const [series] = await client.getTimeseriesByCdid('LGEU');
```

## Configuration

```ts
const client = new OnsClient({
  baseUrl: 'https://api.beta.ons.gov.uk/v1', // default
  maxRetries: 2,                              // retries on 429 rate-limit (default: 2)
});
```

The client automatically handles `429 Too Many Requests` responses by respecting the `Retry-After` header (or waiting 2 seconds if the header is absent).

## API reference

### Search

```ts
// Search across timeseries and datasets
const res = await client.search({
  q: 'inflation',
  content_type: 'timeseries',   // 'timeseries' | 'dataset' | 'timeseries,dataset'
  cdids: ['LGEU', 'ABCD'],      // filter by CDID
  dataset_ids: ['cpih01'],      // filter by dataset ID
  topics: ['1245'],             // filter by topic ID
  uri_prefix: '/economy',       // filter by URI prefix
  highlight: true,              // return HTML-highlighted fields
  fromDate: '2024-01-01',       // filter by release date
  toDate: '2024-12-31',
  limit: 10,
  offset: 0,
});
// res.count, res.took, res.items[]
```

### Data (timeseries)

```ts
// Fetch full timeseries data by URI
const data = await client.getData('/economy/inflationandpriceindices/timeseries/lgeu/mm23');
// data.years[], data.quarters[], data.months[]
// data.description.title, data.description.cdid

// Search for CDIDs then fetch their data in one call
const series = await client.getTimeseriesByCdid(['LGEU', 'ABCD']);
```

### Datasets

```ts
// List datasets (paginated)
const list = await client.getDatasets({ limit: 10, offset: 0 });

// Get a single dataset
const ds = await client.getDataset('cpih01');

// Editions
const editions = await client.getDatasetEditions('cpih01');
const edition  = await client.getDatasetEdition('cpih01', 'time-series');

// Versions
const versions = await client.getDatasetVersions('cpih01', 'time-series');
const version  = await client.getDatasetVersion('cpih01', 'time-series', 6);

// Dimensions and options
const dims    = await client.getDatasetDimensions('cpih01', 'time-series', 6);
const options = await client.getDatasetDimensionOptions('cpih01', 'time-series', 6, 'geography', { limit: 5 });

// Metadata
const meta = await client.getDatasetMetadata('cpih01', 'time-series', 6);
```

### Observations

Fetch individual data points from a dataset version. Pass exact dimension values or use `"*"` as a wildcard.

```ts
// Single observation
const res = await client.getObservations('cpih01', 'time-series', 6, {
  time: 'Oct-11',
  geography: 'K02000001',
  aggregate: 'cpih1dim1A0',
});
// res.total_observations === 1
// res.observations[0].observation — string value

// Wildcard: all time periods for a fixed geography and aggregate
const res = await client.getObservations('cpih01', 'time-series', 6, {
  time: '*',
  geography: 'K02000001',
  aggregate: 'cpih1dim1A0',
});
// res.observations[].dimensions — per-row dimension labels included with wildcard queries
```

### Filters

Filters let you build a custom cut of a dataset and download it as CSV or XLS. Filter outputs are processed asynchronously.

```ts
// Create a filter (not yet submitted)
const filter = await client.createFilter({
  dataset: { id: 'cpih01', edition: 'time-series', version: 6 },
  dimensions: [
    { name: 'aggregate', options: ['cpih1dim1A0'] },
    { name: 'geography', options: ['K02000001'] },
    { name: 'time',      options: ['Oct-11', 'Oct-12'] },
  ],
});

// Submit immediately and get a filter_output link
const submitted = await client.createFilter({ ... }, true);
const outputId = submitted.links.filter_output!.id;

// Poll until the output is ready
let output = await client.getFilterOutput(outputId);
while (output.state !== 'completed' && output.state !== 'failed') {
  await new Promise(r => setTimeout(r, 1000));
  output = await client.getFilterOutput(outputId);
}

console.log(output.downloads?.csv?.href); // download URL
```

### Code lists

```ts
// List all code lists
const lists = await client.getCodeLists({ limit: 5 });

// Single code list
const list = await client.getCodeList('administrative-geography');

// Editions
const editions = await client.getCodeListEditions('administrative-geography');
const edition  = await client.getCodeListEdition('administrative-geography', 'one-off');

// Codes (paginated)
const codes = await client.getCodes('administrative-geography', 'one-off', { limit: 10 });
const code  = await client.getCode('administrative-geography', 'one-off', 'K02000001');

// Datasets that use a code
const datasets = await client.getCodeDatasets('administrative-geography', 'one-off', 'K02000001');
```

### Topics

```ts
// Navigation tree
const nav = await client.getNavigation();
// nav.items[].label, nav.items[].slug, nav.items[].subtopics[]

// Top-level topics
const topics = await client.getTopics();

// Single topic
const topic = await client.getTopic('1245');

// Subtopics
const subtopics = await client.getTopicSubtopics('1245');

// Content items within a topic
const content = await client.getTopicContent('1245', { limit: 10 });
```

## Error handling

All non-2xx responses throw an `OnsApiError`:

```ts
import { OnsApiError } from '@varve/ons-api';

try {
  await client.getData('/does/not/exist');
} catch (err) {
  if (err instanceof OnsApiError) {
    console.error(err.status); // 404
    console.error(err.url);    // full URL that was requested
    console.error(err.body);   // raw response body
  }
}
```

## Zod schemas

All schemas are exported for use in your own validation pipelines:

```ts
import { SearchResponseSchema, DataResponseSchema, DatasetSchema } from '@varve/ons-api';

// Use with your own fetch
const raw = await fetch('...').then(r => r.json());
const data = DataResponseSchema.parse(raw);
```

## Notes on the ONS API

- The ONS API rate-limits aggressively. This client retries `429` responses automatically (up to `maxRetries` times). For batch workloads, add delays between requests.
- The ONS [Developer Hub](https://developer.ons.gov.uk/) has limited documentation. Several fields described in the spec are absent from live responses and are typed as optional in this SDK accordingly.
- The v0 API (`api.ons.gov.uk` without `/v1`) is being retired. This client targets the stable v1 API at `api.beta.ons.gov.uk/v1`.
- Filter outputs (`createFilter` with `submitted=true`) are processed asynchronously. Always poll `getFilterOutput()` until `state === "completed"` before accessing download links.

## License

MIT
