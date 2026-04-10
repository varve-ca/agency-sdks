import { z } from 'zod';

// --- Error Handling ---

export class OnsApiError extends Error {
  constructor(
    public status: number,
    public url: string,
    public body: string,
    message: string
  ) {
    super(message);
    this.name = 'OnsApiError';
  }
}

// --- Shared primitives ---

const HrefLinkSchema = z.object({ href: z.string() });
const IdHrefLinkSchema = z.object({ id: z.string(), href: z.string() });
const HrefTitleSchema = z.object({ href: z.string(), title: z.string() });

const PaginatedMetaSchema = z.object({
  count: z.number(),
  offset: z.number(),
  limit: z.number(),
  total_count: z.number(),
});

const ContactSchema = z.object({
  email: z.string(),
  name: z.string(),
  telephone: z.string(),
});

// ─────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────

const TopicCountSchema = z.object({
  type: z.string(),
  label: z.string(),
  count: z.number(),
});

export const SearchItemSchema = z.object({
  type: z.string(),
  uri: z.string(),
  title: z.string(),
  summary: z.string(),
  cdid: z.string(),
  dataset_id: z.string(),
  edition: z.string(),
  keywords: z.array(z.string()),
  meta_description: z.string(),
  release_date: z.string(),
  topics: z.array(z.string()),
  canonical_topic: z.string(),
  // Only present when highlight=true is passed
  highlight: z.object({
    title: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    summary: z.string().optional(),
  }).optional(),
  // Spec fields not observed in live responses
  cancelled: z.boolean().optional(),
  date_changes: z.array(z.object({ change_notice: z.string(), previous_date: z.string() })).optional(),
  dimensions: z.array(z.object({ label: z.string(), name: z.string(), raw_label: z.string() })).optional(),
  finalised: z.boolean().optional(),
  language: z.string().optional(),
  national_statistic: z.boolean().optional(),
  population_type: z.string().optional(),
  provisional_date: z.string().optional(),
  published: z.boolean().optional(),
  source: z.string().optional(),
  survey: z.string().optional(),
});

export const SearchResponseSchema = z.object({
  count: z.number(),
  took: z.number(),
  distinct_items_count: z.number(),
  items: z.array(SearchItemSchema),
  topics: z.array(TopicCountSchema),
  content_types: z.array(TopicCountSchema),
  population_type: z.unknown().optional(),
  dimensions: z.array(TopicCountSchema).optional(),
  suggestions: z.array(z.string()).optional(),
  additional_suggestions: z.array(z.string()).optional(),
});

// ─────────────────────────────────────────────
// Data (timeseries)
// ─────────────────────────────────────────────

export const DatapointSchema = z.object({
  date: z.string(),
  value: z.string(), // ONS always returns numeric values as strings
  label: z.string(),
  year: z.string(),
  month: z.string(),
  quarter: z.string(),
  sourceDataset: z.string(),
  updateDate: z.string(),
});

export const DataDescriptionSchema = z.object({
  title: z.string(),
  contact: ContactSchema.optional(),
  releaseDate: z.string().optional(),
  nextRelease: z.string().optional(),
  datasetId: z.string().optional(),
  datasetUri: z.string().optional(),
  cdid: z.string().optional(),
  unit: z.string().optional(),
  preUnit: z.string().optional(),
  source: z.string().optional(),
  date: z.string().optional(),
  number: z.string().optional(),
  sampleSize: z.string().optional(),
});

export const DataResponseSchema = z.object({
  years: z.array(DatapointSchema),
  quarters: z.array(DatapointSchema),
  months: z.array(DatapointSchema),
  sourceDatasets: z.array(z.object({ uri: z.string() })),
  relatedDatasets: z.array(z.object({ uri: z.string() })),
  relatedDocuments: z.array(z.object({ uri: z.string() })),
  versions: z.array(z.object({
    uri: z.string(),
    updateDate: z.string(),
    correctionNotice: z.string(),
    label: z.string(),
  })).optional(),
  type: z.string(),
  uri: z.string(),
  description: DataDescriptionSchema,
});

// ─────────────────────────────────────────────
// Datasets
// ─────────────────────────────────────────────

