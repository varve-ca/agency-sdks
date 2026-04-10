import { RDaaSClient, RDaaSApiError } from '../src/client';
import { ZodError } from 'zod';

async function runAllLiveTests() {
  const client = new RDaaSClient();

  // Stable classification IDs taken from the RDaaS documentation examples
  const classificationId = 'lQA3IRH1ER3KXwrJ'; // Sex at birth
  const classificationWithExclusionsId = 'owrgkARZ8Omww7qX'; // NOC (has exclusions and indexes)
  const concordanceId = 's9aLOlj8BB6DplVz'; // Canadian provinces concordance

  console.log('--- Starting Integration Tests for @varve/statcan-rdaas ---');

  const results: Record<string, 'PASSED' | 'FAILED'> = {};

  const runTest = async <T,>(name: string, testFn: () => Promise<T>) => {
    console.log(`\nTesting: ${name}...`);
    try {
      await testFn();
      console.log(`✅ ${name} PASSED`);
      results[name] = 'PASSED';
    } catch (error: unknown) {
      console.error(`❌ ${name} FAILED`);
      if (error instanceof ZodError) {
        console.error('Schema Validation Error:', JSON.stringify(error.issues, null, 2));
      } else if (error instanceof RDaaSApiError) {
        console.error(`API Error HTTP ${error.status}: ${error.message}`);
      } else if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(String(error));
      }
      results[name] = 'FAILED';
    }
  };

  // 1. searchClassifications
  await runTest('searchClassifications', async () => {
    const res = await client.searchClassifications({ limit: 5 });
    if (!res.results['@graph'] || res.results['@graph'].length === 0) {
      throw new Error('Expected at least one classification in results');
    }
    if (typeof res.found !== 'number') throw new Error('Expected found to be a number');
  });

  // 2. getClassificationSearchFilters
  await runTest('getClassificationSearchFilters', async () => {
    const res = await client.getClassificationSearchFilters();
    if (!Array.isArray(res) || res.length === 0) {
      throw new Error('Expected array of search filters');
    }
    if (!res[0].parameter || !Array.isArray(res[0].values)) {
      throw new Error('Expected filter to have parameter and values');
    }
  });

  // 3. searchConcordances
  await runTest('searchConcordances', async () => {
    const res = await client.searchConcordances({ limit: 5 });
    if (!res.results['@graph'] || res.results['@graph'].length === 0) {
      throw new Error('Expected at least one concordance in results');
    }
    if (typeof res.found !== 'number') throw new Error('Expected found to be a number');
  });

  // 4. getConcordanceSearchFilters
  await runTest('getConcordanceSearchFilters', async () => {
    const res = await client.getConcordanceSearchFilters();
    if (!Array.isArray(res)) throw new Error('Expected array of search filters');
  });

  // 5. getClassification
  await runTest('getClassification', async () => {
    const res = await client.getClassification(classificationId);
    if (!res['@id']) throw new Error('Expected @id on classification');
    if (!res.name) throw new Error('Expected name on classification');
  });

  // 6. getClassificationCategories
  await runTest('getClassificationCategories', async () => {
    const res = await client.getClassificationCategories(classificationId);
    if (!Array.isArray(res['@graph'])) throw new Error('Expected @graph array');
    if (res['@graph'].length === 0) throw new Error('Expected at least one category');
  });

  // 7. getClassificationCategoriesDetailed
  await runTest('getClassificationCategoriesDetailed', async () => {
    const res = await client.getClassificationCategoriesDetailed(classificationId);
    if (!Array.isArray(res['@graph'])) throw new Error('Expected @graph array');
    if (res['@graph'].length === 0) throw new Error('Expected at least one category');
  });

  // 8. getClassificationExclusions
  await runTest('getClassificationExclusions', async () => {
    const res = await client.getClassificationExclusions(classificationWithExclusionsId);
    if (!Array.isArray(res['@graph'])) throw new Error('Expected @graph array');
  });

  // 9. getTermExclusion (use the exclusion ID from the docs example)
  await runTest('getTermExclusion', async () => {
    const res = await client.getTermExclusion('gW3ImwdRwL95SLi5');
    if (!res.term) throw new Error('Expected term on exclusion');
  });

  // 10. getClassificationIndexes
  await runTest('getClassificationIndexes', async () => {
    const res = await client.getClassificationIndexes(classificationWithExclusionsId);
    if (!Array.isArray(res['@graph'])) throw new Error('Expected @graph array');
  });

  // 11. getClassificationIndex (index entry ID 7 from docs example)
  await runTest('getClassificationIndex', async () => {
    const res = await client.getClassificationIndex(classificationWithExclusionsId, 7);
    if (!res['@id']) throw new Error('Expected @id on index entry');
    if (res.indexId == null) throw new Error('Expected indexId on index entry');
  });

  // 12. getConcordance
  await runTest('getConcordance', async () => {
    const res = await client.getConcordance(concordanceId);
    if (!res['@id']) throw new Error('Expected @id on concordance');
    if (!res.name) throw new Error('Expected name on concordance');
  });

  console.log('\n--- Summary ---');
  let allPassed = true;
  for (const [name, result] of Object.entries(results)) {
    console.log(`${result === 'PASSED' ? '✅' : '❌'} ${name}`);
    if (result === 'FAILED') allPassed = false;
  }

  if (allPassed) {
    console.log('\n🎉 ALL 12 ENDPOINTS PASSED!');
  } else {
    console.log('\n⚠️ SOME ENDPOINTS FAILED. See logs above for Zod or API errors.');
    throw new Error('Integration tests failed');
  }
}

runAllLiveTests();
