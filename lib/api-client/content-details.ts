import { z } from "zod";

import { apiClient } from "@/lib/api-client/client";
import { detailCreateSchema, detailItemSchema, detailOrderSchema, detailPatchSchema, type DetailCreateInput, type DetailItem, type DetailKind, type DetailPatchInput, type DetailResource } from "@/lib/content-detail-schemas";
import { uuidSchema } from "@/lib/university-schemas";

const endpoint = {
  countries: { collection: "study-guide", item: "study-guide" },
  services: { collection: "service-detail-items", item: "service-detail-items" },
  scholarships: { collection: "scholarship-detail-items", item: "scholarship-detail-items" },
} as const;
const success = <T extends z.ZodType>(schema: T, value: unknown) => schema.parse(z.object({ success: z.literal(true), data: z.unknown() }).parse(value).data);

function paths(resource: DetailResource, parentId: string) {
  uuidSchema.parse(parentId);
  const config = endpoint[resource];
  return { collection: `/admin/${resource}/${parentId}/${config.collection}`, item: (id: string) => { uuidSchema.parse(id); return `/admin/${config.item}/${id}`; } };
}

export const contentDetailApi = {
  async list(resource: DetailResource, parentId: string, kind: DetailKind, signal?: AbortSignal): Promise<DetailItem[]> {
    const response = await apiClient.get(paths(resource, parentId).collection, { signal, params: { kind } });
    return success(z.object({ items: z.array(detailItemSchema) }), response.data).items;
  },
  async create(resource: DetailResource, parentId: string, input: DetailCreateInput) {
    const response = await apiClient.post(paths(resource, parentId).collection, detailCreateSchema.parse(input));
    return success(z.object({ id: uuidSchema }), response.data);
  },
  async update(resource: DetailResource, parentId: string, id: string, input: DetailPatchInput) {
    const response = await apiClient.patch(paths(resource, parentId).item(id), detailPatchSchema.parse(input));
    return success(z.object({ id: uuidSchema }), response.data);
  },
  async remove(resource: DetailResource, parentId: string, id: string) {
    const response = await apiClient.delete(paths(resource, parentId).item(id));
    return success(z.object({ id: uuidSchema }), response.data);
  },
  async reorder(resource: DetailResource, parentId: string, kind: DetailKind, orderedIds: string[]) {
    const response = await apiClient.patch(`${paths(resource, parentId).collection}/order`, detailOrderSchema.parse({ kind, orderedIds }));
    return success(z.object({ items: z.array(detailItemSchema).optional() }).passthrough(), response.data);
  },
};
