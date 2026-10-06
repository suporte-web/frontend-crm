'use client';

import { hasAnyRole } from "@/lib/user-roles";
import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

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
import {
  CrmKpiCard,
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';
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

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: '#fff',
  },
};

function formatDate(date?: string | null) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function getTypeLabel(type: ContentType) {
  const labels: Record<ContentType, string> = {
    NOTICIA: 'Notícia',
    INFORMACAO: 'Campanha',
    VLOG: 'Vídeo',
  };

  return labels[type];
}

function getTypeHelper(type: ContentType) {
  const helpers: Record<ContentType, string> = {
    NOTICIA: 'Feed visual com imagem',
    INFORMACAO: 'Campanha comercial',
    VLOG: 'Conteúdo em vídeo para empresa e cliente.',
  };

  return helpers[type];
}

function getTypeChipSx(type: ContentType) {
  const colors: Record<ContentType, object> = {
    NOTICIA: {
      bgcolor: '#fff7d6',
      color: '#8a5a00',
      borderColor: '#f6d36b',
    },
    INFORMACAO: {
      bgcolor: '#e8f2ff',
      color: '#175a9e',
      borderColor: '#a9cff5',
    },
    VLOG: {
      bgcolor: '#f1e8ff',
      color: '#6d28a8',
      borderColor: '#d7b8ff',
    },
  };

  return colors[type];
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
      summary:
        'Compartilhe bastidores, atualizações e comunicados em formato visual.',
      body:
        'Use este espaço para contextualizar o vídeo, reforçar a mensagem e orientar o cliente sobre o que assistir.',
      campaignName: 'Conteúdo em vídeo',
      ctaLabel: 'Assistir agora',
    };
  }

  return {
    title: 'Nova notícia do portal',
    summary: 'Comunique uma novidade do portal.',
    body:
      'Escreva um texto curto, escaneável e com informações centrais para leitura rápida.',
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
  const [tab, setTab] = useState('editor');

  const isAllowed = user?.role ? hasAnyRole(user, [...allowedRoles]) : false;

  async function loadData() {
    try {
      setLoading(true);
      setPageError('');

      const contentData = await getPortalContents();

      setContents(contentData);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Erro ao carregar marketing.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAllowed) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAllowed]);

  const summary = useMemo(() => {
    return {
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
      'Texto principal do post. Aqui entram a história, a campanha, o comunicado ou o roteiro da publicação.',
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
    setTab('editor');
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
      setTab('library');
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
        <Alert severity="warning">
          Esta área é restrita a marketing, gestão e administração.
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Marketing"
          title="Criação de conteúdo"
          description="Gerencie conteúdos, campanhas, vídeos e destaques do portal."
          icon={<Megaphone size={24} />}
          aside={
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => {
                resetForm();
                setTab('editor');
              }}
              sx={{
                borderRadius: '10px',
                bgcolor: crmPalette.orange,
                '&:hover': {
                  bgcolor: crmPalette.orangeDark,
                },
              }}
            >
              Novo conteúdo
            </Button>
          }
        />

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          <CrmKpiCard
            title="Publicados"
            value={summary.published}
            icon={<Megaphone size={22} />}
            accent="#1f8f46"
            softColor="#ecfdf5"
            sx={{ minHeight: 130 }}
          />
          <CrmKpiCard
            title="Rascunhos"
            value={summary.drafts}
            icon={<LayoutTemplate size={22} />}
            accent="#64748b"
            softColor="#f8fafc"
            sx={{ minHeight: 130 }}
          />
          <CrmKpiCard
            title="Destaques"
            value={summary.highlights}
            icon={<Sparkles size={22} />}
            accent={crmPalette.yellow}
            softColor="#fff7d6"
            sx={{ minHeight: 130 }}
          />
          <CrmKpiCard
            title="Vídeos"
            value={summary.videos}
            icon={<Film size={22} />}
            accent="#7c3aed"
            softColor="#f3e8ff"
            sx={{ minHeight: 130 }}
          />
        </Box>

        {pageError ? <Alert severity="error">{pageError}</Alert> : null}

        <CrmSection>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{
              px: 3,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Tab value="editor" label="Editor" />
            <Tab value="library" label="Biblioteca" />
            <Tab value="highlights" label="Destaques" />
          </Tabs>

          {loading ? (
            <Box sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : null}

          {!loading && tab === 'editor' ? (
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                p: { xs: 2, md: 3 },
                gridTemplateColumns: {
                  xs: '1fr',
                  xl: '1.1fr .9fr',
                },
              }}
            >
              <Paper
                elevation={0}
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '14px',
                }}
              >
                <Stack spacing={3}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                      alignItems: { xs: 'stretch', sm: 'center' },
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color: crmPalette.orangeDark,
                          fontSize: 12,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '.16em',
                        }}
                      >
                        Editor
                      </Typography>
                      <Typography
                        component="h2"
                        sx={{ mt: 0.5, fontSize: 24, fontWeight: 900 }}
                      >
                        {editingId ? 'Editar campanha' : 'Criar conteúdo'}
                      </Typography>
                    </Box>

                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<Plus size={18} />}
                      onClick={resetForm}
                      sx={{ borderRadius: '10px' }}
                    >
                      Novo conteúdo
                    </Button>
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(3, minmax(0, 1fr))',
                      },
                    }}
                  >
                    {(['NOTICIA', 'INFORMACAO', 'VLOG'] as ContentType[]).map(
                      (type) => (
                        <Paper
                          key={type}
                          elevation={0}
                          component="button"
                          type="button"
                          onClick={() => applyTemplate(type)}
                          sx={{
                            p: 2,
                            textAlign: 'left',
                            border: '1px solid',
                            borderColor:
                              form.type === type
                                ? crmPalette.orange
                                : 'divider',
                            borderRadius: '12px',
                            bgcolor:
                              form.type === type ? '#fff7ed' : '#f8fafc',
                            cursor: 'pointer',
                          }}
                        >
                          <Stack direction="row" spacing={1.25}>
                            {type === 'NOTICIA' ? (
                              <LayoutTemplate size={18} />
                            ) : type === 'INFORMACAO' ? (
                              <Rocket size={18} />
                            ) : (
                              <Film size={18} />
                            )}
                            <Box>
                              <Typography sx={{ fontWeight: 800 }}>
                                {getTypeLabel(type)}
                              </Typography>
                              <Typography
                                sx={{
                                  mt: 0.5,
                                  color: 'text.secondary',
                                  fontSize: 13,
                                }}
                              >
                                {getTypeHelper(type)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      ),
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    }}
                  >
                    <TextField
                      label="Título"
                      value={form.title}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Ex: Nova campanha de atendimento"
                      sx={fieldSx}
                    />
                    <TextField
                      label="Nome da campanha"
                      value={form.campaignName}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          campaignName: event.target.value,
                        }))
                      }
                      placeholder="Ex: Maio em movimento"
                      sx={fieldSx}
                    />
                  </Box>

                  <TextField
                    label="Resumo"
                    value={form.summary}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        summary: event.target.value,
                      }))
                    }
                    multiline
                    minRows={3}
                    sx={fieldSx}
                  />

                  <TextField
                    label="Conteúdo"
                    value={form.body}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, body: event.target.value }))
                    }
                    multiline
                    minRows={7}
                    sx={fieldSx}
                  />

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    }}
                  >
                    <FormControl sx={fieldSx}>
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        label="Tipo"
                        value={form.type}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            type: event.target.value as ContentType,
                          }))
                        }
                      >
                        <MenuItem value="NOTICIA">Notícia</MenuItem>
                        <MenuItem value="INFORMACAO">Campanha</MenuItem>
                        <MenuItem value="VLOG">Vídeo</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl sx={fieldSx}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        value={form.isPublished ? 'published' : 'draft'}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            isPublished: event.target.value === 'published',
                          }))
                        }
                      >
                        <MenuItem value="draft">Rascunho</MenuItem>
                        <MenuItem value="published">Publicado</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    }}
                  >
                    <UploadPanel
                      title="Importar imagem do computador"
                      description="A capa será preenchida automaticamente."
                      loading={uploadingImage}
                      ready={Boolean(form.coverImageUrl)}
                      accept="image/*"
                      buttonLabel="Selecionar imagem"
                      loadingLabel="Enviando imagem..."
                      icon={<ImagePlus size={18} />}
                      onChange={(file) => handleMediaUpload(file, 'image')}
                    />

                    <UploadPanel
                      title="Importar vídeo do computador"
                      description="Opcional para conteúdos em vídeo."
                      loading={uploadingVideo}
                      ready={Boolean(form.videoUrl)}
                      accept="video/*"
                      buttonLabel="Selecionar vídeo"
                      loadingLabel="Enviando vídeo..."
                      icon={<Film size={18} />}
                      variant="outlined"
                      onChange={(file) => handleMediaUpload(file, 'video')}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    }}
                  >
                    <TextField
                      label="URL da foto/capa"
                      type="url"
                      value={form.coverImageUrl}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          coverImageUrl: event.target.value,
                        }))
                      }
                      sx={fieldSx}
                    />
                    <TextField
                      label="URL do vídeo"
                      type="url"
                      value={form.videoUrl}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          videoUrl: event.target.value,
                        }))
                      }
                      sx={fieldSx}
                    />
                    <TextField
                      label="Texto do CTA"
                      value={form.ctaLabel}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          ctaLabel: event.target.value,
                        }))
                      }
                      sx={fieldSx}
                    />
                    <TextField
                      label="Link do CTA"
                      type="url"
                      value={form.ctaUrl}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          ctaUrl: event.target.value,
                        }))
                      }
                      sx={fieldSx}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.highlight}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            highlight: event.target.checked,
                          }))
                        }
                      />
                    }
                    label="Marcar como destaque no portal"
                  />

                  {formError ? <Alert severity="error">{formError}</Alert> : null}

                  <Stack
                    direction={{ xs: 'column-reverse', sm: 'row' }}
                    spacing={1.5}
                    sx={{ justifyContent: 'flex-end' }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={resetForm}
                      sx={{ borderRadius: '10px' }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      sx={{ borderRadius: '10px' }}
                    >
                      {saving
                        ? 'Salvando...'
                        : editingId
                          ? 'Salvar alterações'
                          : 'Publicar conteúdo'}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <PreviewPanel contentPreview={contentPreview} />
            </Box>
          ) : null}

          {!loading && tab === 'library' ? (
            <ContentLibrary
              contents={contents}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ) : null}

          {!loading && tab === 'highlights' ? (
            <Highlights contents={highlightedContents} />
          ) : null}
        </CrmSection>
      </CrmPageShell>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Excluir conteúdo</DialogTitle>
        <DialogContent>
          <Typography>Deseja remover "{deleteTarget?.title ?? ''}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirmed}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage('')}
        >
          <AlertTitle>Marketing atualizado</AlertTitle>
          {successMessage}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
}

