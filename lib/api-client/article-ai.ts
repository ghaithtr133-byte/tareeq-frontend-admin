import type { AxiosRequestConfig } from "axios";

import {
  parseArticleContentSuggestion,
  parseArticleSeoSuggestion,
  type ArticleContentSuggestion,
  type ArticleSeoSuggestion,
} from "@/lib/article-ai-suggestions";
import { apiClient } from "@/lib/api-client/client";

/** Server-generated suggestions always read the saved article; no request body is sent. */
export const articleAiApi = {
  async contentSuggestions(
    id: string,
    config?: Pick<AxiosRequestConfig, "signal">,
  ): Promise<ArticleContentSuggestion> {
    const response = await apiClient.post<unknown>(`/admin/articles/${id}/content-suggestions`, undefined, config);
    return parseArticleContentSuggestion(response.data);
  },
  async seoSuggestions(
    id: string,
    config?: Pick<AxiosRequestConfig, "signal">,
  ): Promise<ArticleSeoSuggestion> {
    const response = await apiClient.post<unknown>(`/admin/articles/${id}/seo-suggestions`, undefined, config);
    return parseArticleSeoSuggestion(response.data);
  },
};