export const DatasetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  state: z.string(),
  last_updated: z.string().optional(),
  next_release: z.string().optional(),
  release_frequency: z.string().optional(),
  national_statistic: z.boolean().optional(),
  unit_of_measure: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  contacts: z.array(ContactSchema).optional(),
  methodologies: z.array(HrefTitleSchema).optional(),
  related_datasets: z.array(HrefTitleSchema).optional(),
  qmi: HrefLinkSchema.optional(),
  links: z.object({
    self: HrefLinkSchema,
    editions: HrefLinkSchema,
    latest_version: IdHrefLinkSchema.optional(),
    taxonomy: HrefLinkSchema.optional(),
  }),
});

export const DatasetsResponseSchema = PaginatedMetaSchema.extend({
  items: z.array(DatasetSchema),
});

export const DatasetEditionSchema = z.object({
  id: z.string(),
  edition: z.string(),
  state: z.string(),
  links: z.object({
    self: HrefLinkSchema,
    dataset: IdHrefLinkSchema,
    latest_version: IdHrefLinkSchema,
    versions: HrefLinkSchema,
  }),
});

export const DatasetEditionsResponseSchema = PaginatedMetaSchema.extend({
  items: z.array(DatasetEditionSchema),
});

const VersionDimensionSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  description: z.string().optional(),
  href: z.string().optional(),
  links: z.object({
    code_list: z.unknown(),
    options: z.unknown(),
    version: z.unknown(),
  }).optional(),
});

export const DatasetVersionSchema = z.object({
  id: z.string(),
  edition: z.string(),
  version: z.number(),
  state: z.string(),
  type: z.string().optional(),
  release_date: z.string().optional(),
  last_updated: z.string().optional(),
  collection_id: z.string().optional(),
  dimensions: z.array(VersionDimensionSchema).optional(),
  alerts: z.array(z.unknown()).optional(),
  latest_changes: z.array(z.unknown()).optional(),
  usage_notes: z.array(z.unknown()).optional(),
  downloads: z.unknown().optional(),
  links: z.record(z.string(), z.unknown()).optional(),
});

export const DatasetVersionsResponseSchema = PaginatedMetaSchema.extend({
  items: z.array(DatasetVersionSchema),
});

export const DimensionSchema = z.object({
  name: z.string(),
  label: z.string(),
  description: z.string().optional(),
  links: z.unknown().optional(),
});

export const DimensionsResponseSchema = PaginatedMetaSchema.extend({
  items: z.array(DimensionSchema),
});

export const DimensionOptionSchema = z.object({
  option: z.string(),
  label: z.string(),
  dimension: z.string(),
  links: z.object({
    code: IdHrefLinkSchema,
    code_list: IdHrefLinkSchema,
    version: IdHrefLinkSchema,
  }),
});

export const DimensionOptionsResponseSchema = PaginatedMetaSchema.extend({
  items: z.array(DimensionOptionSchema),
});

export const DatasetMetadataSchema = z.object({
  id: z.string(),
  edition: z.string(),
  version: z.number(),
  state: z.string(),
  title: z.string(),
  description: z.string().optional(),
  release_date: z.string().optional(),
  last_updated: z.string().optional(),
  next_release: z.string().optional(),
  release_frequency: z.string().optional(),
  national_statistic: z.boolean().optional(),
  unit_of_measure: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  contacts: z.array(ContactSchema).optional(),
  dimensions: z.array(VersionDimensionSchema).optional(),
  methodologies: z.array(HrefTitleSchema).optional(),
  related_datasets: z.array(HrefTitleSchema).optional(),
  qmi: HrefLinkSchema.optional(),
  alerts: z.array(z.unknown()).optional(),
  latest_changes: z.array(z.unknown()).optional(),
  usage_notes: z.array(z.unknown()).optional(),
  distribution: z.unknown().optional(),
  downloads: z.unknown().optional(),
  links: z.record(z.string(), z.unknown()).optional(),
});

// ─────────────────────────────────────────────
// Observations
// ─────────────────────────────────────────────

const ObservationOptionSchema = z.object({
  href: z.string(),
  id: z.string(),
  label: z.string().optional(), // present when wildcard dimension used
});

export const ObservationSchema = z.object({
  observation: z.string(),
  // present on each row when a wildcard (*) dimension is used
  dimensions: z.record(z.string(), ObservationOptionSchema).optional(),
});

export const ObservationsResponseSchema = z.object({
  observations: z.array(ObservationSchema),
  total_observations: z.number(),
  limit: z.number(),
  offset: z.number(),
  unit_of_measure: z.string().optional(),
  dimensions: z.record(z.string(), z.object({ option: ObservationOptionSchema })).optional(),
  links: z.object({
    self: HrefLinkSchema,
    version: IdHrefLinkSchema,
    dataset_metadata: HrefLinkSchema,
  }).optional(),
});