type UploadPanelProps = {
  title: string;
  description: string;
  loading: boolean;
  ready: boolean;
  accept: string;
  buttonLabel: string;
  loadingLabel: string;
  icon: React.ReactNode;
  variant?: 'contained' | 'outlined';
  onChange: (file: File | undefined) => void;
};

function UploadPanel({
  title,
  description,
  loading,
  ready,
  accept,
  buttonLabel,
  loadingLabel,
  icon,
  variant = 'contained',
  onChange,
}: UploadPanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: '12px',
        bgcolor: '#f8fafc',
      }}
    >
      <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
        {description}
      </Typography>
      <Button
        component="label"
        variant={variant}
        startIcon={icon}
        sx={{ mt: 2, borderRadius: '10px' }}
      >
        {loading ? loadingLabel : buttonLabel}
        <Box
          component="input"
          type="file"
          accept={accept}
          sx={{ display: 'none' }}
          onChange={(event) => onChange(event.target.files?.[0])}
        />
      </Button>
      {ready ? (
        <FormHelperText sx={{ color: 'success.main' }}>
          Arquivo pronto para uso.
        </FormHelperText>
      ) : null}
    </Paper>
  );
}

function PreviewPanel({
  contentPreview,
}: {
  contentPreview: FormState & {
    title: string;
    summary: string;
    body: string;
    campaignName: string;
    ctaLabel: string;
  };
}) {
  const previewHref = contentPreview.ctaUrl || contentPreview.videoUrl;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
      }}
    >
      <Typography
        sx={{
          color: crmPalette.orangeDark,
          fontSize: 12,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '.16em',
        }}
      >
        Preview
      </Typography>
      <Typography component="h2" sx={{ mt: 0.5, fontSize: 24, fontWeight: 900 }}>
        Como o cliente vai ver
      </Typography>

      <Paper
        elevation={0}
        sx={{
          mt: 3,
          position: 'relative',
          minHeight: 520,
          overflow: 'hidden',
          borderRadius: '14px',
          bgcolor: '#343434',
          backgroundImage: contentPreview.coverImageUrl
            ? `linear-gradient(180deg,rgba(52,52,52,.10),rgba(0,0,0,.78)),url(${contentPreview.coverImageUrl})`
            : 'linear-gradient(135deg,#343434 0%,#ec3139 52%,#fab519 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 3,
            color: '#fff',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={getTypeLabel(contentPreview.type)}
              sx={{
                ...getTypeChipSx(contentPreview.type),
                fontWeight: 900,
              }}
            />
            <Chip
              label={contentPreview.isPublished ? 'Publicado' : 'Rascunho'}
              sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff' }}
            />
            {contentPreview.highlight ? (
              <Chip
                label="Destaque"
                sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff' }}
              />
            ) : null}
          </Stack>

          <Typography
            component="h3"
            sx={{
              maxWidth: 420,
              fontSize: { xs: 28, md: 34 },
              lineHeight: 1.05,
              fontWeight: 900,
            }}
          >
            {contentPreview.title}
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              maxWidth: 440,
              color: 'rgba(255,255,255,.86)',
              fontWeight: 700,
            }}
          >
            {contentPreview.summary}
          </Typography>

          {previewHref ? (
            <Button
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              endIcon={<ArrowRight size={18} />}
              sx={{
                mt: 3,
                alignSelf: 'flex-start',
                color: '#fff',
                fontWeight: 900,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,.12)',
                },
              }}
            >
              {contentPreview.ctaLabel}
            </Button>
          ) : (
            <Button
              component="span"
              endIcon={<ArrowRight size={18} />}
              sx={{
                mt: 3,
                alignSelf: 'flex-start',
                color: '#fff',
                fontWeight: 900,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,.12)',
                },
              }}
            >
              {contentPreview.ctaLabel}
            </Button>
          )}
        </Box>
      </Paper>
    </Paper>
  );
}

