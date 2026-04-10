# @varve/statcan-rdaas

[![Test @varve/statcan-rdaas](https://github.com/varve-ca/agency-sdks/actions/workflows/test-statcan-rdaas.yml/badge.svg)](https://github.com/varve-ca/agency-sdks/actions/workflows/test-statcan-rdaas.yml)
[![npm](https://img.shields.io/npm/v/@varve/statcan-rdaas)](https://www.npmjs.com/package/@varve/statcan-rdaas)

An isomorphic, Zod-validated TypeScript client for the [Statistics Canada Reference Data as a Service (RDaaS) API](https://www.statcan.gc.ca/en/developers/rdaas).

Works in Node.js 18+ and modern browsers. All responses are parsed at runtime with [Zod](https://zod.dev) so your types reflect the actual shape of the data.

## Installation

```bash
npm install @varve/statcan-rdaas zod
```

`zod` is a required peer dependency.

## Quick start

```ts
import { RDaaSClient } from '@varve/statcan-rdaas';

const client = new RDaaSClient();

// Search for classifications
const results = await client.searchClassifications({ q: 'gender', limit: 5 });
const id = results.results['@graph'][0]['@id'].split('/').pop()!;

// Fetch full classification detail (levels + codes)
const classification = await client.getClassification(id);
console.log(classification.name);
console.log(classification.codes); // hierarchical code tree

// Get all categories as a flat list
const categories = await client.getClassificationCategories(id);
console.log(categories['@graph']);
```

## Configuration

```ts
const client = new RDaaSClient({
  baseUrl: 'https://api.statcan.gc.ca/rdaas', // default
  maxRetries: 2,                               // retries on network errors (default: 2)
});
```

## API reference

### Search

```ts
// Search classifications (supports text search and filters)
const res = await client.searchClassifications({
  q: 'occupation',        // search text; omit to return all
  limit: 10,              // default 10, max 500
  start: 0,               // pagination offset
  audience: 'STANDARDS',  // or ['STANDARDS', 'NON_STANDARDIZED']
  status: 'RELEASED',     // or ['RELEASED', 'RETIRED', 'ARCHIVED']
});
// res.results['@graph'][] — array of ClassificationSummary
// res.found — total matching results
// res.facets — counts per filter value

// Get available search filter values for classifications
const filters = await client.getClassificationSearchFilters();
// filters[].parameter, filters[].values[]

// Search concordances
const res = await client.searchConcordances({ q: 'industry', limit: 10 });
// res.results['@graph'][] — array of ConcordanceSummary

// Get available search filter values for concordances
const filters = await client.getConcordanceSearchFilters();
```

### Classifications

```ts
// Full classification detail — includes levels and hierarchical code tree
const classification = await client.getClassification('lQA3IRH1ER3KXwrJ');
// classification.name, .status, .versionName, .validFrom
// classification.levels[] — { levelDepth, name, codeCount }
// classification.codes[]  — recursive tree (codes may have .children[])

// Request a specific language
const fr = await client.getClassification('lQA3IRH1ER3KXwrJ', { lang: 'fr' });

// All categories as a flat list (every level)
const all = await client.getClassificationCategories('lQA3IRH1ER3KXwrJ');
// all['@graph'][] — { code, descriptor, definition, levelDepth }

// Leaf-level categories only (most detailed, no sub-categories)
const detailed = await client.getClassificationCategoriesDetailed('lQA3IRH1ER3KXwrJ');

// Exclusion terms — codes that are explicitly excluded from a classification
const exclusions = await client.getClassificationExclusions('owrgkARZ8Omww7qX');
// exclusions['@graph'][] — { term, sourceCodeValue, targetCodeValue }

// Single exclusion by its term-exclusion ID (the path segment from an exclusion's @id URI)
const exclusion = await client.getTermExclusion('gW3ImwdRwL95SLi5');

// All index entries for a classification
const indexes = await client.getClassificationIndexes('owrgkARZ8Omww7qX');
// indexes['@graph'][] — { indexId, primaryTerm, otherExamples[], indexCodeValue, ... }

// Single index entry by numeric index ID
const entry = await client.getClassificationIndex('owrgkARZ8Omww7qX', 7);
// entry.indexId, entry.primaryTerm, entry.indexCodeValue, entry.indexCodeDescriptor
```

### Concordances

```ts
// Concordance detail — includes source/target classifications and all code maps
const concordance = await client.getConcordance('s9aLOlj8BB6DplVz');
// concordance.name, .status, .versionName
// concordance.source — URI of the source classification
// concordance.target — URI of the target classification
// concordance.codeMaps[] — { maptype, sourceCode, targetCode, ... }
//   maptype values: 'No Change' | 'Code Change' | 'Property Change' |
//                   'Merger' | 'Breakdown' | 'Split-off' | 'Take-over' | ...

const fr = await client.getConcordance('s9aLOlj8BB6DplVz', { lang: 'fr' });
```

### `lang` and `method` parameters

`getClassification`, `getClassificationCategories`, `getClassificationCategoriesDetailed`, and `getConcordance` accept an optional second argument:

```ts
{
  lang?: 'en' | 'fr';
  method?: 'SINGLE' | 'PROPERTY' | 'ARRAY' | 'CONTAINER';
}
```

`method` controls how multilingual fields are serialized. Defaults to the API's own default (`SINGLE` — one language per request).

## Error handling

All non-2xx responses throw an `RDaaSApiError`:

```ts
import { RDaaSApiError } from '@varve/statcan-rdaas';

try {
  await client.getClassification('invalid-id');
} catch (err) {
  if (err instanceof RDaaSApiError) {
    console.error(err.status); // 404
    console.error(err.url);    // full URL that was requested
    console.error(err.body);   // raw response body
  }
}
```

## Zod schemas

All schemas are exported for use in your own validation pipelines:

```ts
import { ClassificationDetailSchema, ClassificationSearchResponseSchema } from '@varve/statcan-rdaas';

const raw = await fetch('...').then(r => r.json());
const classification = ClassificationDetailSchema.parse(raw);
```

## Notes on the RDaaS API

The [official RDaaS documentation](https://www.statcan.gc.ca/en/developers/rdaas) contains several discrepancies from the actual API behaviour, discovered through live testing:

- **`getClassificationIndex` response shape:** The docs show the same `{ @graph: [...] }` structure as the all-indexes endpoint. The live API returns a flat single object (the entry itself with a top-level `@context`). This client exposes a separate `SingleIndexEntryResponse` type for this method.
- **`primaryTerm` field:** Present on every index entry in both the all-indexes and single-index endpoints but absent from the documentation. Included as an optional field in `IndexEntrySchema`.
- **JSON-LD `@context`:** Response bodies include verbose JSON-LD context objects that define field URIs. These are typed as `unknown` — they carry no meaningful data for typical usage.
- **IDs in `@id` URIs:** Classification and concordance IDs are opaque strings embedded in full URIs (e.g. `https://api.statcan.gc.ca/rdaas/classification/lQA3IRH1ER3KXwrJ`). Extract the ID segment with `.split('/').pop()` when passing it to other methods.

The schemas in this package reflect observed live API behaviour, not the documentation.

## License

MIT