// ─────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────

export const FilterDimensionSchema = z.object({
  name: z.string(),
  options: z.array(z.string()),
});

export const FilterSchema = z.object({
  filter_id: z.string(),
  instance_id: z.string(),
  published: z.boolean(),
  dataset: z.object({ id: z.string(), edition: z.string(), version: z.number() }),
  dimensions: z.array(FilterDimensionSchema),
  links: z.object({
    self: HrefLinkSchema,
    version: IdHrefLinkSchema,
    dimensions: HrefLinkSchema,
    filter_output: IdHrefLinkSchema.optional(), // present when submitted=true
  }),
});

const DownloadFileSchema = z.object({ href: z.string().optional(), size: z.string().optional() });

export const FilterOutputSchema = z.object({
  id: z.string(),
  filter_id: z.string(),
  instance_id: z.string(),
  state: z.string(), // "created" | "completed" | "failed"
  published: z.boolean(),
  dataset: z.object({ id: z.string(), edition: z.string(), version: z.number() }),
  dimensions: z.array(FilterDimensionSchema),
  // Only present when state === "completed"
  downloads: z.object({
    csv: DownloadFileSchema.optional(),
    xls: DownloadFileSchema.optional(),
  }).optional(),
  events: z.array(z.object({ type: z.string(), time: z.string() })).optional(),
  links: z.object({
    self: HrefLinkSchema,
    version: IdHrefLinkSchema,
    filter_blueprint: IdHrefLinkSchema.optional(),
    dimensions: z.unknown().optional(),
  }),
});

// ─────────────────────────────────────────────
// Code lists
// ─────────────────────────────────────────────

const CodeListLinksSchema = z.object({
  self: IdHrefLinkSchema,
  editions: HrefLinkSchema,
});

export const CodeListSchema = z.object({
  links: CodeListLinksSchema,
});

export const CodeListsResponseSchema = PaginatedMetaSchema.extend({
  items: z.array(CodeListSchema),
});

export const CodeListEditionSchema = z.object({
  edition: z.string(),
  label: z.string(),
  links: z.object({
    self: IdHrefLinkSchema,
    editions: HrefLinkSchema,
    codes: HrefLinkSchema,
  }),
});

export const CodeListEditionsResponseSchema = PaginatedMetaSchema.extend({
  items: z.array(CodeListEditionSchema),
});

export const CodeSchema = z.object({
  code: z.string(),
  label: z.string(),
  links: z.object({
    self: IdHrefLinkSchema,
    code_list: HrefLinkSchema,
    datasets: HrefLinkSchema,
  }),
});

export const CodesResponseSchema = PaginatedMetaSchema.extend({
  items: z.array(CodeSchema),
});

export const CodeDatasetSchema = z.object({
  ID: z.string(),
  dimension_label: z.string(),
  links: z.object({ self: IdHrefLinkSchema }),
  editions: z.array(z.object({
    ID: z.string(),
    LatestVersion: z.number(),
    links: z.object({
      self: IdHrefLinkSchema,
      dataset_dimension: IdHrefLinkSchema,
      latest_version: IdHrefLinkSchema,
    }),
  })),
});

export const CodeDatasetsResponseSchema = PaginatedMetaSchema.extend({
  items: z.array(CodeDatasetSchema),
});

// ─────────────────────────────────────────────
// Topics
// ─────────────────────────────────────────────

export const TopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  slug: z.string(),
  state: z.string(),
  subtopics_ids: z.array(z.string()).optional(),
  links: z.object({
    self: IdHrefLinkSchema,
    subtopics: HrefLinkSchema.optional(),
    content: HrefLinkSchema.optional(),
  }),
});

export const TopicsResponseSchema = z.object({
  items: z.array(TopicSchema),
  total_count: z.number(),
});

export const TopicContentItemSchema = z.object({
  title: z.string(),
  type: z.string(),
  state: z.string(),
  links: z.record(z.string(), z.unknown()),
});

export const TopicContentResponseSchema = z.object({
  count: z.number(),
  offset_index: z.number(),
  limit: z.number(),
  total_count: z.number(),
  items: z.array(TopicContentItemSchema),
});

const NavigationSubtopicSchema = z.object({
  description: z.string().optional(),
  label: z.string(),
  links: z.object({ self: IdHrefLinkSchema }).optional(),
  name: z.string(),
  slug: z.string(),
});

