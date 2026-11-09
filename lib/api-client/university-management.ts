import type { AxiosRequestConfig } from "axios";
import { z } from "zod";
import { apiClient } from "@/lib/api-client/client";
import { admissionScopes, cityInputSchema, galleryInputSchema, galleryOrderSchema, galleryPatchSchema, isoDateSchema, majorInputSchema, programCreateSchema, programPatchSchema, programStudyLevels, publicationStates, requirementCreateSchema, requirementPatchSchema, teachingLanguages, tuitionRecordSchema, uuidSchema, type CityInput, type GalleryInput, type MajorInput, type ProgramInput, type RequirementInput } from "@/lib/university-schemas";

export type DirectoryKind = "academic-majors" | "cities";
export type UniversitySection = "programs" | "admission-requirements" | "gallery";
const timestamps = { createdAt: isoDateSchema, updatedAt: isoDateSchema };
const localized = { id: uuidSchema, slug: z.string(), nameAr: z.string(), nameEn: z.string() };
const majorSummary = z.object({ ...localized, category: z.string().nullable() });
const directorySchemas = {
  "academic-majors": majorSummary.extend(timestamps),
  cities: z.object({ ...localized, countryId: uuidSchema, ...timestamps, country: z.object({ ...localized, nameEn: z.string().nullable() }).optional() }),
};
export type AcademicMajor = z.infer<typeof directorySchemas["academic-majors"]>;
export type City = z.infer<typeof directorySchemas.cities>;
export type DirectoryRecords = { "academic-majors": AcademicMajor; cities: City };
export type DirectoryInputs = { "academic-majors": MajorInput; cities: CityInput };
const recordFields = { id: uuidSchema, universityId: uuidSchema, status: z.enum(publicationStates), publishedAt: isoDateSchema.nullable(), ...timestamps };
const sectionSchemas = {
  programs: z.object({ ...recordFields, nameAr: z.string().nullable(), nameEn: z.string().nullable(), facultyNameAr: z.string().nullable(), facultyNameEn: z.string().nullable(), durationValue: z.number().int().nullable(), durationUnit: z.enum(["MONTHS", "YEARS"]).nullable(), academicMajorId: uuidSchema, academicMajor: majorSummary, studyLevel: z.enum(programStudyLevels), languages: z.array(z.enum(teachingLanguages)), officialSourceUrl: z.string(), verifiedAt: isoDateSchema,
    // Both current tuition and history items reference the published nullable schema.
    tuition: tuitionRecordSchema.nullable(), tuitionFees: z.array(tuitionRecordSchema.nullable()),
  }),
  "admission-requirements": z.object({ ...recordFields, scope: z.enum(admissionScopes),
    studyLevel: z.enum(programStudyLevels).nullable(), programId: uuidSchema.nullable(), contentAr: z.string(), contentEn: z.string().nullable(), officialSourceUrl: z.string().nullable(), verifiedAt: isoDateSchema.nullable(), program: z.object({ id: uuidSchema, nameAr: z.string().nullable(), nameEn: z.string().nullable(), studyLevel: z.enum(programStudyLevels) }).nullable(),
  }),
  gallery: z.object({ ...recordFields, imageUrl: z.string(), altAr: z.string().nullable(), altEn: z.string().nullable(), displayOrder: z.number().int() }),
};
export type UniversityProgram = z.infer<typeof sectionSchemas.programs>;
export type AdmissionRequirement = z.infer<typeof sectionSchemas["admission-requirements"]>;
export type GalleryImage = z.infer<typeof sectionSchemas.gallery>;
export type SectionRecords = { programs: UniversityProgram; "admission-requirements": AdmissionRequirement; gallery: GalleryImage };
export type SectionInputs = { programs: ProgramInput; "admission-requirements": RequirementInput; gallery: GalleryInput };
export interface ManagementListParams { page?: number; limit?: number; search?: string; countryId?: string; studyLevel?: typeof programStudyLevels[number]; language?: typeof teachingLanguages[number]; faculty?: string; status?: typeof publicationStates[number]; scope?: typeof admissionScopes[number] }
const paginationSchema = z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int(), totalPages: z.number().int() });
export type ManagementPage<T> = { items: T[]; pagination: z.infer<typeof paginationSchema> };
type Signal = Pick<AxiosRequestConfig, "signal">;
const pathNames = { programs: "university-programs", "admission-requirements": "university-admission-requirements", gallery: "university-gallery" };
const createSchemas = { programs: programCreateSchema, "admission-requirements": requirementCreateSchema, gallery: galleryInputSchema };
const patchSchemas = { programs: programPatchSchema, "admission-requirements": requirementPatchSchema, gallery: galleryPatchSchema };

