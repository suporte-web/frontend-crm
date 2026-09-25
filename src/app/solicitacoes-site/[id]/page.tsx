'use client';

import Link from 'next/link';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import {
  ArrowLeft,
  Inbox,
} from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';

import {
  CrmPageHeader,
  CrmPageShell,
} from '@/components/mui/crm-primitives';

import {
  buscarAnexoSolicitacaoSite,
  buscarSolicitacaoSitePorId,
} from '@/services/solicitacoes-site.service';

import type { SolicitacaoSite } from '@/types/solicitacao-site';
import { useParams } from 'next/navigation';

function formatDate(
  date?: string | null,
) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  ).format(new Date(date));
}

function formatBoolean(
  value?: boolean | null,
) {
  if (value === true) {
    return 'Sim';
  }

  if (value === false) {
    return 'Não';
  }

  return '-';
}

function getTipoConfig(
  tipo?: string | null,
) {
  switch (tipo) {
    case 'AGREGADO':
      return {
        label: 'Agregado',
        cor: '#ff5805',
        icone: LocalShippingRoundedIcon,
      };

    case 'FORNECEDOR':
      return {
        label: 'Fornecedor',
        cor: '#17456B',
        icone: HandshakeRoundedIcon,
      };

    case 'FROTA':
      return {
        label: 'Frota e Manutenção',
        cor: '#ffb71b',
        icone: BuildRoundedIcon,
      };

    case 'MARKETING':
      return {
        label: 'Marketing e Comunicação',
        cor: '#7B61A8',
        icone: CampaignRoundedIcon,
      };

    case 'FINANCEIRO':
      return {
        label: 'Financeiro',
        cor: '#2E7D32',
        icone: AccountBalanceWalletRoundedIcon,
      };

    case 'JURIDICO':
      return {
        label: 'Jurídico',
        cor: '#A35A00',
        icone: GavelRoundedIcon,
      };

    case 'FISCAL':
      return {
        label: 'Fiscal',
        cor: '#D32F2F',
        icone: ReceiptLongRoundedIcon,
      };

    case 'COTACAO':
      return {
        label: 'Cotação',
        cor: '#17456B',
        icone: RequestQuoteRoundedIcon,
      };

    default:
      return {
        label: tipo ?? 'Solicitação',
        cor: '#607D8B',
        icone: Inbox,
      };
  }
}

function getStatusConfig(
  status?: string | null,
) {
  switch (status) {
    case 'NOVO':
      return {
        label: 'Novo',
        cor: '#ff5805',
        fundo: alpha(
          '#ff5805',
          0.1,
        ),
      };

    case 'EM_ATENDIMENTO':
      return {
        label: 'Em atendimento',
        cor: '#17456B',
        fundo: alpha(
          '#17456B',
          0.1,
        ),
      };

    case 'CONCLUIDO':
      return {
        label: 'Concluído',
        cor: '#2E7D32',
        fundo: alpha(
          '#2E7D32',
          0.1,
        ),
      };

    case 'CANCELADO':
      return {
        label: 'Cancelado',
        cor: '#D32F2F',
        fundo: alpha(
          '#D32F2F',
          0.1,
        ),
      };

    default:
      return {
        label:
          status ?? 'Não definido',

        cor: '#607D8B',

        fundo: alpha(
          '#607D8B',
          0.1,
        ),
      };
  }
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: 2,
        borderRadius: 2.5,
        bgcolor: '#F8F9FA',
        border: '1px solid',
        borderColor: alpha(
          '#17212B',
          0.06,
        ),
      }}
    >
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: 11,
          lineHeight: 1.2,
          fontWeight: 900,
          textTransform:
            'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.75,
          color: 'text.primary',
          fontSize: 14.5,
          lineHeight: 1.4,
          fontWeight: 750,
          overflowWrap: 'anywhere',
        }}
      >
        {value || '-'}
      </Typography>
    </Box>
  );
}