export const NavigationItemSchema = z.object({
  description: z.string().optional(),
  label: z.string(),
  links: z.object({ self: IdHrefLinkSchema }).optional(),
  name: z.string(),
  slug: z.string(),
  subtopics: z.array(NavigationSubtopicSchema).optional(),
});

export const NavigationResponseSchema = z.object({
  description: z.string(),
  items: z.array(NavigationItemSchema),
  links: z.unknown().optional(),
});

// ─────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────

export type Observation = z.infer<typeof ObservationSchema>;
export type ObservationsResponse = z.infer<typeof ObservationsResponseSchema>;
export type FilterDimension = z.infer<typeof FilterDimensionSchema>;
export type Filter = z.infer<typeof FilterSchema>;
export type FilterOutput = z.infer<typeof FilterOutputSchema>;
export type SearchItem = z.infer<typeof SearchItemSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type Datapoint = z.infer<typeof DatapointSchema>;
export type DataDescription = z.infer<typeof DataDescriptionSchema>;
export type DataResponse = z.infer<typeof DataResponseSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;
export type DatasetsResponse = z.infer<typeof DatasetsResponseSchema>;
export type DatasetEdition = z.infer<typeof DatasetEditionSchema>;
export type DatasetEditionsResponse = z.infer<typeof DatasetEditionsResponseSchema>;
export type DatasetVersion = z.infer<typeof DatasetVersionSchema>;
export type DatasetVersionsResponse = z.infer<typeof DatasetVersionsResponseSchema>;
export type Dimension = z.infer<typeof DimensionSchema>;
export type DimensionsResponse = z.infer<typeof DimensionsResponseSchema>;
export type DimensionOption = z.infer<typeof DimensionOptionSchema>;
export type DimensionOptionsResponse = z.infer<typeof DimensionOptionsResponseSchema>;
export type DatasetMetadata = z.infer<typeof DatasetMetadataSchema>;
export type CodeList = z.infer<typeof CodeListSchema>;
export type CodeListsResponse = z.infer<typeof CodeListsResponseSchema>;
export type CodeListEdition = z.infer<typeof CodeListEditionSchema>;
export type CodeListEditionsResponse = z.infer<typeof CodeListEditionsResponseSchema>;
export type Code = z.infer<typeof CodeSchema>;
export type CodesResponse = z.infer<typeof CodesResponseSchema>;
export type CodeDataset = z.infer<typeof CodeDatasetSchema>;
export type CodeDatasetsResponse = z.infer<typeof CodeDatasetsResponseSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type TopicsResponse = z.infer<typeof TopicsResponseSchema>;
export type TopicContentItem = z.infer<typeof TopicContentItemSchema>;
export type TopicContentResponse = z.infer<typeof TopicContentResponseSchema>;
export type NavigationItem = z.infer<typeof NavigationItemSchema>;
export type NavigationResponse = z.infer<typeof NavigationResponseSchema>;

// ─────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────

export type ContentType = 'timeseries' | 'dataset' | 'timeseries,dataset';

export interface SearchParams {
  q?: string;
  content_type?: ContentType;
  cdids?: string[];
  dataset_ids?: string[];
  topics?: string[];
  population_types?: string[];
  dimensions?: string[];
  limit?: number;
  offset?: number;
  highlight?: boolean;
  sort?: string;
  fromDate?: string;
  toDate?: string;
  nlp_weighting?: boolean;
  uri_prefix?: string;
}

export interface PaginatedParams {
  limit?: number;
  offset?: number;
}

export interface FilterCreateParams {
  dataset: { id: string; edition: string; version: number };
  dimensions: Array<{ name: string; options: string[] }>;
}

// ─────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────

export interface OnsClientOptions {
  baseUrl?: string;
  maxRetries?: number;
}

const USER_AGENT = '@varve/ons-api/0.1.0 (varve +https://varve.ca)';

export class OnsClient {
  private baseUrl: string;
  private maxRetries: number;

  constructor(options: OnsClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://api.beta.ons.gov.uk/v1';
    this.maxRetries = options.maxRetries ?? 2;
  }

