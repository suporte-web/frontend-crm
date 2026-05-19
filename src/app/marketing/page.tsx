'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Film,
  ImagePlus,
  LayoutTemplate,
  Megaphone,
  Pencil,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import {
  createPortalContent,
  deletePortalContent,
  getPortalContents,
  uploadPortalContentMedia,
  updatePortalContent,
} from '@/services/portal-content.service';
import type {
  ContentType,
  PortalContent,
  PortalContentPayload,
} from '@/types/portal-content';

type FormState = {
  title: string;
  summary: string;
  body: string;
  type: ContentType;
  campaignName: string;
  ctaLabel: string;
  ctaUrl: string;
  highlight: boolean;
  coverImageUrl: string;
  videoUrl: string;
  isPublished: boolean;
};

const initialFormState: FormState = {
  title: '',
  summary: '',
  body: '',
  type: 'NOTICIA',
  campaignName: '',
  ctaLabel: '',
  ctaUrl: '',
  highlight: false,
  coverImageUrl: '',
  videoUrl: '',
  isPublished: false,
};

const allowedRoles = new Set(['ADMIN', 'GESTAO', 'MARKETING']);

function formatDate(date?: string | null) {
  if (!date) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function getTypeLabel(type: ContentType) {
  const labels: Record<ContentType, string> = {
    NOTICIA: 'Noticia',
    INFORMACAO: 'Campanha',
    VLOG: 'Vídeo',
  };

  return labels[type];
}

function getTypeClass(type: ContentType) {
  const classes: Record<ContentType, string> = {
    NOTICIA: 'bg-[#fab519] text-[#343434]',
    INFORMACAO: 'bg-[#fab519] text-[#343434]',
    VLOG: 'bg-[#fab519] text-[#343434]',
  };

  return classes[type];
}

function getTypeHelper(type: ContentType) {
  const helpers: Record<ContentType, string> = {
    NOTICIA: 'Feed visual com imagem',
    INFORMACAO: 'Campanha comercial',
    VLOG: 'Conteúdo em vídeo para empresa e cliente.',
  };

  return helpers[type];
}

function getTemplate(type: ContentType): Pick<
  FormState,
  'title' | 'summary' | 'body' | 'campaignName' | 'ctaLabel'
> {
  if (type === 'INFORMACAO') {
    return {
      title: 'Campanha da semana',
      summary: 'Destaque uma ação comercial com linguagem direta e CTA claro.',
      body:
        'Apresente a campanha, benefícios, período de vigência e o passo seguinte para o cliente acionar o time.',
      campaignName: 'Campanha comercial',
      ctaLabel: 'Saiba mais',
    };
  }

  if (type === 'VLOG') {
    return {
      title: 'Novo vídeo da operação',
      summary: 'Compartilhe bastidores, atualizações e comunicados em formato visual.',
      body:
        'Use este espaco para contextualizar o vídeo, reforcar a mensagem e orientar o cliente sobre o que assistir.',
      campaignName: 'Conteúdo em vídeo',
      ctaLabel: 'Assistir agora',
    };
  }

  return {
    title: 'Nova noticia do portal',
    summary: 'Comunique uma novidade ',
    body:
      'Escreva um texto curto, escaneavel e com informações centrais para leitura rápida.',
    campaignName: 'Atualização do portal',
    ctaLabel: 'Ver detalhe',
  };
}

export default function MarketingPage() {
  const { user } = useAuth();
  const [contents, setContents] = useState<PortalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [deleteTarget, setDeleteTarget] = useState<PortalContent | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const isAllowed = user?.role ? allowedRoles.has(user.role) : false;

  async function loadContents() {
    try {
      setLoading(true);
      setPageError('');
      const data = await getPortalContents();
      setContents(data);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Erro ao carregar conteúdos.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAllowed) {
      loadContents();
    } else {
      setLoading(false);
    }
  }, [isAllowed]);

  const summary = useMemo(() => {
    return {
      total: contents.length,
      published: contents.filter((item) => item.isPublished).length,
      drafts: contents.filter((item) => !item.isPublished).length,
      highlights: contents.filter((item) => item.highlight).length,
      videos: contents.filter((item) => item.type === 'VLOG').length,
    };
  }, [contents]);

  const highlightedContents = useMemo(
    () => contents.filter((item) => item.highlight),
    [contents],
  );

  const contentPreview = {
    ...form,
    title: form.title || 'Título do conteúdo',
    summary: form.summary || 'Resumo rápido para chamar a atenção no feed.',
    body:
      form.body ||
      'Texto principal do post. Aqui entram a historia, a campanha, o comunicado ou o roteiro da publicação.',
    campaignName: form.campaignName || 'Campanha ativa',
    ctaLabel: form.ctaLabel || 'Abrir conteúdo',
  };

  function resetForm() {
    setForm(initialFormState);
    setEditingId(null);
    setFormError('');
  }

  function handleEdit(item: PortalContent) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      summary: item.summary,
      body: item.body,
      type: item.type,
      campaignName: item.campaignName ?? '',
      ctaLabel: item.ctaLabel ?? '',
      ctaUrl: item.ctaUrl ?? '',
      highlight: item.highlight,
      coverImageUrl: item.coverImageUrl ?? '',
      videoUrl: item.videoUrl ?? '',
      isPublished: item.isPublished,
    });
    setFormError('');
  }

  function validateForm() {
    if (!form.title.trim()) return 'Informe o título.';
    if (!form.summary.trim()) return 'Informe o resumo.';
    if (!form.body.trim()) return 'Informe o conteúdo.';
    if (form.ctaUrl && !form.ctaLabel.trim()) {
      return 'Informe o texto do CTA quando houver link.';
    }
    if (form.type === 'VLOG' && !form.videoUrl.trim()) {
      return 'Para vídeo, informe a URL do vídeo.';
    }
    return '';
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload: PortalContentPayload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      body: form.body.trim(),
      type: form.type,
      campaignName: form.campaignName.trim() || undefined,
      ctaLabel: form.ctaLabel.trim() || undefined,
      ctaUrl: form.ctaUrl.trim() || undefined,
      highlight: form.highlight,
      coverImageUrl: form.coverImageUrl.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      isPublished: form.isPublished,
    };

    try {
      setSaving(true);
      setFormError('');

      if (editingId) {
        const updated = await updatePortalContent(editingId, payload);
        setContents((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setSuccessMessage('Conteúdo atualizado com sucesso.');
      } else {
        const created = await createPortalContent(payload);
        setContents((prev) => [created, ...prev]);
        setSuccessMessage('Conteúdo criado com sucesso.');
      }

      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Erro ao salvar conteúdo.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;

    try {
      await deletePortalContent(deleteTarget.id);
      setContents((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setSuccessMessage('Conteúdo removido com sucesso.');
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Erro ao remover conteúdo.',
      );
    }
  }

  function applyTemplate(type: ContentType) {
    const template = getTemplate(type);

    setForm((prev) => ({
      ...prev,
      type,
      title: prev.title || template.title,
      summary: prev.summary || template.summary,
      body: prev.body || template.body,
      campaignName: prev.campaignName || template.campaignName,
      ctaLabel: prev.ctaLabel || template.ctaLabel,
    }));
  }

  async function handleMediaUpload(
    file: File | undefined,
    mediaType: 'image' | 'video',
  ) {
    if (!file) {
      return;
    }

    try {
      if (mediaType === 'image') {
        setUploadingImage(true);
      } else {
        setUploadingVideo(true);
      }

      setFormError('');
      const uploaded = await uploadPortalContentMedia(file);

      setForm((prev) => ({
        ...prev,
        coverImageUrl:
          mediaType === 'image' ? uploaded.url : prev.coverImageUrl,
        videoUrl: mediaType === 'video' ? uploaded.url : prev.videoUrl,
      }));

      setSuccessMessage(
        mediaType === 'image'
          ? 'Imagem importada com sucesso.'
          : 'Vídeo importado com sucesso.',
      );
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Erro ao enviar arquivo.',
      );
    } finally {
      if (mediaType === 'image') {
        setUploadingImage(false);
      } else {
        setUploadingVideo(false);
      }
    }
  }

  if (!isAllowed) {
    return (
      <AppLayout>
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Esta área e restrita a marketing, gestão e administração.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,#343434_0%,#ec3139_55%,#fab519_100%)] p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] lg:p-8">
          <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                <Megaphone className="h-3.5 w-3.5" />
                Marketing Portal
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
                Publicação e gestão de conteúdos para o portal do cliente
              </h1>
    
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/80">
                  Publicados
                </p>
                <p className="mt-2 text-3xl font-bold">{summary.published}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/80">
                  Rascunhos
                </p>
                <p className="mt-2 text-3xl font-bold">{summary.drafts}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/80">
                  Destaques
                </p>
                <p className="mt-2 text-3xl font-bold">{summary.highlights}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/80">
                  Vídeos
                </p>
                <p className="mt-2 text-3xl font-bold">{summary.videos}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Editor
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {editingId ? 'Editar campanha' : 'Criar conteúdo'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Monte o post com foto, vídeo, CTA e campanha.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Novo conteúdo
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {(['NOTICIA', 'INFORMACAO', 'VLOG'] as ContentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => applyTemplate(type)}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    form.type === type
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    {type === 'NOTICIA' ? (
                      <LayoutTemplate className="h-4 w-4 text-sky-600" />
                    ) : type === 'INFORMACAO' ? (
                      <Rocket className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Film className="h-4 w-4 text-violet-600" />
                    )}
                    {getTypeLabel(type)}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {getTypeHelper(type)}
                  </p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Título
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    placeholder="Ex: Nova campanha de atendimento"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nome da campanha
                  </label>
                  <input
                    type="text"
                    value={form.campaignName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        campaignName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    placeholder="Ex: Maio em movimento"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Resumo
                </label>
                <textarea
                  value={form.summary}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, summary: event.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                  placeholder="Chamada curta que aparece no topo do card."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Conteúdo
                </label>
                <textarea
                  value={form.body}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, body: event.target.value }))
                  }
                  rows={8}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                  placeholder="Texto principal do conteúdo para o portal do cliente."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo
                  </label>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        type: event.target.value as ContentType,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                  >
                    <option value="NOTICIA">Noticia</option>
                    <option value="INFORMACAO">Campanha</option>
                    <option value="VLOG">Vídeo</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={form.isPublished ? 'published' : 'draft'}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isPublished: event.target.value === 'published',
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-4">
                  <label className="block text-sm font-semibold text-slate-700">
                    Importar imagem do computador
                  </label>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Envie uma foto para preencher automaticamente a capa do post.
                  </p>
                  <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                    <ImagePlus className="h-4 w-4" />
                    {uploadingImage ? 'Enviando imagem...' : 'Selecionar imagem'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        handleMediaUpload(
                          event.target.files?.[0],
                          'image',
                        )
                      }
                    />
                  </label>
                  {form.coverImageUrl ? (
                    <p className="mt-3 text-xs text-emerald-600">
                      Imagem pronta para uso no preview.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-4">
                  <label className="block text-sm font-semibold text-slate-700">
                    Importar vídeo do computador
                  </label>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Opcional: envie um vídeo para o conteúdo do portal.
                  </p>
                  <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-100">
                    <Film className="h-4 w-4" />
                    {uploadingVideo ? 'Enviando vídeo...' : 'Selecionar vídeo'}
                    <input
                      type="file"
                      accept="vídeo/*"
                      className="hidden"
                      onChange={(event) =>
                        handleMediaUpload(
                          event.target.files?.[0],
                          'video',
                        )
                      }
                    />
                  </label>
                  {form.videoUrl ? (
                    <p className="mt-3 text-xs text-emerald-600">
                      Vídeo pronto para uso no feed.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    URL da foto/capa
                  </label>
                  <input
                    type="url"
                    value={form.coverImageUrl}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        coverImageUrl: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    placeholder="Cole a URL da imagem ou use o upload acima"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    URL do vídeo
                  </label>
                  <input
                    type="url"
                    value={form.videoUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, videoUrl: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    placeholder="Cole a URL do vídeo ou use o upload acima"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Texto do CTA
                  </label>
                  <input
                    type="text"
                    value={form.ctaLabel}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    placeholder="Ex: Ver campanha"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Link do CTA
                  </label>
                  <input
                    type="url"
                    value={form.ctaUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, ctaUrl: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.highlight}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, highlight: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Marcar como destaque no portal
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Mídia por URL: o projeto atual já publica imagem e vídeo por link
                  sem precisar trocar storage ou backend de upload.
                </div>
              </div>

              {formError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Salvando...'
                    : editingId
                      ? 'Salvar alterações'
                      : 'Publicar conteúdo'}
                </button>
              </div>
            </form>
          </article>

          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Preview
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Como o cliente vai ver
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Preview visual do feed com imagem, vídeo, campanha e CTA.
              </p>
            </div>

            <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-4">
              <div className="mx-auto max-w-md">
                <div className="mb-5 text-center">
                  <h3 className="inline bg-[linear-gradient(180deg,transparent_58%,#fab519_58%)] px-2 text-2xl font-black text-[#343434]">
                    Novidades do Portal
                  </h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#343434]/75">
                    Formato final exibido para o cliente quando o conteúdo for publicado.
                  </p>
                </div>

                <article className="group relative min-h-[380px] overflow-hidden rounded-[22px] bg-[#343434] shadow-[0_20px_45px_rgba(52,52,52,0.18)]">
                  {contentPreview.coverImageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${contentPreview.coverImageUrl})` }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#343434_0%,#ec3139_52%,#fab519_100%)] text-white/80">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-10 w-10" />
                        <p className="mt-3 text-sm font-semibold">Preview de foto/capa</p>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(52,52,52,0.20)_0%,rgba(52,52,52,0.50)_45%,rgba(0,0,0,0.78)_100%)]" />

                  <div className="relative flex min-h-[380px] flex-col justify-end p-6 text-white">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex rounded-full px-4 py-2 text-sm font-extrabold shadow-[0_10px_24px_rgba(0,0,0,0.18)] ${getTypeClass(
                          contentPreview.type,
                        )}`}
                      >
                        {getTypeLabel(contentPreview.type)}
                      </span>

                      <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        {contentPreview.isPublished ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>

                    <h3 className="max-w-[18rem] text-2xl font-black leading-tight drop-shadow md:text-[1.65rem]">
                      {contentPreview.title}
                    </h3>
                    <p className="mt-3 line-clamp-2 max-w-[18rem] text-sm font-semibold leading-6 text-white/88">
                      {contentPreview.summary}
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      {contentPreview.ctaUrl || contentPreview.videoUrl ? (
                        <a
                          href={contentPreview.ctaUrl || contentPreview.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-base font-extrabold text-white transition hover:text-[#fab519]"
                        >
                          Saiba mais
                          <ArrowRight className="h-5 w-5 -rotate-45" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-base font-extrabold text-white">
                          Saiba mais
                          <ArrowRight className="h-5 w-5 -rotate-45" />
                        </span>
                      )}

                      {contentPreview.highlight ? (
                        <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                          Destaque
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <Tabs defaultValue="library" className="gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Biblioteca
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Conteúdos do marketing
                </h2>
              </div>
              <TabsList variant="line" className="w-fit">
                <TabsTrigger value="library">Todos</TabsTrigger>
                <TabsTrigger value="highlights">Destaques</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="library">
              {loading ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Carregando conteúdos...
                </div>
              ) : pageError ? (
                <div className="p-10 text-center text-sm text-rose-600">{pageError}</div>
              ) : contents.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Nenhum conteúdo cadastrado.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {contents.map((item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="relative">
                        {item.coverImageUrl ? (
                          <div
                            className="h-52 bg-cover bg-center"
                            style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                          />
                        ) : (
                          <div className="flex h-52 items-center justify-center bg-[linear-gradient(135deg,#dbeafe_0%,#f8fafc_45%,#e9d5ff_100%)] text-slate-400">
                            <ImagePlus className="h-8 w-8" />
                          </div>
                        )}

                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeClass(
                              item.type,
                            )}`}
                          >
                            {getTypeLabel(item.type)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.isPublished
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            {item.isPublished ? 'Publicado' : 'Rascunho'}
                          </span>
                          {item.highlight ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              Destaque
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {item.campaignName || 'Portal do cliente'}
                        </p>
                        <h3 className="mt-3 text-xl font-bold text-slate-950">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {item.summary}
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                          Atualizado em {formatDate(item.updatedAt)}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {item.videoUrl ? (
                            <a
                              href={item.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                            >
                              <Film className="h-4 w-4" />
                              Vídeo
                            </a>
                          ) : null}
                          {item.ctaUrl && item.ctaLabel ? (
                            <a
                              href={item.ctaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Rocket className="h-4 w-4" />
                              {item.ctaLabel}
                            </a>
                          ) : null}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="highlights">
              {highlightedContents.length === 0 ? (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  Nenhum destaque configurado ainda.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {highlightedContents.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[28px] border border-amber-200 bg-[linear-gradient(180deg,#fffdf5_0%,#ffffff_100%)] p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-amber-700">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                          Destaque do portal
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.summary}
                      </p>
                      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {item.campaignName || 'Campanha em destaque'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir conteúdo"
        description={`Deseja remover "${deleteTarget?.title ?? ''}"?`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        tone="danger"
      />

      <FeedbackToast
        open={!!successMessage}
        title="Marketing atualizado"
        message={successMessage}
        onClose={() => setSuccessMessage('')}
        variant="success"
      />
    </AppLayout>
  );
}
