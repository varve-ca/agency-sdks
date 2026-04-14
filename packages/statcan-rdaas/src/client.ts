import { z } from 'zod';

// --- Error Handling ---

export class RDaaSApiError extends Error {
  constructor(
    public status: number,
    public url: string,
    public body: string,
    message: string
  ) {
    super(message);
    this.name = 'RDaaSApiError';
  }
}

// ─────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────

// JSON-LD @context fields are complex and not meaningful to validate
const LdContextSchema = z.unknown();

// Facet counts returned alongside search results, e.g. { "RELEASED": 1882, "RETIRED": 487 }
const FacetCountsSchema = z.record(z.string(), z.number());
const FacetsSchema = z.record(z.string(), FacetCountsSchema);

// ─────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────

export const SearchFilterSchema = z.object({
  parameter: z.string(),
  values: z.array(z.string()),
});

export const SearchFiltersResponseSchema = z.array(SearchFilterSchema);

export const ClassificationSummarySchema = z.object({
  '@id': z.string(),
  name: z.string(),
  abbreviation: z.string().nullable().optional(),
  versionNumber: z.string().optional(),
  audience: z.string().optional(),
  status: z.string().optional(),
  lastUpdated: z.string().optional(),
  validFrom: z.string().optional(),
  codeCount: z.number().optional(),
  levelCount: z.number().optional(),
  classificationSeries: z.string().optional(),
});

export const ClassificationSearchResponseSchema = z.object({
  results: z.object({
    '@context': LdContextSchema.optional(),
    '@graph': z.array(ClassificationSummarySchema),
  }),
  found: z.number(),
  start: z.number(),
  limit: z.number(),
  facets: FacetsSchema.optional(),
});

export const ConcordanceSummarySchema = z.object({
  '@id': z.string(),
  name: z.string(),
  versionNumber: z.string().optional(),
  audience: z.string().optional(),
  status: z.string().optional(),
  lastUpdated: z.string().optional(),
  source: z.string().optional(),
  source_name: z.string().optional(),
  sourceVersionNumber: z.string().optional(),
  target: z.string().optional(),
  target_name: z.string().optional(),
  targetVersionNumber: z.string().optional(),
});

export const ConcordanceSearchResponseSchema = z.object({
  results: z.object({
    '@context': LdContextSchema.optional(),
    '@graph': z.array(ConcordanceSummarySchema),
  }),
  found: z.number(),
  start: z.number(),
  limit: z.number(),
  facets: FacetsSchema.optional(),
});

// ─────────────────────────────────────────────
// Classifications
// ─────────────────────────────────────────────

const ClassificationLevelSchema = z.object({
  '@id': z.string().optional(),
  levelDepth: z.number(),
  name: z.string(),
  codeCount: z.number().optional(),
});

// Codes in a classification detail can be nested (hierarchical classifications)
type ClassificationCode = {
  '@id'?: string;
  code: string;
  descriptor?: string;
  definition?: string;
  validFrom?: string;
  validTo?: string;
  children?: ClassificationCode[];
};

const ClassificationCodeSchema: z.ZodType<ClassificationCode> = z.lazy(() =>
  z.object({
    '@id': z.string().optional(),
    code: z.string(),
    descriptor: z.string().optional(),
    definition: z.string().optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    children: z.array(ClassificationCodeSchema).optional(),
  })
);

export const ClassificationDetailSchema = z.object({
  '@context': LdContextSchema.optional(),
  '@id': z.string(),
  name: z.string(),
  abbreviation: z.string().nullable().optional(),
  audience: z.string().optional(),
  status: z.string().optional(),
  lastUpdated: z.string().optional(),
  description: z.string().optional(),
  versionName: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  levels: z.array(ClassificationLevelSchema).optional(),
  codes: z.array(ClassificationCodeSchema).optional(),
});

