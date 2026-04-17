import { z } from 'zod';

// --- Error Handling ---

export class StatCanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatCanError';
  }
}

export class StatCanApiError extends StatCanError {
  constructor(
    public status: number,
    public url: string,
    public body: string,
    message: string
  ) {
    super(message);
    this.name = 'StatCanApiError';
  }
}

export class AgencyResponseError extends StatCanApiError {
  constructor(status: number, url: string, body: string, message: string) {
    super(status, url, body, message);
    this.name = 'AgencyResponseError';
  }
}

export class InvalidCoordinateError extends StatCanApiError {
  constructor(status: number, url: string, body: string, message: string) {
    super(status, url, body, message);
    this.name = 'InvalidCoordinateError';
  }
}

export class AgencyInternalError extends StatCanApiError {
  constructor(status: number, url: string, body: string, message: string) {
    super(status, url, body, message);
    this.name = 'AgencyInternalError';
  }
}

export class SuppressedDataError extends StatCanError {
  constructor(message: string) {
    super(message);
    this.name = 'SuppressedDataError';
  }
}

// --- Zod Schemas ---

export const ResponseStatusSchema = z.enum(['SUCCESS', 'FAILED']);

export const MemberSchema = z.object({
  memberId: z.number(),
  parentMemberId: z.number().nullable().optional(),
  memberNameEn: z.string().nullable().optional(),
  memberNameFr: z.string().nullable().optional(),
  classificationCode: z.string().nullable().optional(),
  classificationTypeCode: z.string().nullable().optional(),
  geoLevel: z.number().nullable().optional(),
  vintage: z.number().nullable().optional(),
  terminated: z.number().nullable().optional(),
  memberUomCode: z.number().nullable().optional(),
});

export const DimensionSchema = z.object({
  dimensionPositionId: z.number(),
  dimensionNameEn: z.string(),
  dimensionNameFr: z.string(),
  hasUom: z.boolean(),
  member: z.array(MemberSchema).optional(),
});

export const FootnoteLinkSchema = z.object({
  footnoteId: z.number(),
  dimensionPositionId: z.number(),
  memberId: z.number()
});

export const FootnoteSchema = z.object({
  footnoteId: z.number(),
  footnotesEn: z.string(),
  footnotesFr: z.string(),
  link: FootnoteLinkSchema.optional()
});

export const TableMetadataSchema = z.object({
  responseStatusCode: z.number(),
  productId: z.string(),
  cansimId: z.string().nullable().optional(),
  cubeTitleEn: z.string(),
  cubeTitleFr: z.string(),
  cubeStartDate: z.string(),
  cubeEndDate: z.string(),
  frequencyCode: z.number(),
  nbSeriesCube: z.number(),
  nbDatapointsCube: z.number(),
  releaseTime: z.string().nullable().optional(),
  archiveStatusCode: z.string(),
  archiveStatusEn: z.string(),
  archiveStatusFr: z.string(),
  subjectCode: z.array(z.string()),
  surveyCode: z.array(z.string()),
  dimension: z.array(DimensionSchema),
  footnote: z.array(FootnoteSchema).optional(),
  correctionFootnote: z.array(z.unknown()).optional(),
  geoAttribute: z.array(z.unknown()).nullable().optional(),
  correction: z.array(z.unknown()).optional(),
  issueDate: z.string().nullable().optional(),
});

export const GetCubeMetadataResponseSchema = z.array(
  z.object({
    status: ResponseStatusSchema,
    object: z.union([TableMetadataSchema, z.string()]).optional(),
  })
);

export const DatapointSchema = z.object({
  refPer: z.string(),
  refPer2: z.string().optional(),
  refPerRaw: z.string().nullable().optional(),
  refPerRaw2: z.string().optional(),
  value: z.number().nullable().optional(),
  decimals: z.number(),
  scalarFactorCode: z.number(),
  symbolCode: z.number(),
  statusCode: z.number(),
  securityLevelCode: z.number(),
  releaseTime: z.string().nullable().optional(),
  frequencyCode: z.number(),
});

export const VectorDataSchema = z.object({
  responseStatusCode: z.number(),
  productId: z.number(),
  coordinate: z.string(),
  vectorId: z.number(),
  vectorDataPoint: z.array(DatapointSchema),
});

export const GetDataResponseSchema = z.array(
  z.object({
    status: ResponseStatusSchema,
    object: z.union([VectorDataSchema, z.string()]).optional(),
  })
);

export const ChangedSeriesSchema = z.object({
  responseStatusCode: z.number(),
  productId: z.number(),
  coordinate: z.string(),
  vectorId: z.number(),
  releaseTime: z.string().nullable().optional()
});