function ContentLibrary({
  contents,
  onEdit,
  onDelete,
}: {
  contents: PortalContent[];
  onEdit: (content: PortalContent) => void;
  onDelete: (content: PortalContent) => void;
}) {
  if (contents.length === 0) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="info">Nenhum conteúdo cadastrado.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {contents.map((item) => (
          <Paper
            key={item.id}
            elevation={0}
            sx={{
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '14px',
              bgcolor: '#fff',
            }}
          >
            <Box
              sx={{
                height: 210,
                bgcolor: '#f8fafc',
                backgroundImage: item.coverImageUrl
                  ? `url(${item.coverImageUrl})`
                  : 'linear-gradient(135deg,#f8fafc,#fff7d6)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!item.coverImageUrl ? (
                <ImagePlus size={36} color="#94a3b8" />
              ) : null}
            </Box>

            <Stack spacing={2} sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={getTypeLabel(item.type)}
                  sx={getTypeChipSx(item.type)}
                />
                <Chip
                  size="small"
                  label={item.isPublished ? 'Publicado' : 'Rascunho'}
                  color={item.isPublished ? 'success' : 'default'}
                />
                {item.highlight ? (
                  <Chip size="small" label="Destaque" color="warning" />
                ) : null}
              </Stack>

              <Box>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.campaignName || 'Portal do cliente'}
                </Typography>
                <Typography
                  component="h3"
                  sx={{ mt: 1, fontSize: 20, fontWeight: 900 }}
                >
                  {item.title}
                </Typography>
                <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                  {item.summary}
                </Typography>
                <Typography sx={{ mt: 1.5, color: 'text.disabled', fontSize: 12 }}>
                  Atualizado em {formatDate(item.updatedAt)}
                </Typography>
              </Box>

              <Divider />

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {item.videoUrl ? (
                  <Button
                    href={item.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    size="small"
                    variant="outlined"
                    startIcon={<Film size={16} />}
                    sx={{ borderRadius: '10px' }}
                  >
                    Vídeo
                  </Button>
                ) : null}
                {item.ctaUrl && item.ctaLabel ? (
                  <Button
                    href={item.ctaUrl}
                    target="_blank"
                    rel="noreferrer"
                    size="small"
                    variant="outlined"
                    startIcon={<Rocket size={16} />}
                    sx={{ borderRadius: '10px' }}
                  >
                    {item.ctaLabel}
                  </Button>
                ) : null}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Pencil size={16} />}
                  onClick={() => onEdit(item)}
                  sx={{ borderRadius: '10px' }}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => onDelete(item)}
                  sx={{ borderRadius: '10px' }}
                >
                  Excluir
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

function Highlights({ contents }: { contents: PortalContent[] }) {
  if (contents.length === 0) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="info">Nenhum destaque configurado ainda.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {contents.map((item) => (
          <Paper
            key={item.id}
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid #fde68a',
              borderRadius: '14px',
              bgcolor: '#fffdf5',
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: '#fff7d6',
                  color: '#b45309',
                  borderRadius: '10px',
                }}
              >
                <Sparkles size={20} />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{item.title}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {item.campaignName || 'Campanha em destaque'}
                </Typography>
              </Box>
            </Stack>
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>
              {item.summary}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
