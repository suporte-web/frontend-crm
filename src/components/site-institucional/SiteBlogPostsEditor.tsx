'use client';

import {
  useState,
} from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import {
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

import {
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';

import {
  siteBlogHistory,
  type SiteBlogHistoryPost,
} from '@/config/site-institucional/site-blog-history';

import { SiteImageUpload } from './SiteImageUpload';

type BlogPostSite = {
  id?: string;
  title?: string;
  href?: string;
  category?: string;
  date?: string;
  excerpt?: string;
  image?: string;
  alt?: string;
  published?: boolean;

  createdInCrm?: boolean;
};

type SiteBlogPostsEditorProps = {
  slug: string;
  token: string;
  value: unknown;
  disabled?: boolean;

  onChange: (
    value: BlogPostSite[],
  ) => void;
};


const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: '#fff',
  },
};

const historyPostsPerPage =
  6;

const publicSiteBaseUrl =
  process.env.NEXT_PUBLIC_SITE_PUBLIC_URL?.replace(
    /\/$/,
    '',
  ) ?? '';


function getBlogPostSlug(
  post: BlogPostSite | SiteBlogHistoryPost,
) {
  const href =
    post.href?.trim() ?? '';

  if (href) {
    return href
      .replace(
        /^https?:\/\/[^/]+\/?/,
        '',
      )
      .replace(
        /^blog\//,
        '',
      )
      .replace(/\/$/, '');
  }

  const title =
    post.title?.trim() ?? '';

  return title
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-',
    )
    .replace(
      /^-+|-+$/g,
      '',
    );
}



function getNewSiteBlogPostUrl(
  post: BlogPostSite | SiteBlogHistoryPost,
) {
  const slug =
    getBlogPostSlug(post);

  const path = slug
    ? `/blog/${slug}`
    : '/blog';

  return publicSiteBaseUrl
    ? `${publicSiteBaseUrl}${path}`
    : path;
}


function normalizePosts(
  value: unknown,
): BlogPostSite[] {
  return Array.isArray(value)
    ? value.filter(
      (post): post is BlogPostSite =>
        Boolean(post) &&
        typeof post === 'object',
    )
    : [];
}

function createPost(): BlogPostSite {
  const id =
    typeof crypto !== 'undefined' &&
      'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  return {
    id,
    title: '',
    href: '',
    category: '',
    date: '',
    excerpt: '',
    image: '',
    alt: '',
    published: false,
    createdInCrm: true,
  };
}

