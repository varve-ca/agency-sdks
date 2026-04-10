import { describe, it, expect } from 'vitest';
import { RDaaSClient, RDaaSApiError } from './client';

describe('RDaaSClient', () => {
  it('should instantiate with default options', () => {
    const client = new RDaaSClient();
    expect(client).toBeInstanceOf(RDaaSClient);
  });

  it('should instantiate with custom options', () => {
    const client = new RDaaSClient({ baseUrl: 'https://example.com', maxRetries: 0 });
    expect(client).toBeInstanceOf(RDaaSClient);
  });

  it('RDaaSApiError should carry status, url, and body', () => {
    const err = new RDaaSApiError(404, 'https://example.com', 'Not found', 'RDaaS API error: 404 Not Found');
    expect(err.status).toBe(404);
    expect(err.url).toBe('https://example.com');
    expect(err.body).toBe('Not found');
    expect(err.name).toBe('RDaaSApiError');
    expect(err).toBeInstanceOf(Error);
  });
});