export const GetChangedSeriesListResponseSchema = z.object({
  status: ResponseStatusSchema,
  object: z.union([z.array(ChangedSeriesSchema), z.string()]).optional()
});

export const ChangedCubeSchema = z.object({
  responseStatusCode: z.number(),
  productId: z.number(),
  releaseTime: z.string().nullable().optional()
});

export const GetChangedCubeListResponseSchema = z.object({
  status: ResponseStatusSchema,
  object: z.union([z.array(ChangedCubeSchema), z.string()]).optional()
});

export const SeriesInfoSchema = z.object({
  responseStatusCode: z.number(),
  productId: z.number(),
  coordinate: z.string(),
  vectorId: z.number(),
  frequencyCode: z.number(),
  scalarFactorCode: z.number(),
  decimals: z.number(),
  terminated: z.number().nullable().optional(),
  SeriesTitleEn: z.string().nullable().optional(),
  SeriesTitleFr: z.string().nullable().optional(),
  memberUomCode: z.number().nullable().optional()
});

export const GetSeriesInfoResponseSchema = z.array(
  z.object({
    status: ResponseStatusSchema,
    object: z.union([SeriesInfoSchema, z.string()]).optional()
  })
);

export const CubeListLiteItemSchema = z.object({
  productId: z.number(),
  cansimId: z.string().nullable().optional(),
  cubeTitleEn: z.string(),
  cubeTitleFr: z.string(),
  cubeStartDate: z.string(),
  cubeEndDate: z.string(),
  releaseTime: z.string().nullable().optional(),
  archived: z.string(),
  subjectCode: z.array(z.string()).nullable().optional(),
  surveyCode: z.array(z.string()).nullable().optional(),
  frequencyCode: z.number(),
  corrections: z.array(z.any()).nullable().optional(),
  issueDate: z.string().nullable().optional()
});

export const CubeListItemSchema = CubeListLiteItemSchema.extend({
  dimensions: z.array(z.any()).optional()
});

export const GetStringResponseSchema = z.object({
  status: ResponseStatusSchema,
  object: z.string().optional()
});

export const CodeSetsSchema = z.object({
  status: ResponseStatusSchema,
  object: z.record(z.string(), z.array(z.record(z.string(), z.any()))).optional()
});

export type TableMetadata = z.infer<typeof TableMetadataSchema>;
export type Datapoint = z.infer<typeof DatapointSchema>;
export type VectorData = z.infer<typeof VectorDataSchema>;
export type SeriesInfo = z.infer<typeof SeriesInfoSchema>;

// --- Client Implementation ---

export interface StatCanClientOptions {
  baseUrl?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export class StatCanClient {
  private baseUrl: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(options: StatCanClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://www150.statcan.gc.ca/t1/wds/rest';
    this.maxRetries = options.maxRetries ?? 2;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = this.maxRetries): Promise<Response> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      let res: Response;
      try {
        res = await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok && res.status === 409 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      return res;
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw err;
    }
  }

