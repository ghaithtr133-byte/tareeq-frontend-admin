import type { AxiosRequestConfig } from "axios";

import { apiClient } from "@/lib/api-client/client";
import { normalizeApiError } from "@/lib/api-client/error";

export type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ScholarshipApplicationStatus = "OPEN" | "CLOSED";
export type ArticleBlockType = "paragraph" | "heading2" | "heading3" | "bulleted-list" | "numbered-list" | "quote";
export type AdminContentResource = "countries" | "universities" | "scholarships" | "services" | "articles";

export interface ArticleRichTextBlock {
  type: ArticleBlockType;
  text: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Country {
  countryCode?: string | null;
  overviewImageUrl?: string | null;
  overviewImageAltAr?: string | null;
  studyLanguageAr?: string | null;
  tuitionSummaryAr?: string | null;
  admissionSummaryAr?: string | null;
  applicationDatesSummaryAr?: string | null;
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  nameAr: string;
  nameEn: string | null;
  introductionAr: string;
  introductionEn: string | null;
  detailsAr: string;
  detailsEn: string | null;
  imageUrl: string | null;
  imageAltAr: string | null;
  imageAltEn: string | null;
  displayOrder: number;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CountryReference {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  countryCode?: string | null;
}

export interface University {
  cityId?: string | null;
  city?: { id: string; slug: string; nameAr: string; nameEn: string } | null;
  universityType?: "PUBLIC" | "PRIVATE" | null;
  logoUrl?: string | null;
  logoAltAr?: string | null;
  logoAltEn?: string | null;
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  nameAr: string;
  nameEn: string | null;
  officialName: string;
  countryId: string;
  cityAr: string;
  cityEn: string | null;
  overviewAr: string;
  summaryAr: string | null;
  overviewEn: string | null;
  officialWebsite: string | null;
  imageUrl: string | null;
  imageAltAr: string | null;
  imageAltEn: string | null;
  country?: CountryReference;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Scholarship {
  imageUrl?: string | null;
  imageAltAr?: string | null;
  imageAltEn?: string | null;
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  titleAr: string;
  titleEn: string | null;
  countryId: string | null;
  universityId: string | null;
  studyLevel: string;
  fundingType: string;
  requirementsAr: string;
  requirementsEn: string | null;
  descriptionAr: string;
  descriptionEn: string | null;
  verifiedDeadline: string | null;
  officialSourceUrl: string | null;
  applicationStatus: ScholarshipApplicationStatus;
  effectiveApplicationStatus?: ScholarshipApplicationStatus;
  country?: Pick<CountryReference, "id" | "slug" | "nameAr" | "countryCode"> | null;
  university?: Pick<University, "id" | "slug" | "nameAr"> | null;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  titleAr: string;
  titleEn: string | null;
  summaryAr: string;
  summaryEn: string | null;
  descriptionAr: string;
  descriptionEn: string | null;
  imageUrl: string | null;
  imageAltAr: string | null;
  imageAltEn: string | null;
  displayOrder: number;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  /** Present on the documented UUID detail/create/PATCH response, not list rows. */
  scholarshipIds?: string[];
  relatedScholarships?: ArticleRelatedScholarship[];
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  titleAr: string;
  titleEn: string | null;
  summaryAr: string;
  summaryEn: string | null;
  bodyAr: ArticleRichTextBlock[];
  bodyEn: ArticleRichTextBlock[] | null;
  coverImageUrl: string | null;
  coverImageAltAr: string | null;
  coverImageAltEn: string | null;
  countryId: string | null;
  universityId: string | null;
  scholarshipId: string | null;
  country?: Pick<CountryReference, "id" | "slug" | "nameAr" | "countryCode"> | null;
  university?: Pick<University, "id" | "slug" | "nameAr"> | null;
  scholarship?: Pick<Scholarship, "id" | "slug" | "titleAr"> | null;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleRelatedScholarship {
  id: string;
  slug: string;
  titleAr: string;
  imageUrl: string | null;
  country: Pick<CountryReference, "id" | "slug" | "nameAr"> | null;
  effectiveApplicationStatus: ScholarshipApplicationStatus;
}
export interface ArticleDetail extends Article { scholarshipIds: string[]; relatedScholarships: ArticleRelatedScholarship[] }

/**
 * The published hard-delete operation returns an impact graph before an
 * explicit SUPER_ADMIN confirmation is allowed. `resource` intentionally
 * remains a string: the deployed operation targets articles while the shared
 * OpenAPI component currently omits `articles` from its target enum.
 */
export interface DeletionImpact {
  target: { resource: string; id: string; slug: string; status: PublicationStatus };
  outcome: "SAFE" | "REQUIRES_CONFIRMATION" | "BLOCKED";
  items: Array<{
    resourceType: string;
    effect: "DELETE" | "SET_NULL" | "UNLINK" | "PRESERVE" | "BLOCK" | "UNKNOWN";
    count: number;
    relationshipPath: string;
    sampleIds: string[];
    code: string;
    canConfirm: boolean;
    blocked: boolean;
  }>;
}

export interface ArticleHardDeleteResult {
  id: string;
  impact: DeletionImpact;
}

export interface ArticleHardDeleteConflict {
  code: "DELETE_REQUIRES_CONFIRMATION" | "DELETE_BLOCKED";
  impact: DeletionImpact;
  confirmation?: { challengeId: string; expiresAt: string };
}

export interface CountryInput {
  overviewImageUrl?: string | null; overviewImageAltAr?: string | null; studyLanguageAr?: string | null; tuitionSummaryAr?: string | null; admissionSummaryAr?: string | null; applicationDatesSummaryAr?: string | null;
  nameAr?: string; nameEn?: string; introductionAr?: string; introductionEn?: string; detailsAr?: string; detailsEn?: string;
  imageUrl?: string; imageAltAr?: string; imageAltEn?: string; displayOrder?: number; slug?: string; featured?: boolean;
  status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}
export interface UniversityInput {
  cityId?: string | null; universityType?: "PUBLIC" | "PRIVATE" | null;
  logoUrl?: string; logoAltAr?: string; logoAltEn?: string;
  nameAr?: string; nameEn?: string; officialName?: string; countryId?: string; cityAr?: string; cityEn?: string;
  overviewAr?: string; summaryAr?: string | null; overviewEn?: string; officialWebsite?: string; imageUrl?: string; imageAltAr?: string; imageAltEn?: string;
  slug?: string; featured?: boolean; status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}
export interface ScholarshipInput {
  imageUrl?: string; imageAltAr?: string; imageAltEn?: string;
  titleAr?: string; titleEn?: string; countryId?: string | null; universityId?: string | null; studyLevel?: string; fundingType?: string;
  requirementsAr?: string; requirementsEn?: string; descriptionAr?: string; descriptionEn?: string; verifiedDeadline?: string | null;
  officialSourceUrl?: string | null; applicationStatus?: ScholarshipApplicationStatus; slug?: string; featured?: boolean;
  status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}
export interface ServiceInput {
  titleAr?: string; titleEn?: string; summaryAr?: string; summaryEn?: string; descriptionAr?: string; descriptionEn?: string;
  imageUrl?: string; imageAltAr?: string; imageAltEn?: string; displayOrder?: number; slug?: string; featured?: boolean;
  status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}
export interface ArticleInput {
  scholarshipIds?: string[];
  titleAr?: string; titleEn?: string; summaryAr?: string; summaryEn?: string; bodyAr?: ArticleRichTextBlock[]; bodyEn?: ArticleRichTextBlock[] | null;
  coverImageUrl?: string; coverImageAltAr?: string; coverImageAltEn?: string; countryId?: string | null; universityId?: string | null;
  scholarshipId?: string | null; slug?: string; featured?: boolean; status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}

export interface BaseListParams {
  page?: number;
  limit?: number;
  featured?: "true" | "false";
  status?: PublicationStatus;
}
export interface CountryListParams extends BaseListParams { search?: string; sort?: "manual" | "newest"; }
export interface UniversityListParams extends BaseListParams { search?: string; country?: string; major?: string; city?: string; studyLevel?: import("@/lib/university-schemas").ProgramStudyLevel; language?: import("@/lib/university-schemas").TeachingLanguage; universityType?: "PUBLIC" | "PRIVATE"; sort?: "newest" | "name"; }
export interface ScholarshipListParams extends BaseListParams {
  search?: string; country?: string; university?: string; studyLevel?: string; fundingType?: string; applicationStatus?: ScholarshipApplicationStatus; sort?: "newest" | "deadline";
  universitySearch?: string; universityCountry?: string; universityMajor?: string;
  universityStudyLevel?: import("@/lib/university-schemas").ProgramStudyLevel;
  universityLanguage?: import("@/lib/university-schemas").TeachingLanguage;
  universityCity?: string; universityType?: "PUBLIC" | "PRIVATE"; universityFeatured?: "true" | "false";
}
export interface ServiceListParams extends BaseListParams { sort?: "manual" | "newest"; }
export interface ArticleListParams extends BaseListParams { search?: string; country?: string; sort?: "newest"; }

export interface ContentTypeMap {
  countries: { record: Country; input: CountryInput; params: CountryListParams };
  universities: { record: University; input: UniversityInput; params: UniversityListParams };
  scholarships: { record: Scholarship; input: ScholarshipInput; params: ScholarshipListParams };
  services: { record: Service; input: ServiceInput; params: ServiceListParams };
  articles: { record: Article; input: ArticleInput; params: ArticleListParams };
}

type SuccessEnvelope<T> = { success: true; data: T };
export type ContentRecord = ContentTypeMap[AdminContentResource]["record"];

function isDeletionImpact(value: unknown): value is DeletionImpact {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<DeletionImpact>;
  return (
    typeof candidate.target === "object" &&
    candidate.target !== null &&
    typeof candidate.target.id === "string" &&
    typeof candidate.target.slug === "string" &&
    typeof candidate.target.resource === "string" &&
    Array.isArray(candidate.items) &&
    (candidate.outcome === "SAFE" || candidate.outcome === "REQUIRES_CONFIRMATION" || candidate.outcome === "BLOCKED")
  );
}

/** Reads the documented 409 deletion envelope without changing the original Axios error. */
export function getArticleHardDeleteConflict(error: unknown): ArticleHardDeleteConflict | undefined {
  const normalized = normalizeApiError(error);
  if (normalized.status !== 409 || typeof normalized.responseData !== "object" || normalized.responseData === null) return undefined;
  const response = normalized.responseData as { error?: { code?: unknown; details?: unknown } };
  const code = response.error?.code;
  const details = response.error?.details;
  if ((code !== "DELETE_REQUIRES_CONFIRMATION" && code !== "DELETE_BLOCKED") || typeof details !== "object" || details === null) return undefined;
  const impact = (details as { impact?: unknown }).impact;
  if (!isDeletionImpact(impact)) return undefined;
  const confirmation = (details as { confirmation?: unknown }).confirmation;
  if (
    code === "DELETE_REQUIRES_CONFIRMATION" &&
    typeof confirmation === "object" &&
    confirmation !== null &&
    typeof (confirmation as { challengeId?: unknown }).challengeId === "string" &&
    typeof (confirmation as { expiresAt?: unknown }).expiresAt === "string"
  ) {
    return { code, impact, confirmation: confirmation as { challengeId: string; expiresAt: string } };
  }
  return { code, impact };
}

/** Article-only hard-delete contract. It is intentionally separate from normal content CRUD. */
export const articleHardDeleteApi = {
  async request(id: string): Promise<ArticleHardDeleteResult> {
    const response = await apiClient.delete<SuccessEnvelope<ArticleHardDeleteResult>>(`/admin/articles/${id}`);
    return response.data.data;
  },
  async confirm(id: string, challengeId: string): Promise<ArticleHardDeleteResult> {
    const response = await apiClient.post<SuccessEnvelope<ArticleHardDeleteResult>>(
      `/admin/articles/${id}/hard-delete/confirm`,
      { challengeId },
    );
    return response.data.data;
  },
};

function makeContentApi<K extends AdminContentResource>(resource: K) {
  type Entry = ContentTypeMap[K];
  const path = `/admin/${resource}`;
  return {
    async list(params: Entry["params"], config?: Pick<AxiosRequestConfig, "signal">): Promise<{ items: Entry["record"][]; pagination: Pagination }> {
      const response = await apiClient.get<SuccessEnvelope<{ items: Entry["record"][]; pagination: Pagination }>>(path, { ...config, params });
      return response.data.data;
    },
    async get(id: string, config?: Pick<AxiosRequestConfig, "signal">): Promise<Entry["record"]> {
      const response = await apiClient.get<SuccessEnvelope<Entry["record"]>>(`${path}/${id}`, config);
      return response.data.data;
    },
    async create(input: Entry["input"]): Promise<Entry["record"]> {
      const response = await apiClient.post<SuccessEnvelope<Entry["record"]>>(path, input);
      return response.data.data;
    },
    async update(id: string, input: Entry["input"]): Promise<Entry["record"]> {
      const response = await apiClient.patch<SuccessEnvelope<Entry["record"]>>(`${path}/${id}`, input);
      return response.data.data;
    },
  };
}

export type ContentResourceApi<K extends AdminContentResource> = {
  list: (params: ContentTypeMap[K]["params"], config?: Pick<AxiosRequestConfig, "signal">) => Promise<{ items: ContentTypeMap[K]["record"][]; pagination: Pagination }>;
  get: (id: string, config?: Pick<AxiosRequestConfig, "signal">) => Promise<ContentTypeMap[K]["record"]>;
  create: (input: ContentTypeMap[K]["input"]) => Promise<ContentTypeMap[K]["record"]>;
  update: (id: string, input: ContentTypeMap[K]["input"]) => Promise<ContentTypeMap[K]["record"]>;
};

/** The 20 approved Admin content operations, grouped by documented resource. */
export const contentApi = {
  countries: makeContentApi("countries"),
  universities: makeContentApi("universities"),
  scholarships: makeContentApi("scholarships"),
  services: makeContentApi("services"),
  articles: makeContentApi("articles"),
};

export function getContentApi<K extends AdminContentResource>(resource: K): ContentResourceApi<K> {
  return contentApi[resource] as unknown as ContentResourceApi<K>;
}
