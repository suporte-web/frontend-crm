'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ArrowLeft, Inbox } from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import {
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';
import { buscarSolicitacaoSitePorId } from '@/services/solicitacoes-site.service';
import type { SolicitacaoSite } from '@/types/solicitacao-site';

function formatDate(date?: string | null) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function formatBoolean(value?: boolean | null) {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';
  return '-';
}

function getTipoLabel(tipo?: string | null) {
  const labels: Record<string, string> = {
    AGREGADO: 'Agregado',
    FALE_CONOSCO: 'Fale conosco',
    COTACAO: 'Cotação',
  };

  return tipo ? labels[tipo] ?? tipo : '-';
}

function getStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    NOVO: 'Novo',
    EM_ATENDIMENTO: 'Em atendimento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
  };

  return status ? labels[status] ?? status : '-';
}

function getStatusColor(
  status?: string | null,
): 'warning' | 'success' | 'error' | 'default' {
  if (status === 'NOVO') return 'warning';
  if (status === 'CONCLUIDO') return 'success';
  if (status === 'CANCELADO') return 'error';
  return 'default';
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
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '10px',
        bgcolor: '#f8fafc',
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: 12,
          fontWeight: 800,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          color: 'text.primary',
          fontSize: 15,
          fontWeight: 800,
          overflowWrap: 'anywhere',
        }}
      >
        {value || '-'}
      </Typography>
    </Box>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
      }}
    >
      <Typography component="h2" sx={{ fontSize: 20, fontWeight: 900 }}>
        {title}
      </Typography>
      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

export default function SolicitacaoSiteDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [solicitacao, setSolicitacao] = useState<SolicitacaoSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSolicitacao() {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await buscarSolicitacaoSitePorId(id);
        setSolicitacao(response.solicitacao);
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

  const showAgregadoFields = useMemo(
    () =>
      solicitacao?.tipo === 'AGREGADO' ||
      Boolean(
        solicitacao?.cidade ||
          solicitacao?.categoriaCnh ||
          solicitacao?.marcaVeiculo ||
          solicitacao?.anoVeiculo,
      ),
    [solicitacao],
  );

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Marketing"
          title={solicitacao?.nome ?? 'Detalhe da solicitação'}
          description="Informações recebidas pelo formulário do site."
          icon={<Inbox size={24} />}
          aside={
            <Button
              component={Link}
              href="/solicitacoes-site"
              variant="outlined"
              startIcon={<ArrowLeft size={18} />}
              sx={{ borderRadius: '10px' }}
            >
              Voltar
            </Button>
          }
        />

        {loading ? (
          <Box sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : null}

        {!loading && error ? <Alert severity="error">{error}</Alert> : null}

        {!loading && !error && !solicitacao ? (
          <Alert severity="warning">Solicitação não encontrada.</Alert>
        ) : null}

        {!loading && solicitacao ? (
          <Stack spacing={3}>
            {solicitacao.tipo === 'COTACAO' ? (
              <Alert severity="info">
                Solicitações de cotação são registradas automaticamente em
                Leads, no Comercial.
              </Alert>
            ) : null}

            <CrmSection sx={{ p: { xs: 2, md: 3 } }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                    Recebida em {formatDate(solicitacao.criadoEm)}
                  </Typography>
                  <Typography component="h2" sx={{ mt: 0.5, fontSize: 24, fontWeight: 900 }}>
                    {getTipoLabel(solicitacao.tipo)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Chip
                    label={getStatusLabel(solicitacao.status)}
                    color={getStatusColor(solicitacao.status)}
                    sx={{ fontWeight: 800 }}
                  />
                  <Chip
                    label={solicitacao.origem}
                    sx={{
                      bgcolor: '#fff7d6',
                      color: crmPalette.text,
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              </Stack>
            </CrmSection>

            <DetailSection title="Contato">
              <DetailField label="Nome" value={solicitacao.nome} />
              <DetailField label="E-mail" value={solicitacao.email} />
              <DetailField label="Telefone" value={solicitacao.telefone} />
              <DetailField label="Cargo" value={solicitacao.cargo} />
            </DetailSection>

            <DetailSection title="Empresa">
              <DetailField label="Empresa" value={solicitacao.empresa} />
              <DetailField label="CNPJ" value={solicitacao.cnpj} />
              <DetailField label="Solução" value={solicitacao.solucao} />
              <DetailField label="Departamento" value={solicitacao.departamento} />
            </DetailSection>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '14px',
              }}
            >
              <Typography component="h2" sx={{ fontSize: 20, fontWeight: 900 }}>
                Mensagem
              </Typography>
              <DetailField label="Assunto" value={solicitacao.assunto} />
              <Divider sx={{ my: 2 }} />
              <Typography
                sx={{
                  whiteSpace: 'pre-wrap',
                  color: solicitacao.mensagem ? 'text.primary' : 'text.secondary',
                  lineHeight: 1.7,
                }}
              >
                {solicitacao.mensagem || 'Nenhuma mensagem preenchida.'}
              </Typography>
            </Paper>

            {showAgregadoFields ? (
              <DetailSection title="Dados para agregado">
                <DetailField label="Cidade" value={solicitacao.cidade} />
                <DetailField label="Categoria CNH" value={solicitacao.categoriaCnh} />
                <DetailField label="Possui MOPP" value={formatBoolean(solicitacao.possuiMopp)} />
                <DetailField label="Possui EAR" value={formatBoolean(solicitacao.possuiEar)} />
                <DetailField label="Marca do veículo" value={solicitacao.marcaVeiculo} />
                <DetailField label="Ano do veículo" value={solicitacao.anoVeiculo} />
              </DetailSection>
            ) : null}

            <DetailSection title="Consentimentos e controle">
              <DetailField
                label="Aceite de privacidade"
                value={formatBoolean(solicitacao.aceitePrivacidade)}
              />
              <DetailField
                label="Aceite de comunicações"
                value={formatBoolean(solicitacao.aceiteComunicacoes)}
              />
              <DetailField label="Atualizado em" value={formatDate(solicitacao.atualizadoEm)} />
              <DetailField label="Observação interna" value={solicitacao.observacaoInterna} />
            </DetailSection>

            {solicitacao.anexos?.length ? (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 3 },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '14px',
                }}
              >
                <Typography component="h2" sx={{ fontSize: 20, fontWeight: 900 }}>
                  Anexos
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {solicitacao.anexos.map((anexo) => (
                    <Button
                      key={anexo.id}
                      href={anexo.url}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      sx={{
                        alignSelf: 'flex-start',
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 800,
                      }}
                    >
                      {anexo.nomeArquivoOriginal || anexo.nomeArquivo}
                    </Button>
                  ))}
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        ) : null}
      </CrmPageShell>
    </AppLayout>
  );
}
