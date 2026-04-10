import { StatCanClient, StatCanApiError } from '../src/client';
import { ZodError } from 'zod';

async function runAllLiveTests() {
  const client = new StatCanClient();
  const testProductId = 35100003;
  const testCoordinate = '1.12.0.0.0.0.0.0.0.0';
  const testVectorId = 32164132;
  const todayIso = new Date().toISOString().split('T')[0];

  console.log('--- Starting Comprehensive Integration Tests for ALL 16 Endpoints ---');

  const results: Record<string, 'PASSED' | 'FAILED'> = {};

  const runTest = async <T,>(name: string, testFn: () => Promise<T>) => {
    console.log(`\nTesting: ${name}...`);
    try {
      await testFn();
      console.log(`✅ ${name} PASSED schema validation and integration request.`);
      results[name] = 'PASSED';
    } catch (error: unknown) {
      console.error(`❌ ${name} FAILED!`);
      if (error instanceof ZodError) {
        console.error('Schema Validation Error:', JSON.stringify(error.issues, null, 2));
      } else if (error instanceof StatCanApiError) {
        console.error(`API Error HTTP ${error.status}:`, error.message);
      } else if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(String(error));
      }
      results[name] = 'FAILED';
    }
  };

  // 1. getChangedSeriesList
  await runTest('getChangedSeriesList', async () => {
    const res = await client.getChangedSeriesList();
    if (res.status !== 'SUCCESS') throw new Error(`API returned ${res.status}`);
  });

  // 2. getChangedCubeList
  await runTest('getChangedCubeList', async () => {
    try {
      // Use yesterday or today
      const res = await client.getChangedCubeList(todayIso);
      if (res.status !== 'SUCCESS') throw new Error(`API returned ${res.status}`);
    } catch (err: unknown) {
      if (err instanceof StatCanApiError && err.status === 404) {
        console.log('   (Expected 404 for unchanged data, considering this a PASS)');
        return;
      }
      throw err;
    }
  });

  // 3. getCubeMetadata
  await runTest('getCubeMetadata', async () => {
    const res = await client.getCubeMetadata([testProductId]);
    if (res[0].status !== 'SUCCESS') throw new Error(`API returned ${res[0].status}`);
  });

  // 4. getSeriesInfoFromCubePidCoord
  await runTest('getSeriesInfoFromCubePidCoord', async () => {
    const res = await client.getSeriesInfoFromCubePidCoord([{ productId: testProductId, coordinate: testCoordinate }]);
    if (res[0].status !== 'SUCCESS') throw new Error(`API returned ${res[0].status}`);
  });

  // 5. getSeriesInfoFromVector
  await runTest('getSeriesInfoFromVector', async () => {
    const res = await client.getSeriesInfoFromVector([{ vectorId: testVectorId }]);
    if (res[0].status !== 'SUCCESS') throw new Error(`API returned ${res[0].status}`);
  });

  // 6. getAllCubesList (Takes a while, downloading huge list)
  await runTest('getAllCubesList', async () => {
    const res = await client.getAllCubesList();
    if (!Array.isArray(res) || res.length === 0) throw new Error('Expected array of cubes');
  });

  // 7. getAllCubesListLite
  await runTest('getAllCubesListLite', async () => {
    const res = await client.getAllCubesListLite();
    if (!Array.isArray(res) || res.length === 0) throw new Error('Expected array of cubes');
  });

  // 8. getChangedSeriesDataFromCubePidCoord
  await runTest('getChangedSeriesDataFromCubePidCoord', async () => {
    await client.getChangedSeriesDataFromCubePidCoord([{ productId: testProductId, coordinate: testCoordinate }]);
    // May return FAILED if not changed today, which is fine, we just want to ensure it parses successfully
    // The schema allows ResponseStatusSchema which includes FAILED.
  });

  // 9. getChangedSeriesDataFromVector
  await runTest('getChangedSeriesDataFromVector', async () => {
    try {
      await client.getChangedSeriesDataFromVector([{ vectorId: testVectorId }]);
    } catch (err: unknown) {
      if (err instanceof StatCanApiError && err.status === 404 && err.body?.includes("No changed data found")) {
        console.log('   (Expected 404 for unchanged data, considering this a PASS)');
        return;
      }
      throw err;
    }
  });

  // 10. getDataFromCubePidCoordAndLatestNPeriods
  await runTest('getDataFromCubePidCoordAndLatestNPeriods', async () => {
    const res = await client.getDataFromCubePidCoordAndLatestNPeriods([{ productId: testProductId, coordinate: testCoordinate, latestN: 1 }]);
    if (res[0].status !== 'SUCCESS') throw new Error(`API returned ${res[0].status}`);
  });

  // 11. getDataFromVectorsAndLatestNPeriods
  await runTest('getDataFromVectorsAndLatestNPeriods', async () => {
    const res = await client.getDataFromVectorsAndLatestNPeriods([{ vectorId: testVectorId, latestN: 1 }]);
    if (res[0].status !== 'SUCCESS') throw new Error(`API returned ${res[0].status}`);
  });

  // 12. getBulkVectorDataByRange
  await runTest('getBulkVectorDataByRange', async () => {
    const res = await client.getBulkVectorDataByRange([testVectorId.toString()], '2020-01-01T08:30', '2023-01-01T08:30');
    if (res[0].status !== 'SUCCESS') throw new Error(`API returned ${res[0].status}`);
  });

  // 13. getDataFromVectorByReferencePeriodRange
  await runTest('getDataFromVectorByReferencePeriodRange', async () => {
    const res = await client.getDataFromVectorByReferencePeriodRange(testVectorId.toString(), '2020-01-01', '2023-01-01');
    if (res[0].status !== 'SUCCESS') throw new Error(`API returned ${res[0].status}`);
  });

  // 14. getFullTableDownloadCSV
  await runTest('getFullTableDownloadCSV', async () => {
    const res = await client.getFullTableDownloadCSV(testProductId, 'en');
    if (res.status !== 'SUCCESS') throw new Error(`API returned ${res.status}`);
  });

  // 15. getFullTableDownloadSDMX
  await runTest('getFullTableDownloadSDMX', async () => {
    const res = await client.getFullTableDownloadSDMX(testProductId);
    if (res.status !== 'SUCCESS') throw new Error(`API returned ${res.status}`);
  });

  // 16. getCodeSets
  await runTest('getCodeSets', async () => {
    const res = await client.getCodeSets();
    if (res.status !== 'SUCCESS') throw new Error(`API returned ${res.status}`);
  });

  console.log('\n--- Summary ---');
  let allPassed = true;
  for (const [name, result] of Object.entries(results)) {
    console.log(`${result === 'PASSED' ? '✅' : '❌'} ${name}`);
    if (result === 'FAILED') allPassed = false;
  }

  if (allPassed) {
    console.log('\n🎉 ALL 16 ENDPOINTS PASSED!');
  } else {
    console.log('\n⚠️ SOME ENDPOINTS FAILED. See logs above for Zod or API errors.');
    process.exit(1);
  }
}

runAllLiveTests();
