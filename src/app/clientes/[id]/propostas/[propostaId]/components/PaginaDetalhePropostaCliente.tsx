"use client";

import { coresSituacaoOportunidade, marcadorEtapaOportunidadeSx, acaoPrincipalOportunidadeSx, acaoSecundariaOportunidadeSx, campoOportunidadeSx, formularioOportunidadeSx, superficieOportunidadeSx } from '@/components/crm/estilos-oportunidades';
import { formatarValorOportunidade, origemValorOportunidade } from '@/lib/valor-oportunidade';
import { hasAnyRole } from "@/lib/user-roles";
import { validarDocumentosOportunidade } from "@/lib/opportunity-documents";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";


import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

import {
  ArrowLeft,
  FileText,
  PlusCircle,
  Trash2,
} from "lucide-react";


import { AppLayout } from "@/components/layout/app-layout";
import {
  CrmPageShell,
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { CamposPerdaOportunidade, DetalhesPerdaOportunidade } from '@/components/crm/campos-perda-oportunidade';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useAuth } from "@/context/auth-context";
import { API_BASE_URL } from "@/services/api";
import {
  excluirDocumentoPropostaOportunidade,
  formatarEtapaOportunidade,
  formatOpportunityStatus,
  getCrmLeadById,
  updateOpportunityStatus,
  enviarDocumentosPropostaOportunidade,
} from "@/services/crm.service";
import type { ClientDocument, LeadDetail, OpportunityStatus } from "@/types/crm";

import {
  OPPORTUNITY_PROPOSAL_DOCUMENT_CATEGORY,
  formatarData,
  secondaryButtonSx,
} from "../../../components/detalhes-cliente/detalhes-cliente-compartilhado";

const marcadorAnexoProposta = (opportunityId: string) =>
  `oportunidade:${opportunityId}`;

const OPPORTUNITY_STATUS_VISUAL = {
  OPEN: { label: 'Aberta', ...coresSituacaoOportunidade.OPEN },
  WON: { label: 'Ganha', ...coresSituacaoOportunidade.WON },
  LOST: { label: 'Perdida', ...coresSituacaoOportunidade.LOST },
};


function parseInformacoesProposta(notes?: string | null) {
  return (notes ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return {
          label: "Informação",
          value: line,
        };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim() || "-",
      };
    });
}