export function managementParams(kind: DirectoryKind | UniversitySection, input: ManagementListParams) {
  const isLarge = kind === "gallery" || kind === "admission-requirements";
  const base = { page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(isLarge ? 100 : 50).default(isLarge ? 50 : 12) };
  const search = z.string().trim().min(1).max(200).optional();
  const shapes = {
    "academic-majors": z.object({ ...base, search }), cities: z.object({ ...base, search, countryId: uuidSchema.optional() }),
    programs: z.object({ ...base, search, studyLevel: z.enum(programStudyLevels).optional(), language: z.enum(teachingLanguages).optional(), faculty: search, status: z.enum(publicationStates).optional() }),
    "admission-requirements": z.object({ ...base, status: z.enum(publicationStates).optional(), scope: z.enum(admissionScopes).optional() }),
    gallery: z.object({ ...base, status: z.enum(publicationStates).optional() }),
  };
  return shapes[kind].parse(input);
}
function envelope<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> { return schema.parse(z.object({ success: z.literal(true), data: z.unknown() }).parse(data).data); }
function page<T extends z.ZodType>(schema: T, data: unknown) { return envelope(z.object({ items: z.array(schema), pagination: paginationSchema }), data); }

export const directoryApi = {
  async list<K extends DirectoryKind>(kind: K, params: ManagementListParams, config?: Signal): Promise<ManagementPage<DirectoryRecords[K]>> {
    const response = await apiClient.get(`/admin/${kind}`, { ...config, params: managementParams(kind, params) });
    return page(directorySchemas[kind], response.data) as ManagementPage<DirectoryRecords[K]>;
  },
  async create<K extends DirectoryKind>(kind: K, input: DirectoryInputs[K]): Promise<DirectoryRecords[K]> {
    const payload = (kind === "cities" ? cityInputSchema : majorInputSchema).parse(input);
    const response = await apiClient.post(`/admin/${kind}`, payload);
    return envelope(directorySchemas[kind], response.data) as DirectoryRecords[K];
  },
};
export const universitySectionApi = {
  async list<K extends UniversitySection>(section: K, universityId: string, params: ManagementListParams, config?: Signal): Promise<ManagementPage<SectionRecords[K]>> {
    uuidSchema.parse(universityId);
    const response = await apiClient.get(`/admin/universities/${universityId}/${section}`, { ...config, params: managementParams(section, params) });
    return page(sectionSchemas[section], response.data) as ManagementPage<SectionRecords[K]>;
  },
  async save<K extends UniversitySection>(section: K, universityId: string, input: Partial<SectionInputs[K]>, id?: string): Promise<SectionRecords[K]> {
    uuidSchema.parse(universityId); if (id) uuidSchema.parse(id);
    const payload = (id ? patchSchemas[section] : createSchemas[section]).parse(input);
    const response = id ? await apiClient.patch(`/admin/${pathNames[section]}/${id}`, payload) : await apiClient.post(`/admin/universities/${universityId}/${section}`, payload);
    return envelope(sectionSchemas[section], response.data) as SectionRecords[K];
  },
  async detach(id: string) { uuidSchema.parse(id); const response = await apiClient.delete(`/admin/university-gallery/${id}`); return envelope(z.object({ id: uuidSchema }), response.data); },
  async reorder(universityId: string, orderedIds: string[]) { uuidSchema.parse(universityId); const response = await apiClient.patch(`/admin/universities/${universityId}/gallery/order`, galleryOrderSchema.parse({ orderedIds })); return envelope(z.object({ items: z.array(sectionSchemas.gallery) }), response.data); },
};

/** Ordering requires the complete non-archived set, never just the displayed page. */
export async function loadGalleryOrder(universityId: string, signal?: AbortSignal): Promise<GalleryImage[]> {
  const items: GalleryImage[] = []; let totalPages = 1; let expectedTotal: number | undefined;
  for (let page = 1; page <= totalPages; page++) {
    const data = await universitySectionApi.list("gallery", universityId, { page, limit: 100 }, { signal });
    if (data.pagination.page !== page || (expectedTotal !== undefined && expectedTotal !== data.pagination.total)) throw new Error("تغيّرت القائمة؛ أعد تحميل الترتيب.");
    expectedTotal = data.pagination.total; totalPages = data.pagination.totalPages; items.push(...data.items);
    if (page < totalPages && data.items.length === 0) throw new Error("قائمة ترتيب غير مكتملة.");
  }
  if (items.length !== expectedTotal || new Set(items.map(item => item.id)).size !== items.length) throw new Error("قائمة ترتيب غير مكتملة.");
  const active = items.filter(item => item.status !== "ARCHIVED").sort((a, b) => a.displayOrder - b.displayOrder);
  if (active.length > 100) throw new Error("عقد الترتيب يسمح بـ 100 صورة غير مؤرشفة فقط. يلزم تنسيق Backend لهذه الجامعة.");
  return active;
}
