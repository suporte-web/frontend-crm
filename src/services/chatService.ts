import { apiFetch } from "./api";

import type {
  Chat,
  ChatListItem,
  ChatMessage,
  CreateChatPayload,
  SendChatMessagePayload,
  UpdateChatMessagePayload,
  UpdateChatParticipantsPayload,
} from "@/types/chat";

export async function getChats(token: string): Promise<ChatListItem[]> {
  return apiFetch<ChatListItem[]>(
    "/chats",
    {
      method: "GET",
    },
    token,
  );
}

export async function createChat(
  payload: CreateChatPayload,
  token: string,
): Promise<Chat> {
  return apiFetch<Chat>(
    "/chats",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getChatMessages(
  chatId: string,
  token: string,
): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(
    `/chats/${chatId}/messages`,
    {
      method: "GET",
    },
    token,
  );
}

export async function markChatRead(
  chatId: string,
  token: string,
): Promise<{ chatId: string; lastReadAt: string }> {
  return apiFetch<{ chatId: string; lastReadAt: string }>(
    `/chats/${chatId}/read`,
    {
      method: "PATCH",
      body: JSON.stringify({}),
    },
    token,
  );
}

export async function sendChatMessage(
  chatId: string,
  payload: SendChatMessagePayload,
  token: string,
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(
    `/chats/${chatId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateChatMessage(
  chatId: string,
  messageId: string,
  payload: UpdateChatMessagePayload,
  token: string,
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(
    `/chats/${chatId}/messages/${messageId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteChatMessage(
  chatId: string,
  messageId: string,
  token: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/chats/${chatId}/messages/${messageId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export async function updateChatParticipants(
  chatId: string,
  payload: UpdateChatParticipantsPayload,
  token: string,
): Promise<Chat> {
  return apiFetch<Chat>(
    `/chats/${chatId}/participants`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}