function SectionCard({
  title,
  description,
  icon,
  color = '#17456B',
  children,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: {
          xs: 2.5,
          md: 3,
        },
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(
          '#17212B',
          0.08,
        ),
        bgcolor: '#fff',
        boxShadow:
          '0 10px 30px rgba(23, 33, 43, 0.035)',
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
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            borderRadius: 2.5,
            bgcolor: alpha(
              color,
              0.1,
            ),
            color,
            '& svg': {
              fontSize: 23,
            },
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography
            component="h2"
            sx={{
              color:
                'text.primary',
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            {title}
          </Typography>

          {description ? (
            <Typography
              sx={{
                mt: 0.2,
                color:
                  'text.secondary',
                fontSize: 12.5,
              }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      <Divider
        sx={{
          my: 2.5,
        }}
      />

      {children}
    </Paper>
  );
}

export default function SolicitacaoSiteDetalhePage() {
  const { id } =
    useParams<{
      id: string;
    }>();

  const [
    solicitacao,
    setSolicitacao,
  ] =
    useState<SolicitacaoSite | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  async function abrirAnexo(
    anexoId: string,
  ) {
    if (!id) {
      return;
    }

    const novaAba =
      window.open(
        '',
        '_blank',
      );

    try {
      const arquivo =
        await buscarAnexoSolicitacaoSite(
          id,
          anexoId,
        );

      const urlArquivo =
        URL.createObjectURL(
          arquivo,
        );

      if (novaAba) {
        novaAba.location.href =
          urlArquivo;
      } else {
        window.open(
          urlArquivo,
          '_blank',
        );
      }

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            urlArquivo,
          );
        },
        60_000,
      );
    } catch (error) {
      novaAba?.close();

      setError(
        error instanceof Error
          ? error.message
          : 'Não foi possível abrir o anexo.',
      );
    }
  }

  useEffect(() => {
    async function loadSolicitacao() {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response =
          await buscarSolicitacaoSitePorId(
            id,
          );

        setSolicitacao(
          response.solicitacao,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Erro ao carregar solicitação.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadSolicitacao();
  }, [id]);

  const showAgregadoFields =
    useMemo(
      () =>
        solicitacao?.tipo ===
          'AGREGADO' ||
        Boolean(
          solicitacao?.cidade ||
            solicitacao?.categoriaCnh ||
            solicitacao?.marcaVeiculo ||
            solicitacao?.anoVeiculo,
        ),
      [solicitacao],
    );

  const tipo =
    getTipoConfig(
      solicitacao?.tipo,
    );

  const status =
    getStatusConfig(
      solicitacao?.status,
    );

  const TipoIcone =
    tipo.icone;

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Solicitações do site"
          title={
            solicitacao?.nome ??
            'Detalhe da solicitação'
          }
          description="Informações enviadas pelo formulário do site da Pizzattolog."
          icon={
            <Inbox size={24} />
          }
          aside={
            <Button
              component={Link}
              href="/solicitacoes-site"
              variant="outlined"
              startIcon={
                <ArrowLeft
                  size={18}
                />
              }
              sx={{
                minHeight: 42,
                px: 2,
                borderRadius: 2.5,
                borderColor:
                  alpha(
                    '#17456B',
                    0.18,
                  ),
                color:
                  '#17456B',
                fontWeight: 800,
                textTransform:
                  'none',
              }}
            >
              Voltar para fila
            </Button>
          }
        />

        {loading ? (
          <Box
            sx={{
              minHeight: 320,
              display: 'grid',
              placeItems:
                'center',
            }}
          >
            <CircularProgress />
          </Box>
        ) : null}

        {!loading &&
        error ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
            }}
          >
            {error}
          </Alert>
        ) : null}

        {!loading &&
        !error &&
        !solicitacao ? (
          <Alert
            severity="warning"
            sx={{
              borderRadius: 3,
            }}
          >
            Solicitação não encontrada.
          </Alert>
        ) : null}

        {!loading &&
        solicitacao ? (
          <Stack spacing={3}>
            {/* RESUMO */}
            <Paper
              elevation={0}
              sx={{
                position:
                  'relative',
                overflow:
                  'hidden',

                p: {
                  xs: 2.5,
                  md: 3.5,
                },

                borderRadius: 3,

                border:
                  '1px solid',

                borderColor:
                  alpha(
                    tipo.cor,
                    0.16,
                  ),

                bgcolor: '#fff',

                boxShadow:
                  '0 14px 36px rgba(23, 33, 43, 0.05)',

                '&::before': {
                  content: '""',
                  position:
                    'absolute',
                  top: 0,
                  left: 0,
                  width: 5,
                  height: '100%',
                  bgcolor:
                    tipo.cor,
                },
              }}
            >
              <Stack
                direction={{
                  xs: 'column',
                  md: 'row',
                }}
                spacing={2.5}
                sx={{
                  alignItems: {
                    xs: 'flex-start',
                    md: 'center',
                  },

                  justifyContent:
                    'space-between',
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems:
                      'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,

                      display:
                        'grid',

                      placeItems:
                        'center',

                      flexShrink: 0,

                      borderRadius:
                        3,

                      bgcolor:
                        alpha(
                          tipo.cor,
                          0.1,
                        ),

                      color:
                        tipo.cor,

                      '& svg': {
                        fontSize:
                          28,
                      },
                    }}
                  >
                    <TipoIcone />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color:
                          'text.secondary',

                        fontSize:
                          12.5,

                        fontWeight:
                          700,
                      }}
                    >
                      Recebida em{' '}
                      {formatDate(
                        solicitacao.criadoEm,
                      )}
                    </Typography>

                    <Typography
                      component="h2"
                      sx={{
                        mt: 0.3,

                        color:
                          'text.primary',

                        fontSize: {
                          xs: 22,
                          md: 26,
                        },

                        fontWeight:
                          900,
                      }}
                    >
                      {tipo.label}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    flexWrap:
                      'wrap',
                    gap: 1,
                  }}
                >
                  <Chip
                    label={
                      status.label
                    }
                    sx={{
                      height: 34,

                      bgcolor:
                        status.fundo,

                      color:
                        status.cor,

                      fontWeight:
                        900,
                    }}
                  />

                  <Chip
                    label="Site Pizzattolog"
                    variant="outlined"
                    sx={{
                      height: 34,

                      borderColor:
                        alpha(
                          '#17456B',
                          0.16,
                        ),

                      color:
                        '#17456B',

                      fontWeight:
                        800,
                    }}
                  />
                </Stack>
              </Stack>
            </Paper>

            {solicitacao.tipo ===
            'COTACAO' ? (
              <Alert
                severity="info"
                sx={{
                  borderRadius: 3,
                }}
              >
                Esta solicitação de cotação também foi registrada
                automaticamente como Lead no Comercial.
              </Alert>
            ) : null}

            {/* CONTATO + EMPRESA */}
            <Box
              sx={{
                display:
                  'grid',

                gridTemplateColumns:
                  {
                    xs: '1fr',
                    lg: 'repeat(2, minmax(0, 1fr))',
                  },

                gap: 3,
              }}
            >
              <SectionCard
                title="Dados do contato"
                description="Informações do solicitante"
                icon={
                  <PersonOutlineRoundedIcon />
                }
                color="#17456B"
              >
                <Box
                  sx={{
                    display:
                      'grid',

                    gridTemplateColumns:
                      {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                      },

                    gap: 1.5,
                  }}
                >
                  <DetailField
                    label="Nome"
                    value={
                      solicitacao.nome
                    }
                  />

                  <DetailField
                    label="E-mail"
                    value={
                      solicitacao.email
                    }
                  />

                  <DetailField
                    label="Telefone"
                    value={
                      solicitacao.telefone
                    }
                  />

                  <DetailField
                    label="Cargo"
                    value={
                      solicitacao.cargo
                    }
                  />
                </Box>
              </SectionCard>

              <SectionCard
                title="Empresa"
                description="Dados corporativos"
                icon={
                  <BusinessOutlinedIcon />
                }
                color="#ff5805"
              >
                <Box
                  sx={{
                    display:
                      'grid',

                    gridTemplateColumns:
                      {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                      },

                    gap: 1.5,
                  }}
                >
                  <DetailField
                    label="Empresa"
                    value={
                      solicitacao.empresa
                    }
                  />

                  <DetailField
                    label="CNPJ"
                    value={
                      solicitacao.cnpj
                    }
                  />

                  <DetailField
                    label="Solução"
                    value={
                      solicitacao.solucao
                    }
                  />

                  <DetailField
                    label="Departamento"
                    value={
                      solicitacao.departamento
                    }
                  />
                </Box>
              </SectionCard>
            </Box>

            {/* MENSAGEM */}
            <SectionCard
              title="Mensagem"
              description="Conteúdo enviado pelo formulário"
              icon={
                <DescriptionOutlinedIcon />
              }
              color="#7B61A8"
            >
              {solicitacao.assunto ? (
                <Box
                  sx={{
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        'text.secondary',
                      fontSize: 11,
                      fontWeight:
                        900,
                      textTransform:
                        'uppercase',
                    }}
                  >
                    Assunto
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      color:
                        'text.primary',
                      fontWeight:
                        800,
                    }}
                  >
                    {
                      solicitacao.assunto
                    }
                  </Typography>
                </Box>
              ) : null}

              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor:
                    '#F8F9FA',
                  border:
                    '1px solid',
                  borderColor:
                    alpha(
                      '#17212B',
                      0.06,
                    ),
                }}
              >
                <Typography
                  sx={{
                    whiteSpace:
                      'pre-wrap',

                    color:
                      solicitacao.mensagem
                        ? 'text.primary'
                        : 'text.secondary',

                    lineHeight:
                      1.75,

                    fontSize:
                      14.5,
                  }}
                >
                  {solicitacao.mensagem ||
                    'Nenhuma mensagem preenchida.'}
                </Typography>
              </Box>
            </SectionCard>

            {/* AGREGADO */}
            {showAgregadoFields ? (
              <SectionCard
                title="Dados do agregado"
                description="Informações do motorista e veículo"
                icon={
                  <LocalShippingRoundedIcon />
                }
                color="#ff5805"
              >
                <Box
                  sx={{
                    display:
                      'grid',

                    gridTemplateColumns:
                      {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        lg: 'repeat(3, minmax(0, 1fr))',
                      },

                    gap: 1.5,
                  }}
                >
                  <DetailField
                    label="Cidade"
                    value={
                      solicitacao.cidade
                    }
                  />

                  <DetailField
                    label="Categoria CNH"
                    value={
                      solicitacao.categoriaCnh
                    }
                  />

                  <DetailField
                    label="Possui MOPP"
                    value={formatBoolean(
                      solicitacao.possuiMopp,
                    )}
                  />

                  <DetailField
                    label="Possui EAR"
                    value={formatBoolean(
                      solicitacao.possuiEar,
                    )}
                  />

                  <DetailField
                    label="Marca do veículo"
                    value={
                      solicitacao.marcaVeiculo
                    }
                  />

                  <DetailField
                    label="Ano do veículo"
                    value={
                      solicitacao.anoVeiculo
                    }
                  />
                </Box>
              </SectionCard>
            ) : null}

            {/* ANEXOS */}
            {solicitacao.anexos
              ?.length ? (
              <SectionCard
                title="Documentos anexados"
                description={`${solicitacao.anexos.length} ${
                  solicitacao.anexos
                    .length === 1
                    ? 'arquivo'
                    : 'arquivos'
                }`}
                icon={
                  <AttachFileRoundedIcon />
                }
                color="#17456B"
              >
                <Stack spacing={1.5}>
                  {solicitacao.anexos.map(
                    (anexo) => (
                      <Paper
                        key={
                          anexo.id
                        }
                        elevation={0}
                        sx={{
                          p: 2,

                          borderRadius:
                            2.5,

                          border:
                            '1px solid',

                          borderColor:
                            alpha(
                              '#17212B',
                              0.08,
                            ),

                          bgcolor:
                            '#F9FAFB',
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
                                width:
                                  42,
                                height:
                                  42,

                                display:
                                  'grid',

                                placeItems:
                                  'center',

                                flexShrink:
                                  0,

                                borderRadius:
                                  2,

                                bgcolor:
                                  alpha(
                                    '#17456B',
                                    0.08,
                                  ),

                                color:
                                  '#17456B',
                              }}
                            >
                              <DescriptionOutlinedIcon />
                            </Box>

                            <Box
                              sx={{
                                minWidth:
                                  0,
                              }}
                            >
                              <Typography
                                sx={{
                                  color:
                                    'text.primary',

                                  fontSize:
                                    14,

                                  fontWeight:
                                    850,

                                  overflow:
                                    'hidden',

                                  textOverflow:
                                    'ellipsis',
                                }}
                              >
                                {anexo.nomeArquivoOriginal ||
                                  anexo.nomeArquivo}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.25,
                                  color:
                                    'text.secondary',
                                  fontSize:
                                    12,
                                }}
                              >
                                Documento anexado à solicitação
                              </Typography>
                            </Box>
                          </Stack>

                          <Button
                            type="button"
                            variant="outlined"
                            endIcon={
                              <OpenInNewRoundedIcon />
                            }
                            onClick={() =>
                              abrirAnexo(
                                anexo.id,
                              )
                            }
                            sx={{
                              minHeight:
                                38,

                              px: 2,

                              borderRadius:
                                2,

                              borderColor:
                                alpha(
                                  '#17456B',
                                  0.2,
                                ),

                              color:
                                '#17456B',

                              fontWeight:
                                850,

                              textTransform:
                                'none',

                              '&:hover':
                                {
                                  borderColor:
                                    '#ff5805',

                                  color:
                                    '#ff5805',

                                  bgcolor:
                                    alpha(
                                      '#ff5805',
                                      0.05,
                                    ),
                                },
                            }}
                          >
                            Visualizar
                          </Button>
                        </Stack>
                      </Paper>
                    ),
                  )}
                </Stack>
              </SectionCard>
            ) : null}

            {/* CONTROLE */}
            <SectionCard
              title="Controle e consentimentos"
              description="Informações administrativas da solicitação"
              icon={
                <VerifiedUserOutlinedIcon />
              }
              color="#2E7D32"
            >
              <Box
                sx={{
                  display:
                    'grid',

                  gridTemplateColumns:
                    {
                      xs: '1fr',
                      sm: 'repeat(2, minmax(0, 1fr))',
                    },

                  gap: 1.5,
                }}
              >
                <DetailField
                  label="Aceite de privacidade"
                  value={formatBoolean(
                    solicitacao.aceitePrivacidade,
                  )}
                />

                <DetailField
                  label="Aceite de comunicações"
                  value={formatBoolean(
                    solicitacao.aceiteComunicacoes,
                  )}
                />

                <DetailField
                  label="Atualizado em"
                  value={formatDate(
                    solicitacao.atualizadoEm,
                  )}
                />

                <DetailField
                  label="Observação interna"
                  value={
                    solicitacao.observacaoInterna
                  }
                />
              </Box>
            </SectionCard>
          </Stack>
        ) : null}
      </CrmPageShell>
    </AppLayout>
  );
}