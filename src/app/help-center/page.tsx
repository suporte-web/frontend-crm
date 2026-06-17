'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import {
  Bot,
  CheckCircle2,
  CircleHelp,
  Loader2,
  MessageCircleQuestion,
  Pencil,
  Plus,
  Send,
  XCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { useAuth } from '@/context/auth-context';
import {
  askHelpCenter,
  createHelpArticle,
  getHelpArticles,
  updateHelpArticle,
  updateHelpArticleStatus,
} from '@/services/help-center.service';
import type { HelpArticle, HelpArticlePayload } from '@/types/help-center';

type FormState = {
  title: string;
  questions: string;
  answer: string;
  category: string;
  tags: string;
  active: boolean;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const emptyForm: FormState = {
  title: '',
  questions: '',
  answer: '',
  category: '',
  tags: '',
  active: true,
};

const canManageRoles = new Set(['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING']);
const maxChatLength = 1000;
const quickQuestions = [
  'Como fazer uma cotação?',
  'Como rastrear uma encomenda?',
  'Como falar com suporte?',
];

function splitList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function articleToForm(article: HelpArticle): FormState {
  return {
    title: article.title,
    questions: article.questions.join('\n'),
    answer: article.answer,
    category: article.category,
    tags: article.tags.join(', '),
    active: article.active,
  };
}

function toPayload(form: FormState): HelpArticlePayload {
  return {
    title: form.title.trim(),
    questions: splitList(form.questions),
    answer: form.answer.trim(),
    category: form.category.trim(),
    tags: splitList(form.tags),
    active: form.active,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HelpCenterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [savingArticle, setSavingArticle] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatError, setChatError] = useState('');

  const canManage = user?.role ? canManageRoles.has(user.role) : false;
  const isClient = user?.role === 'CLIENTE';
  const firstName = user?.name?.split(' ')[0] || 'cliente';
  const greeting = `${getGreeting()}, ${firstName}. Como posso te ajudar?`;
  const activeCount = useMemo(
    () => articles.filter((article) => article.active).length,
    [articles],
  );

  async function loadArticles() {
    if (!canManage) return;

    try {
      setLoadingArticles(true);
      setPageError('');
      setArticles(await getHelpArticles());
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Erro ao carregar artigos.',
      );
    } finally {
      setLoadingArticles(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, [canManage]);

  useEffect(() => {
    if (user?.role === 'CLIENTE') {
      router.replace('/dashboard');
    }
  }, [router, user?.role]);

  function validateForm(payload: HelpArticlePayload) {
    if (!payload.title) return 'Informe o titulo.';
    if (!payload.questions.length) return 'Informe ao menos uma pergunta.';
    if (!payload.answer) return 'Informe a resposta.';
    if (!payload.category) return 'Informe a categoria.';
    if (!payload.tags.length) return 'Informe ao menos uma tag.';
    return '';
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = toPayload(form);
    const validationError = validateForm(payload);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSavingArticle(true);
      setFormError('');

      if (editingId) {
        const updated = await updateHelpArticle(editingId, payload);
        setArticles((current) =>
          current.map((article) =>
            article.id === updated.id ? updated : article,
          ),
        );
        setToast({
          title: 'Central de Ajuda',
          message: 'Artigo atualizado com sucesso.',
          variant: 'success',
        });
      } else {
        const created = await createHelpArticle(payload);
        setArticles((current) => [created, ...current]);
        setToast({
          title: 'Central de Ajuda',
          message: 'Artigo criado com sucesso.',
          variant: 'success',
        });
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Erro ao salvar artigo.',
      );
    } finally {
      setSavingArticle(false);
    }
  }

  async function toggleStatus(article: HelpArticle) {
    try {
      const updated = await updateHelpArticleStatus(article.id, !article.active);
      setArticles((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setToast({
        title: 'Central de Ajuda',
        message: updated.active ? 'Artigo ativado.' : 'Artigo desativado.',
        variant: 'success',
      });
    } catch (error) {
      setToast({
        title: 'Erro ao atualizar status',
        message:
          error instanceof Error ? error.message : 'Nao foi possivel atualizar.',
        variant: 'error',
      });
    }
  }

  function startEdit(article: HelpArticle) {
    setEditingId(article.id);
    setForm(articleToForm(article));
    setFormError('');
  }

  async function handleChatSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = message.trim();

    if (!trimmed) {
      setChatError('Mensagem obrigatoria.');
      return;
    }

    if (trimmed.length > maxChatLength) {
      setChatError('Mensagem deve ter no maximo 1000 caracteres.');
      return;
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: trimmed,
    };

    try {
      setSendingMessage(true);
      setChatError('');
      setChatMessages((current) => [...current, userMessage]);
      setMessage('');

      const response = await askHelpCenter(trimmed);

      setChatMessages((current) => [
        ...current,
        {
          id: uuidv4(),
          role: 'assistant',
          content: response.answer,
        },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : 'Erro ao consultar ajuda.',
      );
    } finally {
      setSendingMessage(false);
    }
  }

  function useQuickQuestion(question: string) {
    setMessage(question);
    setChatError('');
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section
          className={`overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${
            isClient
              ? 'bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#e0f2fe_100%)]'
              : ''
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Central de Ajuda
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                {isClient ? greeting : 'Chat de atendimento'}
              </h1>
              {isClient ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Sou sua assistente virtual da Central de Ajuda. Posso orientar
                  sobre cotações, rastreamento e suporte usando as informacoes
                  cadastradas pela equipe.
                </p>
              ) : null}
            </div>

            {canManage ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500">Artigos</p>
                  <p className="text-2xl font-bold text-slate-950">
                    {articles.length}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-emerald-700">Ativos</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {activeCount}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section
          className={`grid gap-6 ${
            canManage ? 'xl:grid-cols-[1fr_.9fr]' : 'xl:grid-cols-[.75fr_1.25fr]'
          }`}
        >
          {canManage ? (
            <div className="space-y-6">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      {editingId ? 'Editar artigo' : 'Agente de respostas'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Cadastre respostas que o chat pode usar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                      setFormError('');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Plus className="h-4 w-4" />
                    Novo
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Titulo
                      </span>
                      <input
                        value={form.title}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        className="crm-input"
                        maxLength={160}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Categoria
                      </span>
                      <input
                        value={form.category}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            category: event.target.value,
                          }))
                        }
                        className="crm-input"
                        maxLength={120}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Perguntas
                    </span>
                    <textarea
                      value={form.questions}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          questions: event.target.value,
                        }))
                      }
                      className="crm-textarea"
                      rows={4}
                      placeholder="Uma pergunta por linha"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Resposta
                    </span>
                    <textarea
                      value={form.answer}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          answer: event.target.value,
                        }))
                      }
                      className="crm-textarea"
                      rows={6}
                      maxLength={4000}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Tags
                      </span>
                      <input
                        value={form.tags}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            tags: event.target.value,
                          }))
                        }
                        className="crm-input"
                        placeholder="cotacao, rastreio, suporte"
                      />
                    </label>

                    <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            active: event.target.checked,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      Ativo
                    </label>
                  </div>

                  {formError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {formError}
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingArticle}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                    >
                      {savingArticle ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {editingId ? 'Salvar alteracoes' : 'Cadastrar artigo'}
                    </button>
                  </div>
                </form>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">
                  Perguntas e respostas cadastradas.
                </h2>

                {loadingArticles ? (
                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando artigos...
                  </div>
                ) : pageError ? (
                  <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {pageError}
                  </div>
                ) : articles.length === 0 ? (
                  <p className="mt-5 text-sm text-slate-500">
                    Nenhum artigo cadastrado.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {articles.map((article) => (
                      <div
                        key={article.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-950">
                                {article.title}
                              </h3>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  article.active
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-zinc-200 text-zinc-700'
                                }`}
                              >
                                {article.active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {article.category} | {article.questions.length}{' '}
                              perguntas | Atualizado em{' '}
                              {formatDate(article.updatedAt)}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {article.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(article)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStatus(article)}
                              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                                article.active
                                  ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {article.active ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              {article.active ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>
          ) : null}

          {isClient ? (
            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#0f172a_0%,#1d4ed8_58%,#38bdf8_100%)] p-6 text-white">
                <div className="absolute right-4 top-4 h-24 w-24 rounded-full border border-white/15" />
                <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10" />

                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-lg">
                    <Bot className="h-10 w-10" />
                  </div>

                  <h2 className="mt-6 text-2xl font-bold leading-tight">
                    {greeting}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/82">
                    Me envie uma pergunta curta. Se a resposta estiver na
                    Central de Ajuda, eu te mostro aqui.
                  </p>

                  <div className="mt-6 space-y-2">
                    {quickQuestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => useQuickQuestion(question)}
                        className="flex w-full items-center gap-3 rounded-xl bg-white/12 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/20"
                      >
                        <MessageCircleQuestion className="h-4 w-4 shrink-0" />
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          ) : null}

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {isClient ? 'Sua assistente virtual' : 'Chat da Central'}
                </h2>
                <p className="text-sm text-slate-500">
                  Respostas baseadas nos artigos ativos.
                </p>
              </div>
            </div>

            <div className="mt-5 flex min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chatMessages.length === 0 ? (
                  <div className="flex h-full min-h-[260px] items-center justify-center text-center text-sm text-slate-500">
                    <div>
                      {isClient ? (
                        <Bot className="mx-auto mb-3 h-10 w-10 text-blue-600" />
                      ) : (
                        <CircleHelp className="mx-auto mb-3 h-9 w-9 text-slate-400" />
                      )}
                      <p>{isClient ? greeting : 'Pergunte sobre cotacao, rastreio ou suporte.'}</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((item) => (
                    <div
                      key={item.id}
                      className={`flex ${
                        item.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          item.role === 'user'
                            ? 'bg-blue-700 text-white'
                            : 'bg-white text-slate-700 ring-1 ring-slate-200'
                        }`}
                      >
                        {item.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleChatSubmit}
                className="border-t border-slate-200 bg-white p-4"
              >
                {chatError ? (
                  <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {chatError}
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="crm-textarea min-h-[48px] flex-1 resize-none"
                    maxLength={maxChatLength}
                    rows={2}
                    placeholder="Digite sua dúvida"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
                    aria-label="Enviar mensagem"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-right text-xs text-slate-400">
                  {message.length}/{maxChatLength}
                </p>
              </form>
            </div>
          </article>
        </section>
      </div>

      <FeedbackToast
        open={!!toast}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'success'}
        onClose={() => setToast(null)}
      />
    </AppLayout>
  );
}
