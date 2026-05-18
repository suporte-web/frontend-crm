"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  FileText,
  MessageCircle,
  Send,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import {
  getChatMessages,
  getChats,
  markChatRead,
  sendChatMessage,
} from "@/services/chatService";
import type {
  ChatListItem,
  ChatMessage,
  ChatMessageVisibility,
} from "@/types/chat";

const entityLabels: Record<string, string> = {
  LEAD: "Lead",
  CLIENTE: "Cliente",
  COTACAO: "Cotação",
  PROPOSTA: "Proposta",
  TICKET: "Ticket",
};

const visibilityLabels: Record<ChatMessageVisibility, string> = {
  PUBLICA_CLIENTE: "Publica para cliente",
  INTERNA: "Interna",
  GESTAO_COMERCIAL: "Gestão e Comercial",
  PRIVADA_USUARIOS: "Privada",
};

function isInternalUser(role?: string) {
  return role === "ADMIN" || role === "GESTAO" || role === "COMERCIAL";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getChatTitle(chat: ChatListItem) {
  if (chat.title) return chat.title;
  if (chat.proposta) return `${chat.proposta.code} - ${chat.proposta.titulo}`;
  if (chat.ticket) return chat.ticket.subject;
  if (chat.quote) return `${chat.quote.code} - ${chat.quote.serviceType}`;
  if (chat.client) return chat.client.companyName || chat.client.user?.name;
  if (chat.lead) return chat.lead.company || chat.lead.name;

  return "Conversa";
}

function getChatSubtitle(chat: ChatListItem) {
  const parts = [entityLabels[chat.entityType] ?? chat.entityType];

  if (chat.client?.companyName || chat.client?.user?.name) {
    parts.push(chat.client.companyName || chat.client.user?.name || "");
  }

  if (chat.quote?.code) {
    parts.push(chat.quote.code);
  }

  if (chat.proposta?.code) {
    parts.push(chat.proposta.code);
  }

  return parts.filter(Boolean).join(" • ");
}

function getEntityIcon(chat: ChatListItem) {
  if (chat.entityType === "CLIENTE") return Building2;
  if (chat.entityType === "COTACAO" || chat.entityType === "PROPOSTA") {
    return FileText;
  }
  if (chat.entityType === "TICKET") return Ticket;
  return UserRound;
}

export default function ChatPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] =
    useState<ChatMessageVisibility>("PUBLICA_CLIENTE");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  );
  const canUseInternalVisibility = isInternalUser(user?.role);

  async function loadChats() {
    if (authLoading) return;

    if (!token) {
      setLoadingChats(false);
      setError("Sessao expirada. Faca login novamente.");
      return;
    }

    try {
      setLoadingChats(true);
      setError(null);
      const data = await getChats(token);
      setChats(data);
      setSelectedChatId((current) => current || data[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar chats.");
    } finally {
      setLoadingChats(false);
    }
  }

  async function loadMessages(chatId: string) {
    if (!token || !chatId) {
      setMessages([]);
      return;
    }

    try {
      setLoadingMessages(true);
      setError(null);
      const chatMessages = await getChatMessages(chatId, token);

      setMessages(chatMessages);
      await markChatRead(chatId, token).catch(() => undefined);
      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                unreadCount: 0,
                lastReadAt: new Date().toISOString(),
              }
            : chat,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar mensagens.",
      );
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSend() {
    if (!token || !selectedChat || !content.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const message = await sendChatMessage(
        selectedChat.id,
        {
          content: content.trim(),
          visibility: canUseInternalVisibility ? visibility : "PUBLICA_CLIENTE",
        },
        token,
      );

      setMessages((current) => [...current, message]);
      setContent("");
      setChats((current) =>
        current.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                updatedAt: message.createdAt,
                messages: [message],
                unreadCount: 0,
                lastReadAt: message.createdAt,
              }
            : chat,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  useEffect(() => {
    if (!token || authLoading) return;

    const interval = window.setInterval(() => {
      loadChats().catch(() => undefined);
    }, 30000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  useEffect(() => {
    loadMessages(selectedChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId, token]);

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-112px)] flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Central de conversas
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Chat</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Conversas vinculadas a leads, clientes, cotações, propostas e
              tickets, com visibilidade controlada pelo backend.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Seguro por perfil
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-950">Conversas</p>
              <p className="mt-1 text-xs text-slate-500">
                {chats.length} chat(s) disponível(is)
              </p>
            </div>

            <div className="max-h-[calc(100vh-240px)] overflow-y-auto p-2">
              {loadingChats ? (
                <p className="p-4 text-sm text-slate-500">
                  Carregando conversas...
                </p>
              ) : chats.length === 0 ? (
                <div className="m-2 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                  Nenhuma conversa disponível para seu usuário.
                </div>
              ) : (
                chats.map((chat) => {
                  const Icon = getEntityIcon(chat);
                  const lastMessage = chat.messages?.[0];
                  const isSelected = chat.id === selectedChatId;
                  const unreadCount = chat.unreadCount ?? 0;

                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`mb-2 flex w-full gap-3 rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? "border-blue-200 bg-blue-50"
                          : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          isSelected
                            ? "bg-blue-700 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="block truncate text-sm font-semibold text-slate-950">
                            {getChatTitle(chat)}
                          </span>
                          {unreadCount > 0 ? (
                            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {getChatSubtitle(chat)}
                        </span>
                        <span className="mt-2 block truncate text-xs text-slate-600">
                          {lastMessage
                            ? lastMessage.content
                            : "Sem mensagens visiveis."}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {selectedChat ? (
              <>
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {getChatSubtitle(selectedChat)}
                      </p>
                      <h2 className="mt-1 truncate text-xl font-bold text-slate-950">
                        {getChatTitle(selectedChat)}
                      </h2>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {selectedChat.participants?.length ?? 0} participante(s)
                    </span>
                  </div>
                </div>

                <div className="min-h-[420px] flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                  {loadingMessages ? (
                    <p className="text-sm text-slate-500">
                      Carregando mensagens...
                    </p>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                      Nenhuma mensagem visível neste chat.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = message.authorId === user?.id;

                      return (
                        <article
                          key={message.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-3xl rounded-2xl border px-4 py-3 shadow-sm ${
                              mine
                                ? "border-blue-200 bg-blue-700 text-white"
                                : "border-slate-200 bg-white text-slate-800"
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">
                                {message.author?.name || "Usuário"}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  mine
                                    ? "bg-white/15 text-blue-50"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {visibilityLabels[message.visibility]}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.content}
                            </p>
                            <p
                              className={`mt-2 text-xs ${
                                mine ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {formatDate(message.createdAt)}
                            </p>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>

                <footer className="border-t border-slate-200 p-4">
                  {canUseInternalVisibility ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {(
                        [
                          "PUBLICA_CLIENTE",
                          "INTERNA",
                          "GESTAO_COMERCIAL",
                        ] as ChatMessageVisibility[]
                      ).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setVisibility(option)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                            visibility === option
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {visibilityLabels[option]}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex gap-3">
                    <textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="min-h-20 flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={saving || !content.trim()}
                      className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Enviar mensagem"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-950">
                  Selecione uma conversa
                </h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  As mensagens exibidas aqui já chegam filtradas pela API de
                  acordo com seu perfil e sua participacao no chat.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
