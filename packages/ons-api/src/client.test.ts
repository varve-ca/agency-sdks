import { describe, it, expect } from 'vitest';
import { OnsClient, OnsApiError } from './client';

describe('OnsClient', () => {
  it('should instantiate with default options', () => {
    const client = new OnsClient();
    expect(client).toBeInstanceOf(OnsClient);
  });

  // TODO: add tests as endpoints are implemented
});
