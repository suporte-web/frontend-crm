import { Api } from '@/utils/Api';
import type { HelpArticle, HelpArticlePayload, HelpChatResponse, } from '@/types/help-center';

export const HelpCenterService = {
  getHelpArticles: async (): Promise<HelpArticle[]> => {
    const { data } = await Api.get<HelpArticle[]>(`/help-center/articles`, { headers: { 'Cache-Control': 'no-cache' } });
    return data;
  },

  createHelpArticle: async (payload: HelpArticlePayload): Promise<HelpArticle> => {
    const { data } = await Api.post<HelpArticle>(`/help-center/articles`, payload);
    return data;
  },

  updateHelpArticle: async (id: string, payload: Partial<HelpArticlePayload>): Promise<HelpArticle> => {
    const { data } = await Api.put<HelpArticle>(`/help-center/articles/${id}`, payload);
    return data;
  },

  updateHelpArticleStatus: async (id: string, active: boolean): Promise<HelpArticle> => {
    const { data } = await Api.patch<HelpArticle>(`/help-center/articles/${id}/status`, { active });
    return data;
  },

  askHelpCenter: async (message: string): Promise<HelpChatResponse> => {
    const { data } = await Api.post<HelpChatResponse>(`/help-center/chat`, { message });
    return data;
  },
};
