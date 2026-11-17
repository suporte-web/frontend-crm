import { Api } from '@/utils/Api';
import type { HelpArticle, HelpArticlePayload, HelpChatResponse, } from '@/types/help-center';
export async function getHelpArticles(): Promise<HelpArticle[]> {
  const { data } = await Api.get<HelpArticle[]>(`/help-center/articles`, { headers: { 'Cache-Control': 'no-cache' } });
  return data;
}
export async function createHelpArticle(payload: HelpArticlePayload): Promise<HelpArticle> {
  const { data } = await Api.post<HelpArticle>(`/help-center/articles`, payload);
  return data;
}
export async function updateHelpArticle(id: string, payload: Partial<HelpArticlePayload>): Promise<HelpArticle> {
  const { data } = await Api.put<HelpArticle>(`/help-center/articles/${id}`, payload);
  return data;
}
export async function updateHelpArticleStatus(id: string, active: boolean): Promise<HelpArticle> {
  const { data } = await Api.patch<HelpArticle>(`/help-center/articles/${id}/status`, { active });
  return data;
}
export async function askHelpCenter(message: string): Promise<HelpChatResponse> {
  const { data } = await Api.post<HelpChatResponse>(`/help-center/chat`, { message });
  return data;
}
