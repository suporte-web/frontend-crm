import { Api } from '@/utils/Api';
import type { Chat, ChatListItem, ChatMessage, CreateChatPayload, SendChatMessagePayload, UpdateChatMessagePayload, UpdateChatParticipantsPayload, } from "@/types/chat";
export async function getChats(token: string): Promise<ChatListItem[]> {
  const { data } = await Api.get<ChatListItem[]>("/chats", { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function createChat(payload: CreateChatPayload, token: string): Promise<Chat> {
  const { data } = await Api.post<Chat>("/chats", payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getChatMessages(chatId: string, token: string): Promise<ChatMessage[]> {
  const { data } = await Api.get<ChatMessage[]>(`/chats/${chatId}/messages`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function markChatRead(chatId: string, token: string): Promise<{
  chatId: string;
  lastReadAt: string;
}> {
  const { data } = await Api.patch<{
    chatId: string;
    lastReadAt: string;
  }>(`/chats/${chatId}/read`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function sendChatMessage(chatId: string, payload: SendChatMessagePayload, token: string): Promise<ChatMessage> {
  const { data } = await Api.post<ChatMessage>(`/chats/${chatId}/messages`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function updateChatMessage(chatId: string, messageId: string, payload: UpdateChatMessagePayload, token: string): Promise<ChatMessage> {
  const { data } = await Api.patch<ChatMessage>(`/chats/${chatId}/messages/${messageId}`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function deleteChatMessage(chatId: string, messageId: string, token: string): Promise<{
  success: boolean;
}> {
  const { data } = await Api.delete<{
    success: boolean;
  }>(`/chats/${chatId}/messages/${messageId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function updateChatParticipants(chatId: string, payload: UpdateChatParticipantsPayload, token: string): Promise<Chat> {
  const { data } = await Api.patch<Chat>(`/chats/${chatId}/participants`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