export const CategorySchema = z.object({
  '@id': z.string().optional(),
  code: z.string(),
  descriptor: z.string().optional(),
  definition: z.string().optional(),
  levelDepth: z.number().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

export const ClassificationCategoriesResponseSchema = z.object({
  '@context': LdContextSchema.optional(),
  '@graph': z.array(CategorySchema),
});

// ─────────────────────────────────────────────
// Exclusions
// ─────────────────────────────────────────────

export const ExclusionSchema = z.object({
  '@id': z.string().optional(),
  source: z.string().optional(),
  sourceCodeValue: z.string().optional(),
  term: z.string(),
  target: z.string().optional(),
  targetCodeValue: z.string().optional(),
});

export const ClassificationExclusionsResponseSchema = z.object({
  '@context': LdContextSchema.optional(),
  '@graph': z.array(ExclusionSchema),
});

// Single exclusion (termexclusion/{id}) returns the object directly, not inside @graph
export const TermExclusionSchema = z.object({
  '@context': LdContextSchema.optional(),
  '@id': z.string().optional(),
  source: z.string().optional(),
  sourceCodeValue: z.string().optional(),
  term: z.string(),
  target: z.string().optional(),
  targetCodeValue: z.string().optional(),
});

// ─────────────────────────────────────────────
// Indices
// ─────────────────────────────────────────────

export const IndexEntrySchema = z.object({
  '@id': z.string().optional(),
  indexId: z.number().optional(),
  // Primary search term for the index entry (not in docs, present in live responses)
  primaryTerm: z.string().optional(),
  illustrativeExamples: z.array(z.string()).optional(),
  inclusions: z.array(z.string()).optional(),
  otherExamples: z.array(z.string()).optional(),
  internalExamples: z.array(z.string()).optional(),
  // URI string pointing to the associated code
  indexCode: z.string().optional(),
  indexCodeValue: z.string().optional(),
  indexCodeDescriptor: z.string().optional(),
  exclusions: z.array(z.unknown()).optional(),
});

export const ClassificationIndexesResponseSchema = z.object({
  '@context': LdContextSchema.optional(),
  '@graph': z.array(IndexEntrySchema),
});

// Single-index endpoint returns a flat object (not wrapped in @graph)
export const SingleIndexEntryResponseSchema = IndexEntrySchema.extend({
  '@context': LdContextSchema.optional(),
});

// ─────────────────────────────────────────────
// Concordances
// ─────────────────────────────────────────────

export const CodeMapSchema = z.object({
  '@id': z.string().optional(),
  maptype: z.string().optional(),
  sourceCode: z.string().optional(),
  sourceDescriptor: z.string().optional(),
  sourceSinceVersion: z.string().optional(),
  targetCode: z.string().optional(),
  targetDescriptor: z.string().optional(),
  targetSinceVersion: z.string().optional(),
  distributionFactor: z.number().optional(),
  reverseDistributionFactor: z.number().optional(),
});

export const ConcordanceDetailSchema = z.object({
  '@context': LdContextSchema.optional(),
  '@id': z.string(),
  name: z.string(),
  audience: z.string().optional(),
  status: z.string().optional(),
  lastUpdated: z.string().optional(),
  versionName: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  // URIs pointing to source and target classification resources
  source: z.string().optional(),
  target: z.string().optional(),
  versionConcordance: z.boolean().optional(),
  predominateSource: z.boolean().optional(),
  predominateTarget: z.boolean().optional(),
  codeMaps: z.array(CodeMapSchema).optional(),
});

// ─────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────

export type SearchFilter = z.infer<typeof SearchFilterSchema>;
export type SearchFiltersResponse = z.infer<typeof SearchFiltersResponseSchema>;
export type ClassificationSummary = z.infer<typeof ClassificationSummarySchema>;
export type ClassificationSearchResponse = z.infer<typeof ClassificationSearchResponseSchema>;
export type ConcordanceSummary = z.infer<typeof ConcordanceSummarySchema>;
export type ConcordanceSearchResponse = z.infer<typeof ConcordanceSearchResponseSchema>;
export type ClassificationLevel = z.infer<typeof ClassificationLevelSchema>;
export type ClassificationDetail = z.infer<typeof ClassificationDetailSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type ClassificationCategoriesResponse = z.infer<typeof ClassificationCategoriesResponseSchema>;
export type Exclusion = z.infer<typeof ExclusionSchema>;
export type ClassificationExclusionsResponse = z.infer<typeof ClassificationExclusionsResponseSchema>;
export type TermExclusion = z.infer<typeof TermExclusionSchema>;
export type IndexEntry = z.infer<typeof IndexEntrySchema>;
export type ClassificationIndexesResponse = z.infer<typeof ClassificationIndexesResponseSchema>;
export type SingleIndexEntryResponse = z.infer<typeof SingleIndexEntryResponseSchema>;
export type CodeMap = z.infer<typeof CodeMapSchema>;
export type ConcordanceDetail = z.infer<typeof ConcordanceDetailSchema>;

// ─────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────

export type RDaaSLang = 'en' | 'fr';
export type RDaaSMethod = 'SINGLE' | 'PROPERTY' | 'ARRAY' | 'CONTAINER';

export interface SearchParams {
  q?: string;
  limit?: number;
  start?: number;
  // Can be repeated — pass a string for one value or an array for multiple
  audience?: string | string[];
  status?: string | string[];
}

export interface LangParams {
  lang?: RDaaSLang;
  method?: RDaaSMethod;
}

// ─────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────

export interface RDaaSClientOptions {
  baseUrl?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

const USER_AGENT = '@varve/statcan-rdaas/0.1.0 (varve +https://varve.ca)';

export class RDaaSClient {
  private baseUrl: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(options: RDaaSClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://api.statcan.gc.ca/rdaas';
    this.maxRetries = options.maxRetries ?? 2;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = this.maxRetries
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      let res: Response;
      try {
        res = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: { 'User-Agent': USER_AGENT, ...options.headers },
        });
      } finally {
        clearTimeout(timer);
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

  private async get<T extends z.ZodTypeAny>(endpoint: string, schema: T): Promise<z.infer<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await this.fetchWithRetry(url);
    if (!res.ok) {
      const body = await res.text();
      throw new RDaaSApiError(res.status, url, body, `RDaaS API error: ${res.status} ${res.statusText}`);
    }
    const rawData = await res.json();
    return schema.parse(rawData);
  }

  private buildSearchQuery(params: SearchParams): string {
    const q = new URLSearchParams();
    if (params.q) q.set('q', params.q);
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.start != null) q.set('start', String(params.start));
    if (params.audience) {
      const values = Array.isArray(params.audience) ? params.audience : [params.audience];
      values.forEach(v => q.append('audience', v));
    }
    if (params.status) {
      const values = Array.isArray(params.status) ? params.status : [params.status];
      values.forEach(v => q.append('status', v));
    }
    const s = q.toString();
    return s ? `?${s}` : '';
  }

  private buildLangQuery(params: LangParams): string {
    const q = new URLSearchParams();
    if (params.lang) q.set('lang', params.lang);
    if (params.method) q.set('method', params.method);
    const s = q.toString();
    return s ? `?${s}` : '';
  }

  // ── Search ────────────────────────────────

  async searchClassifications(params: SearchParams = {}): Promise<ClassificationSearchResponse> {
    return this.get(`/search/classifications${this.buildSearchQuery(params)}`, ClassificationSearchResponseSchema);
  }

  async getClassificationSearchFilters(): Promise<SearchFiltersResponse> {
    return this.get('/search/classifications/filters', SearchFiltersResponseSchema);
  }

  async searchConcordances(params: SearchParams = {}): Promise<ConcordanceSearchResponse> {
    return this.get(`/search/concordances${this.buildSearchQuery(params)}`, ConcordanceSearchResponseSchema);
  }

  async getConcordanceSearchFilters(): Promise<SearchFiltersResponse> {
    return this.get('/search/concordances/filters', SearchFiltersResponseSchema);
  }

  // ── Classifications ───────────────────────

  async getClassification(id: string, params: LangParams = {}): Promise<ClassificationDetail> {
    return this.get(`/classification/${id}${this.buildLangQuery(params)}`, ClassificationDetailSchema);
  }

  /** Returns all categories at all levels as a flat list. */
  async getClassificationCategories(id: string, params: LangParams = {}): Promise<ClassificationCategoriesResponse> {
    return this.get(`/classification/${id}/categories${this.buildLangQuery(params)}`, ClassificationCategoriesResponseSchema);
  }

  /** Returns only the most-detailed (leaf) categories — those without sub-categories. */
  async getClassificationCategoriesDetailed(id: string, params: LangParams = {}): Promise<ClassificationCategoriesResponse> {
    return this.get(`/classification/${id}/categories/detailed${this.buildLangQuery(params)}`, ClassificationCategoriesResponseSchema);
  }

  /** Returns all exclusion terms for a classification. */
  async getClassificationExclusions(id: string): Promise<ClassificationExclusionsResponse> {
    return this.get(`/classification/${id}/exclusions`, ClassificationExclusionsResponseSchema);
  }

  /** Returns a single exclusion by its term-exclusion ID (the opaque ID from an exclusion's `@id` URI). */
  async getTermExclusion(id: string): Promise<TermExclusion> {
    return this.get(`/termexclusion/${id}`, TermExclusionSchema);
  }

  /** Returns all index entries for a classification. */
  async getClassificationIndexes(id: string): Promise<ClassificationIndexesResponse> {
    return this.get(`/classification/${id}/indexes`, ClassificationIndexesResponseSchema);
  }

  /** Returns a single index entry by its numeric index ID. */
  async getClassificationIndex(id: string, indexId: number): Promise<SingleIndexEntryResponse> {
    return this.get(`/classification/${id}/indexes/entry/${indexId}`, SingleIndexEntryResponseSchema);
  }

  // ── Concordances ──────────────────────────

  async getConcordance(id: string, params: LangParams = {}): Promise<ConcordanceDetail> {
    return this.get(`/concordance/${id}${this.buildLangQuery(params)}`, ConcordanceDetailSchema);
  }
}