  private async processResponse<T extends z.ZodTypeAny>(res: Response, url: string, schema: T): Promise<z.infer<T>> {
    const contentType = res.headers.get('Content-Type') || '';
    
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 500 && contentType.includes('text/html')) {
        throw new AgencyInternalError(res.status, url, body, `StatCan Agency Internal Error (500 HTML): ${url}`);
      }
      if (res.status === 400) {
        throw new InvalidCoordinateError(res.status, url, body, `StatCan API error: 400 Bad Request (likely Invalid Coordinate)`);
      }
      throw new StatCanApiError(res.status, url, body, `StatCan API error: ${res.status} ${res.statusText}`);
    }

    if (!contentType.includes('application/json')) {
      const body = await res.text();
      throw new AgencyResponseError(res.status, url, body, `Unexpected response content type: ${contentType}. Expected application/json.`);
    }

    let rawData: any;
    try {
      rawData = await res.json();
    } catch (err: any) {
      throw new AgencyResponseError(res.status, url, '', `Failed to parse JSON response: ${err.message}`);
    }

    // Check for "Response Code 1" (Invalid Coordinate) in common response structures
    const checkResponseCode = (obj: any) => {
      if (obj && typeof obj === 'object' && 'responseStatusCode' in obj && obj.responseStatusCode === 1) {
        throw new InvalidCoordinateError(res.status, url, JSON.stringify(rawData), 'StatCan reported responseStatusCode: 1 (Invalid Coordinate/Product)');
      }
    };

    if (Array.isArray(rawData)) {
      for (const item of rawData) {
        if (item.object) checkResponseCode(item.object);
      }
    } else if (rawData.object) {
      checkResponseCode(rawData.object);
    }

    return schema.parse(rawData);
  }

  private async post<T extends z.ZodTypeAny>(endpoint: string, payload: any, schema: T): Promise<z.infer<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return this.processResponse(res, url, schema);
  }

  private async get<T extends z.ZodTypeAny>(endpoint: string, schema: T): Promise<z.infer<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await this.fetchWithRetry(url, {
      method: 'GET',
    });

    return this.processResponse(res, url, schema);
  }

  private validateDataResponse(data: z.infer<typeof GetDataResponseSchema>) {
    for (const item of data) {
      if (item.status === 'SUCCESS' && item.object && typeof item.object !== 'string') {
        if (item.object.vectorDataPoint.length === 0) {
          throw new SuppressedDataError(`Series ${item.object.vectorId} (coordinate ${item.object.coordinate}) exists but contains no data points.`);
        }
      }
    }
    return data;
  }

  // --- 1. Product Change Listings ---

  async getChangedSeriesList() {
    return this.get('/getChangedSeriesList', GetChangedSeriesListResponseSchema);
  }

  async getChangedCubeList(dateIso: string) {
    return this.get(`/getChangedCubeList/${dateIso}`, GetChangedCubeListResponseSchema);
  }

  // --- 2. Cube Metadata and Series Information ---

  async getCubeMetadata(productIds: number[]) {
    const payload = productIds.map(id => ({ productId: id }));
    return this.post('/getCubeMetadata', payload, GetCubeMetadataResponseSchema);
  }

  async getSeriesInfoFromCubePidCoord(requests: { productId: number; coordinate: string }[]) {
    return this.post('/getSeriesInfoFromCubePidCoord', requests, GetSeriesInfoResponseSchema);
  }

  async getSeriesInfoFromVector(requests: { vectorId: number }[]) {
    return this.post('/getSeriesInfoFromVector', requests, GetSeriesInfoResponseSchema);
  }

  async getAllCubesList() {
    return this.get('/getAllCubesList', z.array(CubeListItemSchema));
  }

  async getAllCubesListLite() {
    return this.get('/getAllCubesListLite', z.array(CubeListLiteItemSchema));
  }

  // --- 3. Data Access ---

  async getChangedSeriesDataFromCubePidCoord(requests: { productId: number; coordinate: string }[]) {
    const res = await this.post('/getChangedSeriesDataFromCubePidCoord', requests, GetDataResponseSchema);
    return this.validateDataResponse(res);
  }

  async getChangedSeriesDataFromVector(requests: { vectorId: number }[]) {
    const res = await this.post('/getChangedSeriesDataFromVector', requests, GetDataResponseSchema);
    return this.validateDataResponse(res);
  }

  async getDataFromCubePidCoordAndLatestNPeriods(requests: { productId: number; coordinate: string; latestN: number }[]) {
    const res = await this.post('/getDataFromCubePidCoordAndLatestNPeriods', requests, GetDataResponseSchema);
    return this.validateDataResponse(res);
  }

  async getDataFromVectorsAndLatestNPeriods(requests: { vectorId: number; latestN: number }[]) {
    const res = await this.post('/getDataFromVectorsAndLatestNPeriods', requests, GetDataResponseSchema);
    return this.validateDataResponse(res);
  }

  async getBulkVectorDataByRange(vectorIds: string[], startDataPointReleaseDate: string, endDataPointReleaseDate: string) {
    const res = await this.post('/getBulkVectorDataByRange', {
      vectorIds,
      startDataPointReleaseDate,
      endDataPointReleaseDate
    }, GetDataResponseSchema);
    return this.validateDataResponse(res);
  }

  async getDataFromVectorByReferencePeriodRange(vectorIds: number | number[], startRefPeriod?: string, endReferencePeriod?: string) {
    const params = new URLSearchParams();
    const ids = Array.isArray(vectorIds) ? vectorIds.join(',') : String(vectorIds);
    params.append('vectorIds', ids);
    if (startRefPeriod) params.append('startRefPeriod', startRefPeriod);
    if (endReferencePeriod) params.append('endReferencePeriod', endReferencePeriod);
    const res = await this.get(`/getDataFromVectorByReferencePeriodRange?${params.toString()}`, GetDataResponseSchema);
    return this.validateDataResponse(res);
  }

  async getFullTableDownloadCSV(productId: number, language: 'en' | 'fr') {
    return this.get(`/getFullTableDownloadCSV/${productId}/${language}`, GetStringResponseSchema);
  }

  async getFullTableDownloadSDMX(productId: number) {
    return this.get(`/getFullTableDownloadSDMX/${productId}`, GetStringResponseSchema);
  }

  // --- 4. Supplemental Information ---

  async getCodeSets() {
    return this.get('/getCodeSets', CodeSetsSchema);
  }
}