export default function PaginaDetalhePropostaCliente({
  clientIdParam,
  proposalIdParam,
}: {
  clientIdParam: string;
  proposalIdParam: string;
}) {


  const { token, user } = useAuth();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [erroAnexo, setErroAnexo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [lossOpen,setLossOpen] = useState(false);
  const [erroPerda,setErroPerda] = useState('');
  const [lossCode,setLossCode] = useState('');
  const [lossNotes,setLossNotes] = useState('');
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const clientId = clientIdParam;
  const proposalId = proposalIdParam;

  const canEditCommercialData = user?.role
    ? hasAnyRole(user, ["ADMIN", "GESTAO", "COMERCIAL", "CONSULTORA"])
    : false;

  const opportunity = useMemo(
    () => lead?.opportunities?.find((item) => item.id === proposalId) ?? null,
    [lead?.opportunities, proposalId],
  );

  const proposalDocuments = useMemo(
    () =>
      lead?.documents?.filter(
        (document) =>
          document.category === OPPORTUNITY_PROPOSAL_DOCUMENT_CATEGORY &&
          document.description?.includes(marcadorAnexoProposta(proposalId)),
      ) ?? [],
    [lead?.documents, proposalId],
  );

  const parsedDetails = useMemo(
    () => parseInformacoesProposta(opportunity?.preContractNotes),
    [opportunity?.preContractNotes],
  );

  const statusVisual = opportunity
    ? OPPORTUNITY_STATUS_VISUAL[opportunity.status]
    : OPPORTUNITY_STATUS_VISUAL.OPEN;

  async function reloadClient(nextClientId = clientId) {
    if (!token || !nextClientId) {
      return;
    }

    const nextLead = await getCrmLeadById(nextClientId, token, canEditCommercialData);
    setLead(nextLead);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const nextLead = await getCrmLeadById(clientIdParam, token, canEditCommercialData);

        if (!active) {
          return;
        }

        setLead(nextLead);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Erro ao carregar a proposta.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [clientIdParam, token, canEditCommercialData]);

  async function handleUploadDocuments() {
    if (!token || !clientId || !proposalId || selectedFiles.length === 0) {
      return;
    }

    try {
      setUploading(true);
      await enviarDocumentosPropostaOportunidade(
        clientId,
        selectedFiles,
        token,
        `Oportunidade/Proposta | ${marcadorAnexoProposta(proposalId)}`,
      );
      setSelectedFiles([]);
      await reloadClient();
      setToast({
        title: "Anexos enviados",
        message:
          selectedFiles.length === 1
            ? "Arquivo anexado à proposta."
            : `${selectedFiles.length} arquivos anexados à proposta.`,
        variant: "success",
      });
    } catch (uploadError) {
      setToast({
        title: "Falha ao anexar",
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "Erro ao anexar arquivo.",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenDocument(document: ClientDocument) {
    if (!token || !clientId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/clients/${clientId}/documents/${document.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || data?.error || "Erro ao abrir anexo.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = url;
      link.download = document.originalName || document.fileName;
      link.rel = "noreferrer";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (openError) {
      setToast({
        title: "Falha ao abrir anexo",
        message:
          openError instanceof Error
            ? openError.message
            : "Erro ao abrir anexo.",
        variant: "error",
      });
    }
  }

  async function handleDeleteDocument(document: ClientDocument) {
    if (!token || !clientId) {
      return;
    }

    const justification = window.prompt(
      "Informe a justificativa para excluir este anexo:",
      "Anexo removido da proposta.",
    );

    if (justification === null) {
      return;
    }

    if (!justification.trim()) {
      setToast({
        title: "Justificativa obrigatória",
        message: "Informe a justificativa para excluir o anexo.",
        variant: "error",
      });
      return;
    }

    try {
      setDeletingDocumentId(document.id);
      await excluirDocumentoPropostaOportunidade(
        clientId,
        document.id,
        token,
        justification,
      );
      await reloadClient();
      setToast({
        title: "Anexo excluído",
        message: "O anexo foi removido da proposta.",
        variant: "success",
      });
    } catch (deleteError) {
      setToast({
        title: "Falha ao excluir anexo",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Erro ao excluir anexo.",
        variant: "error",
      });
    } finally {
      setDeletingDocumentId(null);
    }
  }

  async function handleChangeOpportunityStatus(
    nextStatus: OpportunityStatus,
    confirmLoss = false,
  ) {
    if (!token || !clientId || !proposalId) {
      return;
    }

    if (savingStatus) return;
    if (nextStatus === 'LOST' && !confirmLoss) {
      setLossCode(opportunity?.motivoPerda || '');
      setLossNotes(opportunity?.observacaoPerda || '');
      setErroPerda('');
      setLossOpen(true);
      return;
    }
    try {
      setSavingStatus(true);

      await updateOpportunityStatus(
        clientId,
        proposalId,
        nextStatus,
        token,
        { motivoPerda: lossCode, observacaoPerda: lossNotes },
      );
      setLossOpen(false);

      await reloadClient();

      setToast({
        title: "Status atualizado",
        message: `A oportunidade foi marcada como ${formatOpportunityStatus(
          nextStatus,
        ).toLowerCase()}.`,
        variant: "success",
      });
    } catch (statusError) {
      if (nextStatus === 'LOST') setErroPerda(statusError instanceof Error ? statusError.message : 'Não foi possível registrar a perda.');
      setToast({
        title: "Falha ao atualizar",
        message:
          statusError instanceof Error
            ? statusError.message
            : "Erro ao atualizar o status da oportunidade.",
        variant: "error",
      });
    } finally {
      setSavingStatus(false);
    }
  }



    return (
    <AppLayout>
      <Dialog
        open={lossOpen}
        onClose={() => { if (!savingStatus) setLossOpen(false); }}
        fullWidth maxWidth="sm" aria-labelledby="titulo-perda-proposta"
        slotProps={{ paper: { sx: { borderRadius: '12px', m: { xs: 1.5, sm: 4 }, width: { xs: 'calc(100% - 24px)', sm: '100%' } } } }}
      >
        <Box component="form" onSubmit={event => { event.preventDefault(); void handleChangeOpportunityStatus('LOST', true); }}>
          <DialogTitle id="titulo-perda-proposta" sx={{ px: 2.5, py: 2, fontSize: 17, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Registrar perda da oportunidade</DialogTitle>
          <DialogContent sx={{ ...formularioOportunidadeSx, px: 2.5, pb: 2.5, pt: '24px !important' }}>
            {erroPerda && <Alert severity="error" sx={{ mb: 2 }}>{erroPerda}</Alert>}
            <CamposPerdaOportunidade codigo={lossCode} notes={lossNotes} onChange={(code, notes) => { setLossCode(code); setLossNotes(notes); }} disabled={savingStatus} />
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 2, gap: 1, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <Button disabled={savingStatus} onClick={() => setLossOpen(false)} sx={acaoSecundariaOportunidadeSx}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={savingStatus} sx={acaoPrincipalOportunidadeSx} startIcon={savingStatus ? <CircularProgress size={15} color="inherit" /> : undefined}>{savingStatus ? 'Salvando...' : 'Salvar perda'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
      <CrmPageShell sx={{ minWidth: 0, gap: 2, containerType: 'inline-size', containerName: 'detalhe-proposta' }}>
        <Button component={Link} href={`/oportunidades/cadastro/${clientId}`} variant="outlined" startIcon={<ArrowLeft size={16} />} sx={{ ...acaoSecundariaOportunidadeSx, width: 'fit-content', bgcolor: '#f8fafc' }}>Voltar para propostas</Button>

        {loading ? (
          <CrmSection sx={superficieOportunidadeSx}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 2 }}>
              <CircularProgress size={22} sx={{ color: '#ff5805' }} />
              <Typography sx={{ color: crmPalette.muted, fontSize: 13 }}>Carregando proposta...</Typography>
            </Stack>
          </CrmSection>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>
        ) : !lead || !opportunity ? (
          <Alert severity="warning" sx={{ borderRadius: '10px' }}>Proposta não encontrada.</Alert>
        ) : (
          <>
            <CrmSection sx={superficieOportunidadeSx}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, '@container detalhe-proposta (max-width: 680px)': { flexDirection: 'column', alignItems: 'stretch' } }}>
                <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 42, height: 42, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '10px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc', color: '#64748b' }}><FileText size={21} /></Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 11, color: '#64748b', mb: .5 }}>Detalhes da proposta</Typography>
                    <Typography component="h2" sx={{ color: '#1f2937', fontSize: { xs: 22, md: 25 }, fontWeight: 600, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{opportunity.title}</Typography>
                    <Typography sx={{ fontSize: 13, color: '#64748b', mt: .75, overflowWrap: 'anywhere' }}>{lead.company}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={.75} useFlexGap sx={{ flexWrap: 'wrap', flexShrink: 0 }}>
                  <Chip label={formatarEtapaOportunidade(opportunity.stage)} size="small" sx={{ height: 25, borderRadius: '6px', fontSize: 11.5, fontWeight: 500, ...marcadorEtapaOportunidadeSx(opportunity.stage) }} />
                  <Chip label={statusVisual.label} size="small" sx={{ height: 25, borderRadius: '6px', bgcolor: statusVisual.background, color: statusVisual.color, fontSize: 11.5, fontWeight: 500 }} />
                </Stack>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr)) minmax(180px,1.2fr)', gap: 2, mt: 2, pt: 2, borderTop: '1px solid #e2e8f0', '@container detalhe-proposta (max-width: 1000px)': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))', '& > :last-child': { gridColumn: '1 / -1' } } }}>
                {[
                  { label: 'Criada em', value: formatarData(opportunity.createdAt) },
                  { label: 'Atualizada em', value: formatarData(opportunity.updatedAt) },
                  { label: 'Anexos', value: `${proposalDocuments.length} arquivo${proposalDocuments.length === 1 ? '' : 's'}` },
                  { label: origemValorOportunidade(opportunity), value: formatarValorOportunidade(opportunity) },
                ].map(item => <Box key={item.label} sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: '#64748b', fontSize: 12, mb: .75 }}>{item.label}</Typography>
                  <Typography sx={{ color: '#334155', fontSize: 13.5, fontWeight: 500, overflowWrap: 'anywhere' }}>{item.value}</Typography>
                </Box>)}
                <Box sx={{ minWidth: 0 }}>
                  {canEditCommercialData ? (
                    <TextField select fullWidth size="small" label="Status da oportunidade" value={opportunity.status} disabled={savingStatus} onChange={(event) => handleChangeOpportunityStatus(event.target.value as OpportunityStatus)} sx={[campoOportunidadeSx, {
                      '& .MuiOutlinedInput-root': { bgcolor: statusVisual.background, color: statusVisual.color, '& fieldset': { borderColor: statusVisual.border }, '&:hover fieldset': { borderColor: statusVisual.color } },
                      '& .MuiSelect-icon': { color: statusVisual.color },
                    }]}>
                      <MenuItem value="OPEN" sx={{ color: coresSituacaoOportunidade.OPEN.color }}>Aberta</MenuItem>
                      <MenuItem value="WON" sx={{ color: coresSituacaoOportunidade.WON.color }}>Ganha</MenuItem>
                      <MenuItem value="LOST" sx={{ color: coresSituacaoOportunidade.LOST.color }}>Perdida</MenuItem>
                    </TextField>
                  ) : <>
                    <Typography sx={{ color: '#64748b', fontSize: 12, mb: .75 }}>Status da oportunidade</Typography>
                    <Typography sx={{ color: statusVisual.color, fontSize: 13.5, fontWeight: 500 }}>{formatOpportunityStatus(opportunity.status)}</Typography>
                  </>}
                </Box>
              </Box>
              {opportunity.status === 'LOST' && (
                <Box sx={{ mt: 2, pt: .5, borderTop: '1px solid #e2e8f0' }}>
                  <DetalhesPerdaOportunidade opportunity={opportunity} />
                  {canEditCommercialData && <Button variant="outlined" disabled={savingStatus} onClick={() => handleChangeOpportunityStatus('LOST')} sx={{ ...acaoSecundariaOportunidadeSx, mt: 1.5 }}>Editar motivo da perda</Button>}
                </Box>
              )}
            </CrmSection>

            <CrmSection sx={superficieOportunidadeSx}>
              <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="h2" sx={{ color: '#1f2937', fontSize: 16, fontWeight: 600 }}>Informações da proposta</Typography>
                  <Typography sx={{ mt: .5, color: '#64748b', fontSize: 12 }}>Dados comerciais e operacionais registrados.</Typography>
                </Box>
                <Chip label={`${parsedDetails.length} ${parsedDetails.length === 1 ? 'informação' : 'informações'}`} size="small" sx={{ flexShrink: 0, borderRadius: '6px', bgcolor: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 500 }} />
              </Stack>
              {parsedDetails.length > 0 ? (
                <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', columnGap: 3, rowGap: 2.5, pt: 2, borderTop: '1px solid #e2e8f0', '@container detalhe-proposta (max-width: 680px)': { gridTemplateColumns: 'minmax(0,1fr)' } }}>
                  {parsedDetails.map((detail, index) => <Box key={`${detail.label}-${index}`} sx={{ minWidth: 0 }}>
                    <Typography component="dt" sx={{ color: '#64748b', fontSize: 12, mb: .75 }}>{detail.label}</Typography>
                    <Typography component="dd" sx={{ m: 0, color: '#334155', fontSize: 13.5, fontWeight: 500, lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.value}</Typography>
                  </Box>)}
                </Box>
              ) : <Box sx={{ py: 2 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: '#334155' }}>Nenhuma informação cadastrada</Typography>
                <Typography sx={{ mt: .5, fontSize: 12, color: '#64748b' }}>Os dados comerciais e operacionais aparecerão aqui.</Typography>
              </Box>}
            </CrmSection>

            <CrmSection sx={{ ...superficieOportunidadeSx, ...formularioOportunidadeSx, "& .MuiChip-root": { maxWidth: "100%" } }}>
                <Stack spacing={1.5}>
                  <Stack
                    direction="column"
                    spacing={1.5}
                    sx={{
                      alignItems: "stretch",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color: crmPalette.text,
                          fontSize: 16,
                          fontWeight: 500,
                        }}
                      >
                        Anexos
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.35,
                          color: crmPalette.muted,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        Até 20 arquivos por envio, com até 20 MB cada. Planilhas .xlsm são aceitas.
                      </Typography>
                    </Box>

                    {canEditCommercialData ? (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ alignItems: { xs: "stretch", sm: "center" } }}
                      >
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<FileText size={15} />}
                          disabled={uploading}
                          sx={secondaryButtonSx}
                        >
                          Selecionar arquivos
                          <Box
                            component="input"
                            type="file"
                            multiple
                            onChange={(
                              event: React.ChangeEvent<HTMLInputElement>,
                            ) => {
                              const selecionados = Array.from(event.target.files ?? []);
                              const erro = validarDocumentosOportunidade(selecionados);
                              setErroAnexo(erro);
                              event.target.value = "";
                              if (erro) return;
                              setSelectedFiles(selecionados);
                            }}
                            sx={{
                              position: "absolute",
                              width: 1,
                              height: 1,
                              p: 0,
                              m: -1,
                              overflow: "hidden",
                              clip: "rect(0 0 0 0)",
                              whiteSpace: "nowrap",
                              border: 0,
                            }}
                          />
                        </Button>

                        <Button
                          type="button"
                          variant="contained"
                          disabled={uploading || selectedFiles.length === 0}
                          startIcon={
                            uploading ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <PlusCircle size={15} />
                            )
                          }
                          onClick={handleUploadDocuments}
                          sx={{
                            minHeight: 40,
                            borderRadius: "10px",
                            bgcolor: crmPalette.orange,
                            fontSize: 13,
                            fontWeight: 500,
                            textTransform: "none",
                            boxShadow: "none",
                            "&:hover": {
                              bgcolor: crmPalette.orangeDark,
                              boxShadow: "none",
                            },
                          }}
                        >
                          {uploading ? "Anexando..." : "Anexar"}
                        </Button>
                      </Stack>
                    ) : null}
                  </Stack>

                  {erroAnexo && <Alert severity="error">{erroAnexo}</Alert>}
                  {selectedFiles.length > 0 ? (
                    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
                      {selectedFiles.map((file) => (
                        <Chip
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          label={file.name}
                          onDelete={() =>
                            setSelectedFiles((current) =>
                              current.filter(
                                (currentFile) =>
                                  !(
                                    currentFile.name === file.name &&
                                    currentFile.size === file.size &&
                                    currentFile.lastModified ===
                                    file.lastModified
                                  ),
                              ),
                            )
                          }
                          sx={{
                            borderRadius: "8px",
                            bgcolor: "#fff7ed",
                            color: crmPalette.orangeDark,
                            fontWeight: 500,
                          }}
                        />
                      ))}
                    </Stack>
                  ) : null}

                  {proposalDocuments.length > 0 ? (
                    <Stack spacing={1}>
                      {proposalDocuments.map((document) => (
                        <Paper
                          key={document.id}
                          variant="outlined"
                          sx={{
                            p: 1.4,
                            borderRadius: "10px",
                            borderColor: crmPalette.border,
                            bgcolor: "#ffffff",
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{
                              alignItems: { xs: "stretch", sm: "center" },
                              justifyContent: "space-between",
                            }}
                          >
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                              <FileText size={18} color={crmPalette.orangeDark} />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    color: crmPalette.text,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {document.originalName}
                                </Typography>
                                <Typography
                                  sx={{
                                    mt: 0.3,
                                    color: crmPalette.muted,
                                    fontSize: 12,
                                    fontWeight: 500,
                                  }}
                                >
                                  {formatarData(document.createdAt)}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack direction="row" spacing={0.75} sx={{ justifyContent: "flex-end" }}>
                              <Button
                                type="button"
                                variant="outlined"
                                onClick={() => handleOpenDocument(document)}
                                sx={secondaryButtonSx}
                              >
                                Abrir
                              </Button>

                              {canEditCommercialData ? (
                                <IconButton
                                  type="button"
                                  aria-label={`Excluir ${document.originalName}`}
                                  title="Excluir anexo"
                                  disabled={deletingDocumentId === document.id}
                                  onClick={() => handleDeleteDocument(document)}
                                  sx={{
                                    width: 38,
                                    height: 38,
                                    color: "#b91c1c",
                                    bgcolor: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    "&:hover": { bgcolor: "#fee2e2" },
                                  }}
                                >
                                  {deletingDocumentId === document.id ? (
                                    <CircularProgress size={15} color="inherit" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </IconButton>
                              ) : null}
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: "12px" }}>
                      Nenhum anexo vinculado a esta proposta.
                    </Alert>
                  )}
                </Stack>
              </CrmSection>
          </>
        )}
      </CrmPageShell>
      <FeedbackToast open={Boolean(toast)} title={toast?.title ?? ''} message={toast?.message ?? ''} variant={toast?.variant ?? 'success'} onClose={() => setToast(null)} />
    </AppLayout>
  );

}
