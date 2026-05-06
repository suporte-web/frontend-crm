'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import {
  createChat,
  getChatMessages,
  sendChatMessage,
} from '@/services/chatService';

import type {
  Chat,
  ChatEntityType,
  ChatMessage,
  ChatMessageVisibility,
} from '@/types/chat';

type ChatBoxProps = {
  entityType: ChatEntityType;
  entityId: string;
  title?: string;
};

const visibilityLabels: Record<ChatMessageVisibility, string> = {
  PUBLICA_CLIENTE: 'Pública para cliente',
  INTERNA: 'Interna',
  GESTAO_COMERCIAL: 'Gestão/Comercial',
  PRIVADA_USUARIOS: 'Privada',
};

function isInternalUser(role?: string) {
  return role === 'ADMIN' || role === 'GESTAO' || role === 'COMERCIAL';
}

function formatDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function ChatBox({ entityType, entityId, title }: ChatBoxProps) {
  const { user, token, loading: authLoading } = useAuth();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] =
    useState<ChatMessageVisibility>('PUBLICA_CLIENTE');

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSelectInternalVisibility = useMemo(() => {
    return isInternalUser(user?.role);
  }, [user?.role]);

  async function loadChatAndMessages() {
    if (authLoading) {
      return;
    }

    if (!token) {
      setIsLoading(false);
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!entityId) {
      setIsLoading(false);
      setError('Entidade do chat não informada.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const createdOrExistingChat = await createChat(
        {
          entityType,
          entityId,
          title,
        },
        token,
      );

      setChat(createdOrExistingChat);

      const chatMessages = await getChatMessages(
        createdOrExistingChat.id,
        token,
      );

      setMessages(chatMessages);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao carregar o chat.';

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!chat || !token) {
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setError('Digite uma mensagem antes de enviar.');
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      const message = await sendChatMessage(
        chat.id,
        {
          content: trimmedContent,
          visibility: canSelectInternalVisibility
            ? visibility
            : 'PUBLICA_CLIENTE',
        },
        token,
      );

      setMessages((currentMessages) => [...currentMessages, message]);
      setContent('');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao enviar mensagem.';

      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    loadChatAndMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, token, authLoading]);

  if (authLoading || isLoading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Carregando chat...</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <header className="border-b border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900">
          Conversa
        </h2>

        {title ? (
          <p className="mt-1 text-sm text-gray-500">{title}</p>
        ) : null}
      </header>

      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma mensagem registrada ainda.
          </p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {message.author?.name || 'Usuário'}
                  </p>

                  <p className="text-xs text-gray-500">
                    {formatDate(message.createdAt)}
                    {message.editedAt ? ' · editada' : ''}
                  </p>
                </div>

                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
                  {visibilityLabels[message.visibility]}
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm text-gray-800">
                {message.content}
              </p>
            </article>
          ))
        )}
      </div>

      <footer className="border-t border-gray-200 p-4">
        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {canSelectInternalVisibility ? (
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Visibilidade da mensagem
            </label>

            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as ChatMessageVisibility)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              disabled={isSending}
            >
              <option value="PUBLICA_CLIENTE">
                Pública para cliente
              </option>
              <option value="INTERNA">Interna</option>
              <option value="GESTAO_COMERCIAL">
                Gestão/Comercial
              </option>
            </select>
          </div>
        ) : null}

        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Digite sua mensagem..."
            className="min-h-20 flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm"
            disabled={isSending}
          />

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isSending || !content.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </footer>
    </section>
  );
}