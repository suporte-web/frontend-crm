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

import {
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';

import {
  siteBlogHistory,
  type SiteBlogHistoryPost,
} from '@/config/site-institucional/site-blog-history';

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
};

type SiteBlogPostsEditorProps = {
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
  post: SiteBlogHistoryPost,
) {
  const href =
    post.href.trim();

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

  return post.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getNewSiteBlogPostUrl(
  post: SiteBlogHistoryPost,
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
    published: true,
  };
}

export function SiteBlogPostsEditor({
  value,
  disabled = false,
  onChange,
}: SiteBlogPostsEditorProps) {
  const posts =
    normalizePosts(value);

  const [
    historyPage,
    setHistoryPage,
  ] =
    useState(1);

  const historyTotalPages =
    Math.max(
      1,
      Math.ceil(
        siteBlogHistory.length /
          historyPostsPerPage,
      ),
    );

  const currentHistoryPage =
    Math.min(
      historyPage,
      historyTotalPages,
    );

  const visibleHistoryPosts =
    siteBlogHistory.slice(
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
            onClick={() =>
              onChange([
                createPost(),
                ...posts,
              ])
            }
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
        {posts.length ? (
          posts.map((post, index) => (
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
                (post) => (
                  <Paper
                    key={post.href}
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

                      <Button
                        component="a"
                        href={getNewSiteBlogPostUrl(post)}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        size="small"
                        endIcon={
                          <ExternalLink
                            size={16}
                          />
                        }
                        sx={{
                          width: {
                            xs: '100%',
                            md: 'fit-content',
                          },
                          borderRadius: '10px',
                          textTransform:
                            'none',
                          fontWeight: 800,
                        }}
                      >
                        Ver post
                      </Button>
                    </Stack>
                  </Paper>
                ),
              )}
            </Stack>

            {siteBlogHistory.length >
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
        </Box>
      </CrmSection>
    </Stack>
  );
}


