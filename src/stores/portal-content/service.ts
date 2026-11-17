import { Api } from '@/utils/Api';
import type { PortalContent, PortalContentPayload, } from '@/types/portal-content';
export async function getPortalContents(): Promise<PortalContent[]> {
  const { data } = await Api.get<PortalContent[]>(`/portal-content`, { headers: { 'Cache-Control': 'no-cache' } });
  return data;
}
export async function getPublishedPortalContents(): Promise<PortalContent[]> {
  const { data } = await Api.get<PortalContent[]>(`/portal-content/published`, { headers: { 'Cache-Control': 'no-cache' } });
  return data;
}
export async function createPortalContent(payload: PortalContentPayload): Promise<PortalContent> {
  const { data } = await Api.post<PortalContent>(`/portal-content`, payload);
  return data;
}
export async function uploadPortalContentMedia(file: File): Promise<{
  fileName: string;
  mimeType: string;
  url: string;
}> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await Api.post<{
    fileName: string;
    mimeType: string;
    url: string;
  }>(`/portal-content/upload`, formData);
  return data;
}
export async function updatePortalContent(id: string, payload: Partial<PortalContentPayload>): Promise<PortalContent> {
  const { data } = await Api.patch<PortalContent>(`/portal-content/${id}`, payload);
  return data;
}
export async function deletePortalContent(id: string): Promise<{
  message: string;
}> {
  const { data } = await Api.delete<{
    message: string;
  }>(`/portal-content/${id}`);
  return data;
}
