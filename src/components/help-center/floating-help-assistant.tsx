'use client';

import { useMemo, useState } from 'react';
import {
  Bot,
  Loader2,
  MessageCircleQuestion,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { askHelpCenter } from '@/services/help-center.service';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

const maxMessageLength = 1000;

// Inserir o número do Whatsapp do comercial.

const supportWhatsAppUrl = 'https://wa.me/5541988320557';
const welcomeMessage =
  'Ola! Sou sua assistente virtual. Posso ajudar com cotacoes, rastreamento e suporte usando a Central de Ajuda.';
const quickQuestions = [
  { label: 'Como fazer uma cotação?' },
  { label: 'Como rastrear minha encomenda?' },
  {
    label: 'Como falar com suporte?',
    href: supportWhatsAppUrl,
  },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function FloatingHelpAssistant() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const firstName = user?.name?.split(' ')[0] || 'cliente';
  const greeting = useMemo(
    () => `${getGreeting()}, ${firstName}. Como posso te ajudar?`,
    [firstName],
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage,
    },
  ]);

  if (user?.role !== 'CLIENTE') {
    return null;
  }

  function fillQuestion(question: string) {
    setMessage(question);
    setError('');
    setOpen(true);
  }

  function backToQuestionMenu() {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: welcomeMessage,
      },
    ]);
    setMessage('');
    setError('');
  }

  async function sendMessage(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmed = message.trim();

    if (!trimmed) {
      setError('Digite uma mensagem para continuar.');
      return;
    }

    if (trimmed.length > maxMessageLength) {
      setError('Mensagem deve ter no maximo 1000 caracteres.');
      return;
    }

    try {
      setSending(true);
      setError('');
      setMessage('');
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: trimmed,
        },
      ]);

      const response = await askHelpCenter(trimmed);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.answer,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nao foi possivel consultar a Central de Ajuda.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <section className="w-[min(calc(100vw-2rem),390px)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
          <header className="flex items-center justify-between bg-[#343434] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#fab519] bg-[#ec3139] shadow-[0_10px_24px_rgba(236,49,57,0.35)]">
                <Bot className="h-6 w-6 text-white" />
              </span>
              <div>
                <h2 className="text-sm font-bold leading-tight">
                  Assistente Virtual
                </h2>
                <p className="text-xs font-medium text-white/78">
                  {greeting}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10"
              aria-label="Fechar assistente"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="max-h-[58vh] min-h-[340px] overflow-y-auto bg-[#f6f2e9] bg-[radial-gradient(circle_at_20%_20%,rgba(250,181,25,0.18)_0,rgba(250,181,25,0)_22%),radial-gradient(circle_at_80%_0%,rgba(236,49,57,0.12)_0,rgba(236,49,57,0)_24%)] p-4">
            <div className="space-y-3">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-end gap-2 ${
                    item.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {item.role === 'assistant' ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ec3139] text-white ring-2 ring-[#fab519]">
                      <Bot className="h-4 w-4" />
                    </span>
                  ) : null}

                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      item.role === 'user'
                        ? 'rounded-br-md bg-[#fab519] font-semibold text-[#343434]'
                        : 'rounded-bl-md bg-white text-[#343434]'
                    }`}
                  >
                    {item.content}
                  </div>
                </div>
              ))}

              <div className="grid gap-2 pt-2">
                {messages.length > 1 ? (
                  <button
                    type="button"
                    onClick={backToQuestionMenu}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#ec3139]/20 bg-white px-3 py-2 text-xs font-bold text-[#ec3139] shadow-sm transition hover:bg-[#fff7db]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Voltar ao menu de duvidas
                  </button>
                ) : null}

                {messages.length === 1
                  ? quickQuestions.map((question) =>
                      question.href ? (
                        <a
                          key={question.label}
                          href={question.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold text-[#343434] shadow-sm transition hover:bg-[#fff7db]"
                        >
                          <MessageCircleQuestion className="h-4 w-4 shrink-0 text-[#ec3139]" />
                          {question.label}
                        </a>
                      ) : (
                        <button
                          key={question.label}
                          type="button"
                          onClick={() => fillQuestion(question.label)}
                          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold text-[#343434] shadow-sm transition hover:bg-[#fff7db]"
                        >
                          <MessageCircleQuestion className="h-4 w-4 shrink-0 text-[#ec3139]" />
                          {question.label}
                        </button>
                      ),
                    )
                  : null}
              </div>
            </div>
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-slate-200 bg-white p-3"
          >
            {error ? (
              <div className="mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex items-end gap-2">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-11 flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#ec3139] focus:bg-white"
                maxLength={maxMessageLength}
                rows={2}
                placeholder="Digite sua duvida aqui..."
              />
              <button
                type="submit"
                disabled={sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ec3139] text-white shadow-[0_10px_22px_rgba(236,49,57,0.28)] transition hover:bg-[#d82931] disabled:opacity-60"
                aria-label="Enviar mensagem"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#343434] bg-[#ec3139] text-white shadow-[0_18px_40px_rgba(52,52,52,0.28)] transition hover:-translate-y-0.5 hover:bg-[#d82931]"
        aria-label="Abrir assistente virtual"
      >
        <span className="absolute inset-1 rounded-full border-2 border-[#fab519]" />
        <Bot className="relative h-8 w-8 transition group-hover:scale-105" />
      </button>
    </div>
  );
}