export function SiteBlogPostsEditor({
  slug,
  token,
  value,
  disabled = false,
  onChange,
}: SiteBlogPostsEditorProps) {

  const posts =
    normalizePosts(value);

  const [openNewPost, setOpenNewPost] =
    useState(false);

  const [newPost, setNewPost] =
    useState<BlogPostSite | null>(null);

  const [
    postToDelete,
    setPostToDelete,
  ] = useState<BlogPostSite | null>(
    null,
  );

  const [
    deleteSuccess,
    setDeleteSuccess,
  ] = useState(false);

  function openNewPostDialog() {
    setNewPost(createPost());
    setOpenNewPost(true);
  }

  function closeNewPostDialog() {
    setOpenNewPost(false);
    setNewPost(null);
  }

  function publishNewPost() {
    if (!newPost) {
      return;
    }


    if (!newPost.title?.trim()) {
      return;
    }

    if (!newPost.excerpt?.trim()) {
      return;
    }

    if (!newPost.image?.trim()) {
      return;
    }

    const postPublicado: BlogPostSite = {
      ...newPost,

      title: newPost.title.trim(),

      excerpt: newPost.excerpt.trim(),

      published: true,

      createdInCrm: true,

      date:
        newPost.date?.trim() ||
        new Intl.DateTimeFormat(
          'pt-BR',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          },
        ).format(new Date()),
    };

    onChange([
      postPublicado,
      ...posts,
    ]);

    setHistoryPage(1);

    closeNewPostDialog();
  }

  const novosPosts = posts
    .map((post, index) => ({
      post,
      index,
    }))
    .filter(({ post }) =>
      post.createdInCrm === true
    );

  const [
    historyPage,
    setHistoryPage,
  ] =
    useState(1);

  const crmHistoryPosts =
    posts.filter(
      (post) =>
        post.createdInCrm === true &&
        post.published === true,
    );

  const allHistoryPosts = [
    ...crmHistoryPosts,
    ...siteBlogHistory,
  ];

  const historyTotalPages =
    Math.max(
      1,
      Math.ceil(
        allHistoryPosts.length /
        historyPostsPerPage,
      ),
    );

  const currentHistoryPage =
    Math.min(
      historyPage,
      historyTotalPages,
    );

  const visibleHistoryPosts =
    allHistoryPosts.slice(
      (
        currentHistoryPage - 1
      ) * historyPostsPerPage,

      currentHistoryPage *
      historyPostsPerPage,
    );

  function updatePost(
    index: number,
    patch: Partial<BlogPostSite>,
  ) {
    onChange(
      posts.map((post, postIndex) =>
        postIndex === index
          ? {
            ...post,
            ...patch,
          }
          : post,
      ),
    );
  }

  function removePost(
    index: number,
  ) {
    onChange(
      posts.filter(
        (_, postIndex) =>
          postIndex !== index,
      ),
    );
  }

  function handleDeletePost() {
    if (!postToDelete?.id) {
      return;
    }

    onChange(
      posts.filter(
        (post) =>
          post.id !== postToDelete.id,
      ),
    );

    setPostToDelete(null);
    setDeleteSuccess(true);
  }

  return (
    <Stack spacing={3}>
      <CrmSection>
        <Box
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Stack
            direction={{
              xs: 'column',
              sm: 'row',
            }}
            spacing={2}
            sx={{
              alignItems: {
                xs: 'stretch',
                sm: 'center',
              },
              justifyContent:
                'space-between',
            }}
          >
            <Box>
              <Typography
                component="h2"
                sx={{
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                Novo post no blog
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color: 'text.secondary',
                  fontSize: 13,
                }}
              >
                Cadastre somente o título
                dos novos posts do blog.
                O site mostra apenas posts
                marcados como publicados
                após publicar a página.
              </Typography>
            </Box>

            <Button
              type="button"
              variant="contained"
              startIcon={<Plus size={17} />}
              disabled={disabled}
              onClick={openNewPostDialog}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 800,
                bgcolor: crmPalette.orange,

                '&:hover': {
                  bgcolor:
                    crmPalette.orangeDark,
                },
              }}
            >
              Novo post
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Stack
          spacing={2.5}
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          {novosPosts.length ? (
            novosPosts.map(({ post, index }) => (
              <Stack
                key={post.id ?? index}
                spacing={2}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '14px',
                  bgcolor: '#f8fafc',
                }}
              >
                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row',
                  }}
                  spacing={1.5}
                  sx={{
                    alignItems: {
                      xs: 'stretch',
                      sm: 'center',
                    },
                    justifyContent:
                      'space-between',
                  }}
                >
                  <Chip
                    icon={
                      post.published ? (
                        <Eye size={15} />
                      ) : (
                        <EyeOff size={15} />
                      )
                    }
                    label={
                      post.published
                        ? 'Visível no site'
                        : 'Oculto no site'
                    }
                    color={
                      post.published
                        ? 'success'
                        : 'default'
                    }
                    sx={{
                      width: 'fit-content',
                      fontWeight: 800,
                    }}
                  />

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      justifyContent:
                        'flex-end',
                    }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      disabled={disabled}
                      onClick={() =>
                        updatePost(index, {
                          published:
                            !post.published,
                        })
                      }
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 800,
                      }}
                    >
                      {post.published
                        ? 'Ocultar do site'
                        : 'Mostrar no site'}
                    </Button>

                    <IconButton
                      disabled={disabled}
                      color="error"
                      onClick={() =>
                        removePost(index)
                      }
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                </Stack>

                <Stack spacing={2}>
                  <TextField
                    label="Título"
                    value={post.title ?? ''}
                    disabled={disabled}
                    fullWidth
                    sx={fieldSx}
                    onChange={(event) =>
                      updatePost(index, {
                        title:
                          event.target.value,
                      })
                    }
                  />
                </Stack>
                {post.createdInCrm ? (
                  <SiteImageUpload
                    slug={slug}
                    token={token}
                    label="Imagem do post"
                    value={post.image ?? ''}
                    recommendedSize="1600 x 900 px, proporção 16:9"
                    disabled={disabled}
                    onChange={(imageUrl) =>
                      updatePost(index, {
                        image: imageUrl,
                      })
                    }
                  />
                ) : null}
              </Stack>
            ))
          ) : (
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: 14,
              }}
            >
              Nenhum post criado ainda.
            </Typography>
          )}
        </Stack>
      </CrmSection>

      <CrmSection>
        <Box
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Dialog
            open={openNewPost}
            onClose={closeNewPostDialog}
            fullWidth
            maxWidth="md"
            slotProps={{
              paper: {
                sx: {
                  borderRadius: '20px',
                  overflow: 'hidden',
                  bgcolor: '#f8fafc',
                  boxShadow:
                    '0 24px 70px rgba(15, 23, 42, 0.20)',
                },
              },
            }}
          >
            {/* CABEÇALHO */}
            <DialogTitle
              sx={{
                p: 0,
                bgcolor: '#fff',
                borderBottom: '1px solid',
                borderColor: '#e5e7eb',
              }}
            >
              <Stack
                direction="row"
                sx={{
                  px: {
                    xs: 2.5,
                    md: 3.5,
                  },
                  py: 2.5,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: '#fff4eb',
                      color: crmPalette.orange,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={22} />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: {
                          xs: 18,
                          md: 21,
                        },
                        fontWeight: 900,
                        color: '#17212b',
                        lineHeight: 1.2,
                      }}
                    >
                      Novo post
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.4,
                        color: 'text.secondary',
                        fontSize: 13,
                      }}
                    >
                      Preencha as informações para publicar no blog.
                    </Typography>
                  </Box>
                </Stack>

                <IconButton
                  onClick={closeNewPostDialog}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: '#f1f5f9',
                    color: '#64748b',

                    '&:hover': {
                      bgcolor: '#e2e8f0',
                    },
                  }}
                >
                  <X size={19} />
                </IconButton>
              </Stack>
            </DialogTitle>

            {/* CONTEÚDO */}
            <DialogContent
              sx={{
                p: {
                  xs: 2,
                  md: 3.5,
                },
                bgcolor: '#f8fafc',
              }}
            >
              <Stack spacing={2.5}>
                {/* DADOS DO POST */}
                <Paper
                  elevation={0}
                  sx={{
                    p: {
                      xs: 2,
                      md: 3,
                    },
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: '#e5e7eb',
                    bgcolor: '#fff',
                  }}
                >
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: '#17212b',
                        }}
                      >
                        Informações da publicação
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          color: 'text.secondary',
                          fontSize: 12.5,
                        }}
                      >
                        Informe o título e um resumo para apresentar o conteúdo.
                      </Typography>
                    </Box>

                    <TextField
                      label="Título do post"
                      placeholder="Ex.: Novidades da Pizzattolog"
                      value={newPost?.title ?? ''}
                      fullWidth
                      sx={{
                        ...fieldSx,

                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: '#fff',
                        },
                      }}
                      onChange={(event) =>
                        setNewPost((current) =>
                          current
                            ? {
                              ...current,
                              title:
                                event.target.value,
                            }
                            : current,
                        )
                      }
                    />

                    <TextField
                      label="Resumo"
                      placeholder="Escreva uma breve descrição sobre esta publicação..."
                      value={
                        newPost?.excerpt ?? ''
                      }
                      multiline
                      minRows={4}
                      fullWidth
                      sx={{
                        ...fieldSx,

                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: '#fff',
                          alignItems: 'flex-start',
                        },
                      }}
                      onChange={(event) =>
                        setNewPost((current) =>
                          current
                            ? {
                              ...current,
                              excerpt:
                                event.target.value,
                            }
                            : current,
                        )
                      }
                    />
                  </Stack>
                </Paper>

                {/* IMAGEM */}
                <Paper
                  elevation={0}
                  sx={{
                    p: {
                      xs: 2,
                      md: 3,
                    },
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: '#e5e7eb',
                    bgcolor: '#fff',
                  }}
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: '#17212b',
                        }}
                      >
                        Imagem de destaque
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          color: 'text.secondary',
                          fontSize: 12.5,
                        }}
                      >
                        Essa imagem será utilizada na apresentação do post.
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '14px',
                        bgcolor: '#f8fafc',
                        border: '1px dashed',
                        borderColor: '#cbd5e1',
                      }}
                    >
                      <SiteImageUpload
                        slug={slug}
                        token={token}
                        label="Imagem do post"
                        value={
                          newPost?.image ?? ''
                        }
                        recommendedSize="1600 x 900 px, proporção 16:9"
                        disabled={disabled}
                        onChange={(imageUrl) =>
                          setNewPost((current) =>
                            current
                              ? {
                                ...current,
                                image:
                                  imageUrl,
                              }
                              : current,
                          )
                        }
                      />
                    </Box>
                  </Stack>
                </Paper>

                {/* AVISO */}
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: '12px',
                    alignItems: 'center',

                    '& .MuiAlert-message': {
                      fontSize: 13,
                      fontWeight: 600,
                    },
                  }}
                >
                  Preencha título, resumo e imagem para liberar a publicação.
                </Alert>
              </Stack>
            </DialogContent>

            {/* RODAPÉ */}
            <DialogActions
              sx={{
                px: {
                  xs: 2.5,
                  md: 3.5,
                },
                py: 2.25,
                bgcolor: '#fff',
                borderTop: '1px solid',
                borderColor: '#e5e7eb',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                sx={{
                  display: {
                    xs: 'none',
                    sm: 'block',
                  },
                  color: 'text.secondary',
                  fontSize: 12.5,
                }}
              >
                Os campos são obrigatórios.
              </Typography>

              <Stack
                direction="row"
                spacing={1.25}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={closeNewPostDialog}
                  sx={{
                    minWidth: 105,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 800,
                    color: '#475569',
                    borderColor: '#cbd5e1',

                    '&:hover': {
                      borderColor: '#94a3b8',
                      bgcolor: '#f8fafc',
                    },
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  onClick={publishNewPost}
                  disabled={
                    !newPost?.title?.trim() ||
                    !newPost?.excerpt?.trim() ||
                    !newPost?.image?.trim()
                  }
                  sx={{
                    minWidth: 115,
                    borderRadius: '10px',
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 900,
                    boxShadow: 'none',
                    bgcolor:
                      crmPalette.orange,

                    '&:hover': {
                      bgcolor:
                        crmPalette.orangeDark,
                      boxShadow: 'none',
                    },

                    '&.Mui-disabled': {
                      bgcolor: '#e2e8f0',
                      color: '#94a3b8',
                    },
                  }}
                >
                  Postar
                </Button>
              </Stack>
            </DialogActions>
          </Dialog>
          <Stack spacing={2.5}>
            <Box>
              <Typography
                component="h2"
                sx={{
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                Histórico do site atual
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color: 'text.secondary',
                  fontSize: 13,
                }}
              >
                Posts antigos mantidos no
                site público. Eles ficam
                apenas como referência e não
                são editáveis pelo CRM.
              </Typography>
            </Box>

            <Stack spacing={1.5}>
              {visibleHistoryPosts.map(
                (post, index) => (
                  <Paper
                    key={
                      'id' in post && post.id
                        ? `crm-${post.id}`
                        : post.href
                          ? `site-${post.href}`
                          : `post-${currentHistoryPage}-${index}`
                    }
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor:
                        'divider',
                      borderRadius: '12px',
                      bgcolor: '#fff',
                    }}
                  >
                    <Stack
                      direction={{
                        xs: 'column',
                        md: 'row',
                      }}
                      spacing={1.5}
                      sx={{
                        alignItems: {
                          xs: 'stretch',
                          md: 'center',
                        },
                        justifyContent:
                          'space-between',
                      }}
                    >
                      <Stack spacing={0.75}>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            color:
                              'text.primary',
                          }}
                        >
                          {post.title}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          sx={{
                            flexWrap: 'wrap',
                            color:
                              'text.secondary',
                          }}
                        >
                          {post.category ? (
                            <Chip
                              size="small"
                              label={
                                post.category
                              }
                              sx={{
                                fontWeight: 800,
                              }}
                            />
                          ) : null}

                          {post.date ? (
                            <Typography
                              component="span"
                              sx={{
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {post.date}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: 'center',
                        }}
                      >
                        <Button
                          component="a"
                          href={getNewSiteBlogPostUrl(
                            post,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          variant="outlined"
                          size="small"
                          endIcon={
                            <ExternalLink size={16} />
                          }
                          sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 800,
                          }}
                        >
                          Ver post
                        </Button>

                        {'createdInCrm' in post &&
                          post.createdInCrm === true ? (
                          <Tooltip title="Excluir post">
                            <IconButton
                              size="small"
                              disabled={disabled}
                              onClick={() =>
                                setPostToDelete(post)
                              }
                              sx={{
                                width: 38,
                                height: 38,

                                color: '#dc2626',
                                bgcolor: '#fef2f2',

                                border: '1px solid',
                                borderColor: '#fecaca',

                                '&:hover': {
                                  bgcolor: '#fee2e2',
                                },
                              }}
                            >
                              <Trash2 size={17} />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                ),
              )}
            </Stack>

            {allHistoryPosts.length >
              historyPostsPerPage ? (
              <Stack
                spacing={1}
                sx={{
                  alignItems: 'center',
                  pt: 0.5,
                }}
              >
                <Pagination
                  count={historyTotalPages}
                  page={currentHistoryPage}
                  onChange={(_, value) =>
                    setHistoryPage(value)
                  }
                  color="primary"
                  shape="rounded"
                />

                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Página {currentHistoryPage}{' '}
                  de {historyTotalPages}
                </Typography>
              </Stack>
            ) : null}
          </Stack>
          <Dialog
            open={Boolean(postToDelete)}
            onClose={() =>
              setPostToDelete(null)
            }
            fullWidth
            maxWidth="xs"
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                },
              },
            }}
          >
            <DialogTitle
              sx={{
                fontWeight: 900,
              }}
            >
              Excluir publicação?
            </DialogTitle>

            <DialogContent>
              <Typography
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.6,
                }}
              >
                Você está prestes a excluir
                {' '}
                <strong>
                  {postToDelete?.title}
                </strong>
                .
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: 'text.secondary',
                  fontSize: 13,
                }}
              >
                Essa ação removerá o post do
                gerenciamento do site.
              </Typography>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                pb: 2.5,
              }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={() =>
                  setPostToDelete(null)
                }
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 800,
                }}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="contained"
                color="error"
                onClick={handleDeletePost}
                startIcon={
                  <Trash2 size={16} />
                }
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 900,
                  boxShadow: 'none',
                }}
              >
                Excluir
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </CrmSection>
      <Snackbar
        open={deleteSuccess}
        autoHideDuration={4000}
        onClose={() =>
          setDeleteSuccess(false)
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
            setDeleteSuccess(false)
          }
          sx={{
            borderRadius: '10px',
            fontWeight: 800,
          }}
        >
          Post excluído com sucesso.
        </Alert>
      </Snackbar>

    </Stack>

  );
}


