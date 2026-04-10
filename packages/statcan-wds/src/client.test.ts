import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';
import { StatCanClient, StatCanApiError } from './client';

const handlers = [
  http.post('https://www150.statcan.gc.ca/t1/wds/rest/getCubeMetadata', async ({ request }) => {
    const payload = await request.json();
    return HttpResponse.json([
      {
        status: 'SUCCESS',
        object: {
          responseStatusCode: 0,
          productId: '35100003',
          cubeTitleEn: 'Test Cube',
          cubeTitleFr: 'Test Cube Fr',
          cubeStartDate: '1997-01-01',
          cubeEndDate: '2023-01-01',
          frequencyCode: 12,
          nbSeriesCube: 174,
          nbDatapointsCube: 4476,
          releaseTime: '2025-09-23T08:30',
          archiveStatusCode: '2',
          archiveStatusEn: 'CURRENT',
          archiveStatusFr: 'ACTIF',
          subjectCode: ['4211'],
          surveyCode: ['3313'],
          dimension: []
        }
      }
    ]);
  }),

  // An endpoint that simulates the 409 Conflict (Table being updated)
  http.post('https://api.statcan.local/409-test', async () => {
    return HttpResponse.json({ message: 'Conflict' }, { status: 409 });
  }),

  // An endpoint that simulates a 500 error
  http.post('https://api.statcan.local/500-test', async () => {
    return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  })
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe('StatCanClient', () => {
  it('fetches and validates cube metadata successfully', async () => {
    const client = new StatCanClient();
    const data = await client.getCubeMetadata([35100003]);

    expect(data).toHaveLength(1);
    expect(data[0].status).toBe('SUCCESS');
    expect(data[0].object?.productId).toBe('35100003');
    expect(data[0].object?.cubeTitleEn).toBe('Test Cube');
  });

  it('retries on 409 Conflict and eventually throws if retries are exhausted', async () => {
    // We override the fetch inside the client to spy on it or we can just track the time/calls
    const client = new StatCanClient({ baseUrl: 'https://api.statcan.local', maxRetries: 2 });
    
    const startTime = Date.now();
    try {
      // @ts-expect-error - testing an internal method directly to test retry logic
      await client.post('/409-test', {}, z.any());
      expect.fail('Should have thrown an error');
    } catch (err: any) {
      const endTime = Date.now();
      expect(err).toBeInstanceOf(StatCanApiError);
      expect(err.status).toBe(409);
      // 2 retries * 2000ms delay = roughly 4000ms elapsed
      expect(endTime - startTime).toBeGreaterThanOrEqual(3900); 
    }
  }, 10000); // increase timeout due to retries

  it('throws a structured StatCanApiError on 500 responses', async () => {
    const client = new StatCanClient({ baseUrl: 'https://api.statcan.local', maxRetries: 0 });
    
    try {
      // @ts-expect-error
      await client.post('/500-test', {}, z.any());
      expect.fail('Should have thrown an error');
    } catch (err: any) {
      expect(err).toBeInstanceOf(StatCanApiError);
      expect(err.status).toBe(500);
      expect(err.message).toContain('StatCan API error: 500');
    }
  });
});