  private async fetchWithRetry(url: string, retries = this.maxRetries, init: RequestInit = {}): Promise<Response> {
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, ...init.headers },
    });
    if (!res.ok && res.status === 429 && retries > 0) {
      const retryAfter = res.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.fetchWithRetry(url, retries - 1, init);
    }
    return res;
  }

  private async get<T extends z.ZodTypeAny>(endpoint: string, schema: T): Promise<z.infer<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await this.fetchWithRetry(url);
    if (!res.ok) {
      const body = await res.text();
      throw new OnsApiError(res.status, url, body, `ONS API error: ${res.status} ${res.statusText}`);
    }
    const rawData = await res.json();
    return schema.parse(rawData);
  }

  private async post<T extends z.ZodTypeAny>(endpoint: string, body: unknown, schema: T): Promise<z.infer<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await this.fetchWithRetry(url, this.maxRetries, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new OnsApiError(res.status, url, text, `ONS API error: ${res.status} ${res.statusText}`);
    }
    const rawData = await res.json();
    return schema.parse(rawData);
  }

  private paginatedQuery(params: PaginatedParams): string {
    const q = new URLSearchParams();
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.offset != null) q.set('offset', String(params.offset));
    const s = q.toString();
    return s ? `?${s}` : '';
  }

  // ── Search ────────────────────────────────

  async search(params: SearchParams = {}): Promise<SearchResponse> {
    const q = new URLSearchParams();
    if (params.q) q.set('q', params.q);
    if (params.content_type) q.set('content_type', params.content_type);
    if (params.cdids?.length) q.set('cdids', params.cdids.join(','));
    if (params.dataset_ids?.length) q.set('dataset_ids', params.dataset_ids.join(','));
    if (params.topics?.length) q.set('topics', params.topics.join(','));
    if (params.population_types?.length) q.set('population_types', params.population_types.join(','));
    if (params.dimensions?.length) q.set('dimensions', params.dimensions.join(','));
    if (params.highlight != null) q.set('highlight', String(params.highlight));
    if (params.sort) q.set('sort', params.sort);
    if (params.fromDate) q.set('fromDate', params.fromDate);
    if (params.toDate) q.set('toDate', params.toDate);
    if (params.nlp_weighting != null) q.set('nlp_weighting', String(params.nlp_weighting));
    if (params.uri_prefix) q.set('uri_prefix', params.uri_prefix);
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.offset != null) q.set('offset', String(params.offset));
    return this.get(`/search?${q.toString()}`, SearchResponseSchema);
  }

  // ── Data (timeseries) ────────────────────

  /** Get full timeseries data by URI (from a search result's `uri` field). */
  async getData(uri: string): Promise<DataResponse> {
    return this.get(`/data?uri=${encodeURIComponent(uri)}`, DataResponseSchema);
  }

  /** Convenience: search by CDID(s) then fetch all their data in one call. */
  async getTimeseriesByCdid(cdids: string | string[]): Promise<DataResponse[]> {
    const ids = Array.isArray(cdids) ? cdids : [cdids];
    const results = await this.search({ content_type: 'timeseries', cdids: ids });
    return Promise.all(results.items.map(item => this.getData(item.uri)));
  }

  // ── Datasets ─────────────────────────────

  async getDatasets(params: PaginatedParams = {}): Promise<DatasetsResponse> {
    return this.get(`/datasets${this.paginatedQuery(params)}`, DatasetsResponseSchema);
  }

  async getDataset(id: string): Promise<Dataset> {
    return this.get(`/datasets/${id}`, DatasetSchema);
  }

  async getDatasetEditions(id: string, params: PaginatedParams = {}): Promise<DatasetEditionsResponse> {
    return this.get(`/datasets/${id}/editions${this.paginatedQuery(params)}`, DatasetEditionsResponseSchema);
  }

  async getDatasetEdition(id: string, edition: string): Promise<DatasetEdition> {
    return this.get(`/datasets/${id}/editions/${edition}`, DatasetEditionSchema);
  }

  async getDatasetVersions(id: string, edition: string, params: PaginatedParams = {}): Promise<DatasetVersionsResponse> {
    return this.get(`/datasets/${id}/editions/${edition}/versions${this.paginatedQuery(params)}`, DatasetVersionsResponseSchema);
  }

  async getDatasetVersion(id: string, edition: string, version: number): Promise<DatasetVersion> {
    return this.get(`/datasets/${id}/editions/${edition}/versions/${version}`, DatasetVersionSchema);
  }

  async getDatasetDimensions(id: string, edition: string, version: number, params: PaginatedParams = {}): Promise<DimensionsResponse> {
    return this.get(`/datasets/${id}/editions/${edition}/versions/${version}/dimensions${this.paginatedQuery(params)}`, DimensionsResponseSchema);
  }

  async getDatasetDimensionOptions(id: string, edition: string, version: number, dimension: string, params: PaginatedParams = {}): Promise<DimensionOptionsResponse> {
    return this.get(`/datasets/${id}/editions/${edition}/versions/${version}/dimensions/${dimension}/options${this.paginatedQuery(params)}`, DimensionOptionsResponseSchema);
  }

  async getDatasetMetadata(id: string, edition: string, version: number): Promise<DatasetMetadata> {
    return this.get(`/datasets/${id}/editions/${edition}/versions/${version}/metadata`, DatasetMetadataSchema);
  }

  // ── Observations ─────────────────────────

  /**
   * Get observations for a specific dataset version.
   * Pass dimension values as query params — use "*" as a wildcard for one dimension.
   *
   * @example
   * client.getObservations('cpih01', 'time-series', 6, { time: '*', geography: 'K02000001', aggregate: 'cpih1dim1A0' })
   */
  async getObservations(id: string, edition: string, version: number, dimensions: Record<string, string>): Promise<ObservationsResponse> {
    const q = new URLSearchParams(dimensions);
    return this.get(`/datasets/${id}/editions/${edition}/versions/${version}/observations?${q.toString()}`, ObservationsResponseSchema);
  }

  // ── Filters ───────────────────────────────

  /**
   * Create a filter for a dataset version.
   * Pass submitted=true to process immediately — the response will include a filter_output link.
   * If submitted=false (default), use updateFilter() to modify dimensions then submit separately.
   */
  async createFilter(params: FilterCreateParams, submitted = false): Promise<Filter> {
    const qs = submitted ? '?submitted=true' : '';
    return this.post(`/filters${qs}`, params, FilterSchema);
  }

  /**
   * Get the output of a submitted filter.
   * Filter outputs are processed asynchronously — poll until state === "completed"
   * before accessing the download links.
   */
  async getFilterOutput(filterOutputId: string): Promise<FilterOutput> {
    return this.get(`/filter-outputs/${filterOutputId}`, FilterOutputSchema);
  }

  // ── Code lists ───────────────────────────

  async getCodeLists(params: PaginatedParams = {}): Promise<CodeListsResponse> {
    return this.get(`/code-lists${this.paginatedQuery(params)}`, CodeListsResponseSchema);
  }

  async getCodeList(id: string): Promise<CodeList> {
    return this.get(`/code-lists/${id}`, CodeListSchema);
  }

  async getCodeListEditions(id: string, params: PaginatedParams = {}): Promise<CodeListEditionsResponse> {
    return this.get(`/code-lists/${id}/editions${this.paginatedQuery(params)}`, CodeListEditionsResponseSchema);
  }

  async getCodeListEdition(id: string, edition: string): Promise<CodeListEdition> {
    return this.get(`/code-lists/${id}/editions/${edition}`, CodeListEditionSchema);
  }

  async getCodes(id: string, edition: string, params: PaginatedParams = {}): Promise<CodesResponse> {
    return this.get(`/code-lists/${id}/editions/${edition}/codes${this.paginatedQuery(params)}`, CodesResponseSchema);
  }

  async getCode(id: string, edition: string, codeId: string): Promise<Code> {
    return this.get(`/code-lists/${id}/editions/${edition}/codes/${codeId}`, CodeSchema);
  }

  async getCodeDatasets(id: string, edition: string, codeId: string, params: PaginatedParams = {}): Promise<CodeDatasetsResponse> {
    return this.get(`/code-lists/${id}/editions/${edition}/codes/${codeId}/datasets${this.paginatedQuery(params)}`, CodeDatasetsResponseSchema);
  }

  // ── Topics ───────────────────────────────

  async getNavigation(): Promise<NavigationResponse> {
    return this.get('/navigation', NavigationResponseSchema);
  }

  async getTopics(): Promise<TopicsResponse> {
    return this.get('/topics', TopicsResponseSchema);
  }

  async getTopic(id: string): Promise<Topic> {
    return this.get(`/topics/${id}`, TopicSchema);
  }

  async getTopicSubtopics(id: string): Promise<TopicsResponse> {
    return this.get(`/topics/${id}/subtopics`, TopicsResponseSchema);
  }

  async getTopicContent(id: string, params: PaginatedParams = {}): Promise<TopicContentResponse> {
    return this.get(`/topics/${id}/content${this.paginatedQuery(params)}`, TopicContentResponseSchema);
  }
}
