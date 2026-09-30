'use client';

import Link from 'next/link';

import {
  useEffect,
  useState,
} from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import { alpha } from '@mui/material/styles';

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Globe2,
  Save,
  Send,
} from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';

import {
  CrmPageHeader,
  CrmPageShell,
  CrmSection,

} from '@/components/mui/crm-primitives';

import {
  SiteSectionEditor,
} from '@/components/site-institucional/SiteSectionEditor';
import {
  SiteBlogPostsEditor,
} from '@/components/site-institucional/SiteBlogPostsEditor';

import {
  getSitePageConfig,
} from '@/config/site-institucional/site-page-config';
import {
  siteDefaultContent,
} from '@/config/site-institucional/site-default-content';

import { useAuth } from '@/context/auth-context';

import {
  buscarPaginaSite,
  publicarPaginaSite,
  salvarRascunhoPaginaSite,
} from '@/services/site-institucional.service';

import type {
  PaginaSite,
} from '@/types/site-institucional';





type SitePageEditorProps = {
  slug: string;
};

type ConteudoGenerico =
  Record<string, unknown>;

const allowedRoles =
  new Set([
    'ADMIN',
    'MARKETING',
  ]);

function isPlainRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function mergeDefaultContent(
  defaultContent: unknown,
  currentContent: unknown,
): unknown {
  if (
    Array.isArray(defaultContent) ||
    Array.isArray(currentContent)
  ) {
    return currentContent === undefined ||
      currentContent === null
      ? structuredClone(defaultContent)
      : structuredClone(currentContent);
  }

  if (
    isPlainRecord(defaultContent) &&
    isPlainRecord(currentContent)
  ) {
    const merged:
      Record<string, unknown> =
      structuredClone(defaultContent);

    Object.entries(
      currentContent,
    ).forEach(([
      key,
      value,
    ]) => {
      merged[key] =
        mergeDefaultContent(
          merged[key],
          value,
        );
    });

    return merged;
  }

  return currentContent === undefined ||
    currentContent === null
    ? structuredClone(defaultContent)
    : structuredClone(currentContent);
}

function getInitialContent(
  slug: string,
  currentContent?: unknown,
): ConteudoGenerico {
  return mergeDefaultContent(
    siteDefaultContent[slug] ?? {},
    currentContent ?? {},
  ) as ConteudoGenerico;
}



function getValueByPath(
  source: unknown,
  path: string,
): unknown {
  const parts = path.split('.');

  let current: unknown =
    source;

  for (const part of parts) {
    if (
      current === null ||
      current === undefined
    ) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index =
        Number(part);

      if (
        Number.isNaN(index)
      ) {
        return undefined;
      }

      current =
        current[index];

      continue;
    }

    if (
      typeof current !==
      'object'
    ) {
      return undefined;
    }

    current = (
      current as Record<
        string,
        unknown
      >
    )[part];
  }

  return current;
}



function setValueByPath(
  source: ConteudoGenerico,
  path: string,
  value: unknown,
): ConteudoGenerico {
  const clone =
    structuredClone(source);

  const parts =
    path.split('.');

  let current:
    | Record<string, unknown>
    | unknown[] =
    clone;

  for (
    let index = 0;
    index <
    parts.length - 1;
    index += 1
  ) {
    const part =
      parts[index];

    const nextPart =
      parts[index + 1];

    const nextIsArrayIndex =
      /^\d+$/.test(nextPart);

    if (Array.isArray(current)) {
      const arrayIndex =
        Number(part);

      if (
        current[arrayIndex] ===
        undefined
      ) {
        current[arrayIndex] =
          nextIsArrayIndex
            ? []
            : {};
      }

      current =
        current[
        arrayIndex
        ] as
        | Record<
          string,
          unknown
        >
        | unknown[];

      continue;
    }

    if (
      current[part] ===
      undefined ||
      current[part] ===
      null
    ) {
      current[part] =
        nextIsArrayIndex
          ? []
          : {};
    }

    current =
      current[part] as
      | Record<
        string,
        unknown
      >
      | unknown[];
  }

  const lastPart =
    parts[
    parts.length - 1
    ];

  if (Array.isArray(current)) {
    current[
      Number(lastPart)
    ] = value;
  } else {
    current[lastPart] =
      value;
  }

  return clone;
}

