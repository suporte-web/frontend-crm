import { Api } from '@/utils/Api';
import type { PortalContent, PortalContentPayload, } from '@/types/portal-content';

export const PortalContentService = {
  getPortalContents: async (): Promise<PortalContent[]> => {
    const { data } = await Api.get<PortalContent[]>(`/portal-content`, { headers: { 'Cache-Control': 'no-cache' } });
    return data;
  },

  getPublishedPortalContents: async (): Promise<PortalContent[]> => {
    const { data } = await Api.get<PortalContent[]>(`/portal-content/published`, { headers: { 'Cache-Control': 'no-cache' } });
    return data;
  },

  createPortalContent: async (payload: PortalContentPayload): Promise<PortalContent> => {
    const { data } = await Api.post<PortalContent>(`/portal-content`, payload);
    return data;
  },

  uploadPortalContentMedia: async (file: File): Promise<{
    fileName: string;
    mimeType: string;
    url: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await Api.post<{
      fileName: string;
      mimeType: string;
      url: string;
    }>(`/portal-content/upload`, formData);
    return data;
  },

  updatePortalContent: async (id: string, payload: Partial<PortalContentPayload>): Promise<PortalContent> => {
    const { data } = await Api.patch<PortalContent>(`/portal-content/${id}`, payload);
    return data;
  },

  deletePortalContent: async (id: string): Promise<{
    message: string;
  }> => {
    const { data } = await Api.delete<{
      message: string;
    }>(`/portal-content/${id}`);
    return data;
  },
};
