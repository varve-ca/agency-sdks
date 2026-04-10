/**
 * Integration tests — hit the live ONS API.
 * Run with: npx tsx tests/integration.test.ts
 *
 * Note: ONS rate-limits aggressively. Run these sparingly.
 */

import { OnsClient, OnsApiError } from '../src/client';

const client = new OnsClient();
const CODE_LIST_ID = 'administrative-geography';
const CODE_LIST_EDITION = 'one-off';
const CODE_ID = 'K02000001';
const TIMESERIES_CDID = 'LGEU';
const DATASET_ID = 'wellbeing-quarterly';
const DATASET_EDITION = 'time-series';
const DATASET_VERSION = 9;
const TOPIC_ID = '1245'; // Economy

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error('   ', err instanceof Error ? err.message : err);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function main() {

console.log('\nSearch API\n----------');

await test('search() returns paginated results', async () => {
  const res = await client.search({ content_type: 'timeseries', limit: 2 });
  assert(res.count > 0, 'count > 0');
  assert(res.items.length === 2, 'items.length === 2');
  assert(typeof res.took === 'number', 'took is a number');
});

await test('search() filters by content_type=dataset', async () => {
  const res = await client.search({ content_type: 'dataset', limit: 1 });
  assert(res.items[0].type === 'dataset', 'item type is dataset');
});

await test('search() filters by cdid', async () => {
  const res = await client.search({ content_type: 'timeseries', cdids: [TIMESERIES_CDID] });
  assert(res.items.length > 0, 'found results');
  assert(res.items[0].cdid === TIMESERIES_CDID, `cdid matches ${TIMESERIES_CDID}`);
});

await test('search() returns highlight fields when highlight=true', async () => {
  const res = await client.search({ q: 'inflation', content_type: 'timeseries', limit: 1, highlight: true });
  assert(res.items[0].highlight !== undefined, 'highlight field present');
});

await test('search() supports fromDate and toDate filters', async () => {
  const res = await client.search({
    content_type: 'timeseries',
    fromDate: '2026-01-01',
    toDate: '2026-04-01',
    limit: 1,
  });
  assert(res.count >= 0, 'returns a result');
});

await test('search() supports offset pagination', async () => {
  const page1 = await client.search({ content_type: 'timeseries', limit: 1, offset: 0 });
  const page2 = await client.search({ content_type: 'timeseries', limit: 1, offset: 1 });
  assert(page1.items[0].uri !== page2.items[0].uri, 'different items on different pages');
});

await test('search() supports uri_prefix filter', async () => {
  const res = await client.search({ uri_prefix: '/economy', content_type: 'timeseries', limit: 1 });
  assert(res.items[0].uri.startsWith('/economy'), 'uri starts with /economy');
});

console.log('\nData API\n--------');

await test('getData() returns years, quarters, months', async () => {
  const searchRes = await client.search({ content_type: 'timeseries', cdids: [TIMESERIES_CDID] });
  const uri = searchRes.items[0].uri;
  const res = await client.getData(uri);
  assert(Array.isArray(res.years), 'years is array');
  assert(Array.isArray(res.quarters), 'quarters is array');
  assert(Array.isArray(res.months), 'months is array');
  assert(res.type === 'timeseries', 'type is timeseries');
  assert(res.uri === uri, 'uri matches');
});

await test('getData() datapoints have string values', async () => {
  const searchRes = await client.search({ content_type: 'timeseries', cdids: [TIMESERIES_CDID] });
  const res = await client.getData(searchRes.items[0].uri);
  if (res.years.length > 0) {
    assert(typeof res.years[0].value === 'string', 'value is a string (ONS always returns strings)');
  }
});

await test('getData() description contains expected fields', async () => {
  const searchRes = await client.search({ content_type: 'timeseries', cdids: [TIMESERIES_CDID] });
  const res = await client.getData(searchRes.items[0].uri);
  assert(typeof res.description.title === 'string', 'description.title is string');
  assert(typeof res.description.cdid === 'string', 'description.cdid is string');
});

await test('getTimeseriesByCdid() returns data for matching CDIDs', async () => {
  const results = await client.getTimeseriesByCdid([TIMESERIES_CDID]);
  assert(results.length > 0, 'at least one result returned');
  assert(results[0].type === 'timeseries', 'result is timeseries');
});

console.log('\nCode Lists API\n--------------');

await test('getCodeLists() returns paginated list', async () => {
  const res = await client.getCodeLists({ limit: 2 });
  assert(res.total_count > 0, 'total_count > 0');
  assert(res.items.length === 2, 'items.length === 2');
  assert(typeof res.items[0].links.self.id === 'string', 'self.id is string');
});

await test('getCodeList() returns a single code list', async () => {
  const res = await client.getCodeList(CODE_LIST_ID);
  assert(res.links.self.id === CODE_LIST_ID, `id matches ${CODE_LIST_ID}`);
  assert(typeof res.links.editions.href === 'string', 'editions href exists');
});

await test('getCodeListEditions() returns editions', async () => {
  const res = await client.getCodeListEditions(CODE_LIST_ID);
  assert(res.items.length > 0, 'has editions');
  assert(typeof res.items[0].edition === 'string', 'edition is string');
});

await test('getCodeListEdition() returns a single edition', async () => {
  const res = await client.getCodeListEdition(CODE_LIST_ID, CODE_LIST_EDITION);
  assert(res.edition === CODE_LIST_EDITION, `edition matches ${CODE_LIST_EDITION}`);
  assert(typeof res.links.codes.href === 'string', 'codes href exists');
});

await test('getCodes() returns paginated codes', async () => {
  const res = await client.getCodes(CODE_LIST_ID, CODE_LIST_EDITION, { limit: 2 });
  assert(res.total_count > 0, 'total_count > 0');
  assert(res.items.length === 2, 'items.length === 2');
  assert(typeof res.items[0].code === 'string', 'code is string');
  assert(typeof res.items[0].label === 'string', 'label is string');
});

await test('getCode() returns a single code', async () => {
  const res = await client.getCode(CODE_LIST_ID, CODE_LIST_EDITION, CODE_ID);
  assert(res.code === CODE_ID, `code matches ${CODE_ID}`);
  assert(typeof res.links.datasets.href === 'string', 'datasets href exists');
});

await test('getCodeDatasets() returns datasets that use a code', async () => {
  const res = await client.getCodeDatasets(CODE_LIST_ID, CODE_LIST_EDITION, CODE_ID, { limit: 1 });
  assert(res.total_count > 0, 'total_count > 0');
  assert(typeof res.items[0].ID === 'string', 'dataset ID is string');
  assert(Array.isArray(res.items[0].editions), 'editions is array');
});

console.log('\nDatasets API\n------------');

await test('getDatasets() returns paginated list', async () => {
  const res = await client.getDatasets({ limit: 2 });
  assert(res.total_count > 0, 'total_count > 0');
  assert(res.items.length === 2, 'items.length === 2');
  assert(typeof res.items[0].id === 'string', 'id is string');
  assert(typeof res.items[0].title === 'string', 'title is string');
});

await test('getDataset() returns a single dataset', async () => {
  const res = await client.getDataset(DATASET_ID);
  assert(res.id === DATASET_ID, `id matches ${DATASET_ID}`);
  assert(typeof res.description === 'string', 'description is string');
  assert(typeof res.links.editions.href === 'string', 'editions href exists');
});

await test('getDatasetEditions() returns editions', async () => {
  const res = await client.getDatasetEditions(DATASET_ID);
  assert(res.items.length > 0, 'has editions');
  assert(typeof res.items[0].edition === 'string', 'edition is string');
});

await test('getDatasetEdition() returns a single edition', async () => {
  const res = await client.getDatasetEdition(DATASET_ID, DATASET_EDITION);
  assert(res.edition === DATASET_EDITION, `edition matches ${DATASET_EDITION}`);
  assert(typeof res.links.versions.href === 'string', 'versions href exists');
});

await test('getDatasetVersions() returns versions', async () => {
  const res = await client.getDatasetVersions(DATASET_ID, DATASET_EDITION);
  assert(res.items.length > 0, 'has versions');
  assert(typeof res.items[0].version === 'number', 'version is number');
});

await test('getDatasetVersion() returns a single version', async () => {
  const res = await client.getDatasetVersion(DATASET_ID, DATASET_EDITION, DATASET_VERSION);
  assert(res.version === DATASET_VERSION, `version matches ${DATASET_VERSION}`);
  assert(res.state === 'published', 'state is published');
});

await test('getDatasetDimensions() returns dimensions', async () => {
  const res = await client.getDatasetDimensions(DATASET_ID, DATASET_EDITION, DATASET_VERSION);
  assert(res.items.length > 0, 'has dimensions');
  assert(typeof res.items[0].name === 'string', 'name is string');
  assert(typeof res.items[0].label === 'string', 'label is string');
});

await test('getDatasetDimensionOptions() returns options', async () => {
  const res = await client.getDatasetDimensionOptions(DATASET_ID, DATASET_EDITION, DATASET_VERSION, 'geography', { limit: 1 });
  assert(res.items.length > 0, 'has options');
  assert(typeof res.items[0].option === 'string', 'option is string');
  assert(res.items[0].dimension === 'geography', 'dimension matches');
});

await test('getDatasetMetadata() returns metadata', async () => {
  const res = await client.getDatasetMetadata(DATASET_ID, DATASET_EDITION, DATASET_VERSION);
  assert(typeof res.title === 'string', 'title is string');
  assert(res.version === DATASET_VERSION, `version matches ${DATASET_VERSION}`);
});

console.log('\nObservations API\n----------------');

await test('getObservations() returns single observation', async () => {
  const res = await client.getObservations('cpih01', 'time-series', 6, {
    time: 'Oct-11',
    geography: 'K02000001',
    aggregate: 'cpih1dim1A0',
  });
  assert(res.total_observations === 1, 'total_observations === 1');
  assert(typeof res.observations[0].observation === 'string', 'observation is string');
  assert(res.observations[0].dimensions === undefined, 'no per-row dimensions on exact query');
});

await test('getObservations() with wildcard returns multiple rows with per-row dimensions', async () => {
  const res = await client.getObservations('cpih01', 'time-series', 6, {
    time: '*',
    geography: 'K02000001',
    aggregate: 'cpih1dim1A0',
  });
  assert(res.total_observations > 1, 'multiple observations returned');
  assert(res.observations[0].dimensions !== undefined, 'per-row dimensions present with wildcard');
});

console.log('\nFilters API\n-----------');

await test('createFilter() creates a filter', async () => {
  const res = await client.createFilter({
    dataset: { id: 'cpih01', edition: 'time-series', version: 6 },
    dimensions: [
      { name: 'aggregate', options: ['cpih1dim1A0'] },
      { name: 'geography', options: ['K02000001'] },
      { name: 'time', options: ['Oct-11'] },
    ],
  });
  assert(typeof res.filter_id === 'string', 'filter_id is string');
  assert(res.dataset.id === 'cpih01', 'dataset id matches');
  assert(res.links.filter_output === undefined, 'no filter_output when not submitted');
});

await test('createFilter() with submitted=true returns filter_output link', async () => {
  const res = await client.createFilter({
    dataset: { id: 'cpih01', edition: 'time-series', version: 6 },
    dimensions: [
      { name: 'aggregate', options: ['cpih1dim1A0'] },
      { name: 'geography', options: ['K02000001'] },
      { name: 'time', options: ['Oct-11', 'Oct-12'] },
    ],
  }, true);
  assert(typeof res.filter_id === 'string', 'filter_id is string');
  assert(res.links.filter_output !== undefined, 'filter_output link present when submitted');
});

await test('getFilterOutput() returns output with state and downloads when completed', async () => {
  const filter = await client.createFilter({
    dataset: { id: 'cpih01', edition: 'time-series', version: 6 },
    dimensions: [
      { name: 'aggregate', options: ['cpih1dim1A0'] },
      { name: 'geography', options: ['K02000001'] },
      { name: 'time', options: ['Oct-11'] },
    ],
  }, true);
  const outputId = filter.links.filter_output!.id;
  // Poll until completed (async job)
  let output = await client.getFilterOutput(outputId);
  for (let i = 0; i < 10 && output.state !== 'completed' && output.state !== 'failed'; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    output = await client.getFilterOutput(outputId);
  }
  assert(typeof output.state === 'string', 'state is string');
  assert(output.state === 'completed', `state is completed (got: ${output.state})`);
  assert(output.downloads?.csv !== undefined, 'csv download link present');
});

console.log('\nTopics API\n----------');

await test('getNavigation() returns nav tree', async () => {
  const res = await client.getNavigation();
  assert(res.items.length > 0, 'has navigation items');
  assert(typeof res.items[0].label === 'string', 'label is string');
  assert(typeof res.description === 'string', 'description is string');
});

await test('getTopics() returns top-level topics', async () => {
  const res = await client.getTopics();
  assert(res.items.length > 0, 'has topics');
  assert(typeof res.items[0].id === 'string', 'id is string');
  assert(typeof res.items[0].title === 'string', 'title is string');
});

await test('getTopic() returns a single topic', async () => {
  const res = await client.getTopic(TOPIC_ID);
  assert(res.id === TOPIC_ID, `id matches ${TOPIC_ID}`);
  assert(typeof res.description === 'string', 'description is string');
});

await test('getTopicSubtopics() returns subtopics', async () => {
  const res = await client.getTopicSubtopics(TOPIC_ID);
  assert(res.items.length > 0, 'has subtopics');
  assert(typeof res.items[0].id === 'string', 'subtopic id is string');
});

await test('getTopicContent() returns content items', async () => {
  const res = await client.getTopicContent(TOPIC_ID, { limit: 2 });
  assert(res.total_count > 0, 'total_count > 0');
  assert(typeof res.items[0].title === 'string', 'title is string');
  assert(typeof res.items[0].type === 'string', 'type is string');
});

console.log('\nError Handling\n--------------');

await test('throws OnsApiError on 404', async () => {
  try {
    await client.getData('/this/does/not/exist');
    assert(false, 'should have thrown');
  } catch (err) {
    assert(err instanceof OnsApiError, 'error is OnsApiError');
    assert(err.status === 404, `status is 404, got ${(err as OnsApiError).status}`);
  }
});

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);

}

main();
