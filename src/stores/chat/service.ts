import { Api } from '@/utils/Api';
import type { Chat, ChatListItem, ChatMessage, CreateChatPayload, SendChatMessagePayload, UpdateChatMessagePayload, UpdateChatParticipantsPayload, } from "@/types/chat";

export const ChatService = {
  getChats: async (): Promise<ChatListItem[]> => {
    const { data } = await Api.get<ChatListItem[]>("/chats");
    return data;
  },

  createChat: async (payload: CreateChatPayload): Promise<Chat> => {
    const { data } = await Api.post<Chat>("/chats", payload);
    return data;
  },

  getChatMessages: async (chatId: string): Promise<ChatMessage[]> => {
    const { data } = await Api.get<ChatMessage[]>(`/chats/${chatId}/messages`);
    return data;
  },

  markChatRead: async (chatId: string): Promise<{
    chatId: string;
    lastReadAt: string;
  }> => {
    const { data } = await Api.patch<{
      chatId: string;
      lastReadAt: string;
    }>(`/chats/${chatId}/read`, {});
    return data;
  },

  sendChatMessage: async (chatId: string, payload: SendChatMessagePayload): Promise<ChatMessage> => {
    const { data } = await Api.post<ChatMessage>(`/chats/${chatId}/messages`, payload);
    return data;
  },

  updateChatMessage: async (chatId: string, messageId: string, payload: UpdateChatMessagePayload): Promise<ChatMessage> => {
    const { data } = await Api.patch<ChatMessage>(`/chats/${chatId}/messages/${messageId}`, payload);
    return data;
  },

  deleteChatMessage: async (chatId: string, messageId: string): Promise<{
    success: boolean;
  }> => {
    const { data } = await Api.delete<{
      success: boolean;
    }>(`/chats/${chatId}/messages/${messageId}`);
    return data;
  },

  updateChatParticipants: async (chatId: string, payload: UpdateChatParticipantsPayload): Promise<Chat> => {
    const { data } = await Api.patch<Chat>(`/chats/${chatId}/participants`, payload);
    return data;
  },
};
