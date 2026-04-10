import { z } from 'zod';

// --- Error Handling ---
export class StatCanApiError extends Error {
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
  cansimId: z.string().optional(),
  cubeTitleEn: z.string(),
  cubeTitleFr: z.string(),
  cubeStartDate: z.string(),
  cubeEndDate: z.string(),
  frequencyCode: z.number(),
  nbSeriesCube: z.number(),
  nbDatapointsCube: z.number(),
  releaseTime: z.string(),
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
  issueDate: z.string().optional(),
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
  refPerRaw: z.string().optional(),
  refPerRaw2: z.string().optional(),
  value: z.number().nullable().optional(),
  decimals: z.number(),
  scalarFactorCode: z.number(),
  symbolCode: z.number(),
  statusCode: z.number(),
  securityLevelCode: z.number(),
  releaseTime: z.string(),
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
  releaseTime: z.string()
});

export const GetChangedSeriesListResponseSchema = z.object({
  status: ResponseStatusSchema,
  object: z.union([z.array(ChangedSeriesSchema), z.string()]).optional()
});

export const ChangedCubeSchema = z.object({
  responseStatusCode: z.number(),
  productId: z.number(),
  releaseTime: z.string()
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
  terminated: z.number(),
  SeriesTitleEn: z.string(),
  SeriesTitleFr: z.string(),
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
  releaseTime: z.string(),
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
}

export class StatCanClient {
  private baseUrl: string;
  private maxRetries: number;

  constructor(options: StatCanClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://www150.statcan.gc.ca/t1/wds/rest';
    this.maxRetries = options.maxRetries ?? 2;
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = this.maxRetries): Promise<Response> {
    try {
      const res = await fetch(url, options);
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

  private async post<T extends z.ZodTypeAny>(endpoint: string, payload: any, schema: T): Promise<z.infer<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new StatCanApiError(res.status, url, body, `StatCan API error: ${res.status} ${res.statusText}`);
    }

    const rawData = await res.json();
    return schema.parse(rawData);
  }

  private async get<T extends z.ZodTypeAny>(endpoint: string, schema: T): Promise<z.infer<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await this.fetchWithRetry(url, {
      method: 'GET',
    });

    if (!res.ok) {
      const body = await res.text();
      throw new StatCanApiError(res.status, url, body, `StatCan API error: ${res.status} ${res.statusText}`);
    }

    const rawData = await res.json();
    return schema.parse(rawData);
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
    return this.post('/getChangedSeriesDataFromCubePidCoord', requests, GetDataResponseSchema);
  }

  async getChangedSeriesDataFromVector(requests: { vectorId: number }[]) {
    return this.post('/getChangedSeriesDataFromVector', requests, GetDataResponseSchema);
  }

  async getDataFromCubePidCoordAndLatestNPeriods(requests: { productId: number; coordinate: string; latestN: number }[]) {
    return this.post('/getDataFromCubePidCoordAndLatestNPeriods', requests, GetDataResponseSchema);
  }

  async getDataFromVectorsAndLatestNPeriods(requests: { vectorId: number; latestN: number }[]) {
    return this.post('/getDataFromVectorsAndLatestNPeriods', requests, GetDataResponseSchema);
  }

  async getBulkVectorDataByRange(vectorIds: string[], startDataPointReleaseDate: string, endDataPointReleaseDate: string) {
    return this.post('/getBulkVectorDataByRange', {
      vectorIds,
      startDataPointReleaseDate,
      endDataPointReleaseDate
    }, GetDataResponseSchema);
  }

  async getDataFromVectorByReferencePeriodRange(vectorIds: number | number[], startRefPeriod?: string, endReferencePeriod?: string) {
    const params = new URLSearchParams();
    const ids = Array.isArray(vectorIds) ? vectorIds.join(',') : String(vectorIds);
    params.append('vectorIds', ids);
    if (startRefPeriod) params.append('startRefPeriod', startRefPeriod);
    if (endReferencePeriod) params.append('endReferencePeriod', endReferencePeriod);
    return this.get(`/getDataFromVectorByReferencePeriodRange?${params.toString()}`, GetDataResponseSchema);
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