export function SitePageEditor({
  slug,
}: SitePageEditorProps) {
  const {
    user,
    token,
  } = useAuth();

  const config =
    getSitePageConfig(slug);

  const [
    pagina,
    setPagina,
  ] =
    useState<
      PaginaSite | null
    >(null);

  const [
    conteudo,
    setConteudo,
  ] =
    useState<ConteudoGenerico>(
      {},
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingDraft,
    setSavingDraft,
  ] =
    useState(false);

  const [
    publishing,
    setPublishing,
  ] =
    useState(false);

  const [
    pageError,
    setPageError,
  ] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('');

  const isAllowed =
    user?.role
      ? allowedRoles.has(
        user.role,
      )
      : false;

  /*
  |--------------------------------------------------------------------------
  | CARREGAR CONTEÚDO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const authToken =
      token ?? '';

    if (
      !config ||
      !isAllowed ||
      !authToken
    ) {
      setLoading(false);

      return;
    }

    async function carregar() {
      try {
        setLoading(true);

        setPageError('');

        const resultado =
          await buscarPaginaSite(
            slug,
            authToken,
          );

        if (!resultado) {
          setPagina(null);

          setConteudo(
            getInitialContent(
              slug,
            ),
          );

          return;
        }

        setPagina(
          resultado,
        );

        const conteudoAtual =
          resultado
            .conteudoRascunho ??
          resultado
            .conteudoPublicado ??
          {};

        setConteudo(
          getInitialContent(
            slug,
            conteudoAtual,
          ),
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar a página.',
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [
    config,
    isAllowed,
    slug,
    token,
  ]);

  /*
  |--------------------------------------------------------------------------
  | ALTERAR CAMPO
  |--------------------------------------------------------------------------
  */

  function handleFieldChange(
    path: string,
    value: string,
  ) {
    setConteudo(
      (current) =>
        setValueByPath(
          current,
          path,
          value,
        ),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SALVAR RASCUNHO
  |--------------------------------------------------------------------------
  */

  async function handleSave() {
    if (
      !token ||
      !config
    ) {
      return;
    }

    try {
      setSavingDraft(true);

      setPageError('');

      const resultado =
        await salvarRascunhoPaginaSite(
          slug,
          config.title,
          conteudo,
          token,
        );

      setPagina(
        resultado,
      );

      setSuccessMessage(
        'Rascunho salvo com sucesso.',
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar rascunho.',
      );
    } finally {
      setSavingDraft(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PUBLICAR
  |--------------------------------------------------------------------------
  */

  async function handlePublish() {
    if (
      !token ||
      !config
    ) {
      return;
    }

    try {
      setPublishing(true);

      setPageError('');

      /*
       * Primeiro salvamos exatamente
       * o conteúdo atual.
       */

      await salvarRascunhoPaginaSite(
        slug,
        config.title,
        conteudo,
        token,
      );

      /*
       * Depois publicamos.
       */

      const resultado =
        await publicarPaginaSite(
          slug,
          token,
        );

      setPagina(
        resultado,
      );

      setSuccessMessage(
        'Página publicada com sucesso.',
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : 'Erro ao publicar página.',
      );
    } finally {
      setPublishing(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIGURAÇÃO NÃO ENCONTRADA
  |--------------------------------------------------------------------------
  */

  if (!config) {
    return (
      <AppLayout>
        <Alert severity="warning">
          Esta página ainda não
          possui configuração no
          CRM.
        </Alert>
      </AppLayout>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PERMISSÃO
  |--------------------------------------------------------------------------
  */

  if (!isAllowed) {
    return (
      <AppLayout>
        <Alert severity="warning">
          Esta área é restrita aos
          perfis de Marketing e
          Administração.
        </Alert>
      </AppLayout>
    );
  }
  const statusPagina = !pagina?.publicado
    ? {
      label: 'Rascunho',
      descricao:
        'Esta página ainda não possui uma versão publicada.',
      cor: '#64748B',
      fundo: '#F1F5F9',
      icone: <FilePenLine size={18} />,
    }
    : pagina.temAlteracoesNaoPublicadas
      ? {
        label: 'Alterações não publicadas',
        descricao:
          'Existe um rascunho diferente da versão publicada no site.',
        cor: '#D97706',
        fundo: '#FFF7ED',
        icone: <Clock3 size={18} />,
      }
      : {
        label: 'Publicado',
        descricao:
          'A versão publicada está atualizada.',
        cor: '#15803D',
        fundo: '#F0FDF4',
        icone: <CheckCircle2 size={18} />,
      };

  return (
    <AppLayout>
      <CrmPageShell>
        {/* =====================================================
          CABEÇALHO
      ===================================================== */}

        <CrmPageHeader
          eyebrow="Site Institucional"
          title={config.title}
          description={
            config.description ??
            'Gerencie os conteúdos desta página.'
          }
          icon={<Globe2 size={24} />}
          aside={
            <Button
              component={Link}
              href="/site-institucional"
              variant="outlined"
              startIcon={
                <ArrowLeft size={18} />
              }
              sx={{
                minHeight: 42,

                px: 2,

                borderRadius: 2.5,

                borderColor: alpha(
                  '#17212B',
                  0.12,
                ),

                color: '#334155',

                bgcolor: '#fff',

                textTransform: 'none',

                fontWeight: 800,

                '&:hover': {
                  borderColor:
                    '#ff5805',

                  bgcolor: alpha(
                    '#ff5805',
                    0.05,
                  ),

                  color: '#ff5805',
                },
              }}
            >
              Voltar
            </Button>
          }
        />


        {/* =====================================================
          ERROS
      ===================================================== */}

        {pageError ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,

              border: '1px solid',

              borderColor:
                'error.light',
            }}
          >
            {pageError}
          </Alert>
        ) : null}

        {/* =====================================================
          LOADING
      ===================================================== */}

        {loading ? (
          <CrmSection
            sx={{
              minHeight: 340,

              display: 'grid',

              placeItems: 'center',

              borderRadius: 3,

              bgcolor: '#fff',
            }}
          >
            <Stack
              spacing={2}
              sx={{
                alignItems:
                  'center',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,

                  display: 'grid',

                  placeItems:
                    'center',

                  borderRadius:
                    '50%',

                  bgcolor: alpha(
                    '#ff5805',
                    0.07,
                  ),
                }}
              >
                <CircularProgress
                  size={28}
                  sx={{
                    color:
                      '#ff5805',
                  }}
                />
              </Box>

              <Box
                sx={{
                  textAlign:
                    'center',
                }}
              >
                <Typography
                  sx={{
                    color:
                      'text.primary',

                    fontSize: 15,

                    fontWeight: 850,
                  }}
                >
                  Carregando conteúdo
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    color:
                      'text.secondary',

                    fontSize: 13,
                  }}
                >
                  Aguarde enquanto carregamos os dados da página.
                </Typography>
              </Box>
            </Stack>
          </CrmSection>
        ) : null}

        {/* =====================================================
          CONTEÚDO
      ===================================================== */}

        {!loading ? (
          <Stack spacing={3}>
            {/* SEÇÕES */}

            <Stack spacing={2.5}>
              {config.sections.map(
                (section) => (
                  <SiteSectionEditor
                    key={
                      section.key
                    }
                    slug={slug}
                    token={
                      token ?? ''
                    }
                    section={
                      section
                    }
                    getValue={(
                      path,
                    ) =>
                      getValueByPath(
                        conteudo,
                        path,
                      )
                    }
                    onChange={
                      handleFieldChange
                    }
                    disabled={
                      savingDraft ||
                      publishing
                    }
                  />
                ),
              )}
            </Stack>

            {/* BLOG */}
            {slug === 'blog' ? (
              <SiteBlogPostsEditor
                slug={slug}
                token={token ?? ''}
                value={getValueByPath(
                  conteudo,
                  'posts',
                )}
                disabled={
                  savingDraft ||
                  publishing
                }
                onChange={(posts) =>
                  setConteudo(
                    (current) =>
                      setValueByPath(
                        current,
                        'posts',
                        posts,
                      ),
                  )
                }
              />
            ) : null}

            {/* =================================================
              BARRA DE PUBLICAÇÃO
          ================================================= */}

            <Paper
              elevation={0}
              sx={{
                position: 'sticky',

                bottom: 16,

                zIndex: 10,

                overflow: 'hidden',

                p: {
                  xs: 2,
                  md: 2.25,
                },

                borderRadius: 3,

                border:
                  '1px solid',

                borderColor:
                  alpha(
                    '#17212B',
                    0.1,
                  ),

                bgcolor:
                  'rgba(255,255,255,0.96)',

                backdropFilter:
                  'blur(12px)',

                boxShadow:
                  '0 18px 50px rgba(15, 23, 42, 0.13)',
              }}
            >
              <Stack
                direction={{
                  xs: 'column',
                  lg: 'row',
                }}
                spacing={2}
                sx={{
                  alignItems: {
                    xs: 'stretch',
                    lg: 'center',
                  },

                  justifyContent:
                    'space-between',
                }}
              >
                {/* STATUS */}

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems:
                      'center',

                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,

                      display:
                        'grid',

                      placeItems:
                        'center',

                      flexShrink: 0,

                      borderRadius:
                        2.25,

                      bgcolor:
                        statusPagina.fundo,

                      color:
                        statusPagina.cor,
                    }}
                  >
                    {
                      statusPagina.icone
                    }
                  </Box>

                  <Box
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          statusPagina.cor,

                        fontSize:
                          13.5,

                        fontWeight:
                          900,
                      }}
                    >
                      {
                        statusPagina.label
                      }
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,

                        color:
                          'text.secondary',

                        fontSize: 12.5,

                        lineHeight:
                          1.45,
                      }}
                    >
                      {
                        statusPagina.descricao
                      }
                    </Typography>
                  </Box>
                </Stack>

                {/* BOTÕES */}

                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row',
                  }}
                  spacing={1}
                  sx={{
                    flexShrink: 0,
                  }}
                >
                  <Button
                    component={Link}
                    href="/site-institucional"
                    variant="outlined"
                    disabled={
                      savingDraft ||
                      publishing
                    }
                    sx={{
                      minHeight: 42,

                      px: 2,

                      borderRadius:
                        2.25,

                      borderColor:
                        alpha(
                          '#17212B',
                          0.14,
                        ),

                      color:
                        '#475569',

                      textTransform:
                        'none',

                      fontWeight: 800,

                      '&:hover': {
                        borderColor:
                          '#64748B',

                        bgcolor:
                          '#F8FAFC',
                      },
                    }}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={
                      savingDraft ? (
                        <CircularProgress
                          size={16}
                          color="inherit"
                        />
                      ) : (
                        <Save
                          size={17}
                        />
                      )
                    }
                    onClick={
                      handleSave
                    }
                    disabled={
                      savingDraft ||
                      publishing
                    }
                    sx={{
                      minHeight: 42,

                      px: 2,

                      borderRadius:
                        2.25,

                      borderColor:
                        alpha(
                          '#ff5805',
                          0.28,
                        ),

                      color:
                        '#e94f00',

                      bgcolor:
                        alpha(
                          '#ff5805',
                          0.025,
                        ),

                      textTransform:
                        'none',

                      fontWeight: 850,

                      '&:hover': {
                        borderColor:
                          '#ff5805',

                        bgcolor:
                          alpha(
                            '#ff5805',
                            0.07,
                          ),
                      },
                    }}
                  >
                    {savingDraft
                      ? 'Salvando...'
                      : 'Salvar rascunho'}
                  </Button>

                  <Button
                    type="button"
                    variant="contained"
                    startIcon={
                      publishing ? (
                        <CircularProgress
                          size={16}
                          color="inherit"
                        />
                      ) : (
                        <Send
                          size={17}
                        />
                      )
                    }
                    onClick={
                      handlePublish
                    }
                    disabled={
                      savingDraft ||
                      publishing
                    }
                    sx={{
                      minHeight: 42,

                      px: 2.5,

                      borderRadius:
                        2.25,

                      bgcolor:
                        '#ff5805',

                      color: '#fff',

                      textTransform:
                        'none',

                      fontWeight: 900,

                      boxShadow:
                        '0 8px 20px rgba(255, 88, 5, 0.20)',

                      '&:hover': {
                        bgcolor:
                          '#e94f00',

                        boxShadow:
                          '0 10px 24px rgba(255, 88, 5, 0.26)',
                      },

                      '&.Mui-disabled':
                      {
                        bgcolor:
                          '#FED7C3',

                        color:
                          '#fff',
                      },
                    }}
                  >
                    {publishing
                      ? 'Publicando...'
                      : 'Publicar'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        ) : null}
      </CrmPageShell>

      <Snackbar
        open={Boolean(
          successMessage,
        )}
        autoHideDuration={5000}
        onClose={() =>
          setSuccessMessage('')
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setSuccessMessage('')
          }
          sx={{
            minWidth: {
              xs: 'auto',
              sm: 320,
            },

            borderRadius: 2.5,

            fontWeight: 750,

            boxShadow:
              '0 12px 30px rgba(15, 23, 42, 0.18)',
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </AppLayout>
  )
}
