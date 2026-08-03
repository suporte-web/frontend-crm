"use client";

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
import Divider from "@mui/material/Divider";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  Paperclip,
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
import { useAuth } from "@/context/auth-context";
import { API_BASE_URL } from "@/services/api";
import {
  deleteOpportunityProposalDocument,
  formatOpportunityStage,
  formatOpportunityStatus,
  getCrmLeadById,
  updateOpportunityStatus,
  uploadOpportunityProposalDocuments,
} from "@/services/crm.service";
import type { ClientDocument, LeadDetail, OpportunityStatus } from "@/types/crm";

import {
  OPPORTUNITY_PROPOSAL_DOCUMENT_CATEGORY,
  formatarData,
  secondaryButtonSx,
} from "../../../components/detalhes-cliente/detalhes-cliente-compartilhado";

const marcadorAnexoProposta = (opportunityId: string) =>
  `oportunidade:${opportunityId}`;

const OPPORTUNITY_STATUS_VISUAL: Record<
  OpportunityStatus,
  {
    label: string;
    background: string;
    color: string;
    border: string;
  }
> = {
  OPEN: {
    label: "Aberta",
    background: "#fff7ed",
    color: "#c2410c",
    border: "#fed7aa",
  },

  WON: {
    label: "Ganha",
    background: "#f0fdf4",
    color: "#15803d",
    border: "#bbf7d0",
  },

  LOST: {
    label: "Perdida",
    background: "#fef2f2",
    color: "#b91c1c",
    border: "#fecaca",
  },
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
  const [uploading, setUploading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
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
    ? ["ADMIN", "GESTAO", "COMERCIAL"].includes(user.role)
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

    const nextLead = await getCrmLeadById(nextClientId, token);
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

        const nextLead = await getCrmLeadById(clientIdParam, token);

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
  }, [clientIdParam, token]);

  async function handleUploadDocuments() {
    if (!token || !clientId || !proposalId || selectedFiles.length === 0) {
      return;
    }

    try {
      setUploading(true);
      await uploadOpportunityProposalDocuments(
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
      await deleteOpportunityProposalDocument(
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
  ) {
    if (!token || !clientId || !proposalId) {
      return;
    }

    try {
      setSavingStatus(true);

      await updateOpportunityStatus(
        clientId,
        proposalId,
        nextStatus,
        token,
      );

      await reloadClient();

      setToast({
        title: "Status atualizado",
        message: `A oportunidade foi marcada como ${formatOpportunityStatus(
          nextStatus,
        ).toLowerCase()}.`,
        variant: "success",
      });
    } catch (statusError) {
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
        <CrmPageShell>
          <Stack spacing={2.5}>
            <Button
              component={Link}
              href={`/clientes/${clientId}?aba=propostas`}
              variant="outlined"
              startIcon={<ArrowLeft size={16} />}
              sx={{
                ...secondaryButtonSx,
                width: "fit-content",
                minHeight: 34,
                px: 1.6,
                borderRadius: "999px",
                fontSize: 12,
              }}
            >
              Voltar para propostas
            </Button>

            {loading ? (
              <CrmSection sx={{ p: 4 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <CircularProgress size={22} sx={{ color: crmPalette.orange }} />
                  <Typography sx={{ color: crmPalette.muted, fontWeight: 700 }}>
                    Carregando proposta...
                  </Typography>
                </Stack>
              </CrmSection>
            ) : error ? (
              <Alert severity="error" sx={{ borderRadius: "12px" }}>
                {error}
              </Alert>
            ) : !lead || !opportunity ? (
              <Alert severity="warning" sx={{ borderRadius: "12px" }}>
                Proposta não encontrada.
              </Alert>
            ) : (
              <>
                <CrmSection
                  sx={{
                    p: 0,
                    overflow: "hidden",
                  }}
                >
                  {/* Faixa superior que muda de cor conforme o status */}
                  <Box
                    sx={{
                      height: 5,
                      bgcolor: statusVisual.color,
                    }}
                  />

                  <Box
                    sx={{
                      p: {
                        xs: 2.5,
                        md: 3,
                      },
                    }}
                  >
                    <Stack spacing={2}>
                      {/* Cabeçalho principal */}
                      <Stack
                        direction={{
                          xs: "column",
                          md: "row",
                        }}
                        spacing={2}
                        sx={{
                          alignItems: {
                            xs: "stretch",
                            md: "center",
                          },
                          justifyContent: "space-between",
                        }}
                      >
                        {/* Título e cliente */}
                        <Stack
                          direction="row"
                          spacing={1.5}
                          sx={{
                            alignItems: "flex-start",
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                              borderRadius: "14px",
                              bgcolor: statusVisual.background,
                              color: statusVisual.color,
                              border: `1px solid ${statusVisual.border}`,
                            }}
                          >
                            <FileText size={23} />
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                color: crmPalette.orangeDark,
                                fontSize: 11,
                                fontWeight: 900,
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                              }}
                            >
                              Detalhes da proposta
                            </Typography>

                            <Typography
                              component="h1"
                              sx={{
                                mt: 0.4,
                                color: crmPalette.text,
                                fontSize: {
                                  xs: 21,
                                  md: 27,
                                },
                                fontWeight: 950,
                                lineHeight: 1.2,
                                overflowWrap: "anywhere",
                              }}
                            >
                              {opportunity.title}
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={0.75}
                              sx={{
                                mt: 0.8,
                                alignItems: "center",
                              }}
                            >
                              <Building2
                                size={15}
                                color={crmPalette.muted}
                              />

                              <Typography
                                sx={{
                                  color: crmPalette.muted,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {lead.company}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>

                        {/* Chips de etapa e status */}
                        <Stack
                          direction="row"
                          spacing={0.8}
                          useFlexGap
                          sx={{
                            flexWrap: "wrap",
                            justifyContent: {
                              xs: "flex-start",
                              md: "flex-end",
                            },
                          }}
                        >
                          <Chip
                            label={formatOpportunityStage(opportunity.stage)}
                            sx={{
                              height: 32,
                              borderRadius: "9px",
                              bgcolor: "#fff7ed",
                              color: crmPalette.orangeDark,
                              border: "1px solid #fed7aa",
                              fontSize: 12,
                              fontWeight: 900,
                            }}
                          />

                          <Chip
                            label={statusVisual.label}
                            sx={{
                              height: 32,
                              borderRadius: "9px",
                              bgcolor: statusVisual.background,
                              color: statusVisual.color,
                              border: `1px solid ${statusVisual.border}`,
                              fontSize: 12,
                              fontWeight: 900,
                            }}
                          />
                        </Stack>
                      </Stack>

                      <Divider sx={{ borderColor: crmPalette.border }} />

                      {/* Cards de resumo */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            xl: "repeat(4, minmax(0, 1fr))",
                          },
                          gap: 1.25,
                        }}
                      >
                        {[
                          {
                            label: "Criada em",
                            value: formatarData(opportunity.createdAt),
                            icon: <CalendarDays size={17} />,
                          },
                          {
                            label: "Atualizada em",
                            value: formatarData(opportunity.updatedAt),
                            icon: <Clock3 size={17} />,
                          },
                          {
                            label: "Anexos",
                            value: `${proposalDocuments.length} arquivo${proposalDocuments.length === 1 ? "" : "s"
                              }`,
                            icon: <Paperclip size={17} />,
                          },
                        ].map((item) => (
                          <Paper
                            key={item.label}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              minHeight: 84,
                              display: "flex",
                              alignItems: "center",
                              gap: 1.2,
                              borderRadius: "12px",
                              borderColor: crmPalette.border,
                              bgcolor: "#f8fafc",
                              boxShadow: "none",
                            }}
                          >
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                                borderRadius: "10px",
                                bgcolor: "#ffffff",
                                color: crmPalette.orangeDark,
                                border: `1px solid ${crmPalette.border}`,
                              }}
                            >
                              {item.icon}
                            </Box>

                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  color: crmPalette.muted,
                                  fontSize: 10.5,
                                  fontWeight: 900,
                                  letterSpacing: 0.4,
                                  textTransform: "uppercase",
                                }}
                              >
                                {item.label}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.4,
                                  color: crmPalette.text,
                                  fontSize: 13.5,
                                  fontWeight: 900,
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {item.value}
                              </Typography>
                            </Box>
                          </Paper>
                        ))}

                        {/* Card de status editável */}
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            minHeight: 84,
                            borderRadius: "12px",
                            borderColor: statusVisual.border,
                            bgcolor: statusVisual.background,
                            boxShadow: "none",
                          }}
                        >
                          <Typography
                            sx={{
                              mb: 0.75,
                              color: statusVisual.color,
                              fontSize: 10.5,
                              fontWeight: 900,
                              letterSpacing: 0.4,
                              textTransform: "uppercase",
                            }}
                          >
                            Status da oportunidade
                          </Typography>

                          {canEditCommercialData ? (
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={opportunity.status}
                              disabled={savingStatus}
                              onChange={(event) =>
                                handleChangeOpportunityStatus(
                                  event.target.value as OpportunityStatus,
                                )
                              }
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  minHeight: 38,
                                  borderRadius: "9px",
                                  bgcolor: "#ffffff",

                                  "& fieldset": {
                                    borderColor: statusVisual.border,
                                  },

                                  "&:hover fieldset": {
                                    borderColor: statusVisual.color,
                                  },
                                },

                                "& .MuiSelect-select": {
                                  py: 1,
                                  color: statusVisual.color,
                                  fontSize: 13,
                                  fontWeight: 900,
                                },
                              }}
                            >
                              <MenuItem value="OPEN">
                                Aberta
                              </MenuItem>

                              <MenuItem value="WON">
                                Ganha
                              </MenuItem>

                              <MenuItem value="LOST">
                                Perdida
                              </MenuItem>
                            </TextField>
                          ) : (
                            <Typography
                              sx={{
                                mt: 1,
                                color: statusVisual.color,
                                fontSize: 14,
                                fontWeight: 900,
                              }}
                            >
                              {formatOpportunityStatus(opportunity.status)}
                            </Typography>
                          )}
                        </Paper>
                      </Box>
                    </Stack>
                  </Box>
                </CrmSection>

                <CrmSection
                  sx={{
                    p: {
                      xs: 2.5,
                      md: 3,
                    },
                  }}
                >
                  <Stack spacing={2}>
                    {/* Cabeçalho da seção */}
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1.5}
                      sx={{
                        alignItems: {
                          xs: "stretch",
                          sm: "center",
                        },
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.2}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            borderRadius: "11px",
                            bgcolor: "#fff7ed",
                            color: crmPalette.orangeDark,
                            border: "1px solid #fed7aa",
                          }}
                        >
                          <FileText size={18} />
                        </Box>

                        <Box>
                          <Typography
                            sx={{
                              color: crmPalette.text,
                              fontSize: 16,
                              fontWeight: 900,
                              lineHeight: 1.25,
                            }}
                          >
                            Informações da proposta
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.25,
                              color: crmPalette.muted,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Dados comerciais e operacionais registrados.
                          </Typography>
                        </Box>
                      </Stack>

                      <Chip
                        label={`${parsedDetails.length} ${parsedDetails.length === 1 ? "informação" : "informações"
                          }`}
                        size="small"
                        sx={{
                          width: "fit-content",
                          borderRadius: "8px",
                          bgcolor: "#f1f5f9",
                          color: "#475569",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      />
                    </Stack>

                    {parsedDetails.length > 0 ? (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(2, minmax(0, 1fr))",
                          },
                          gap: 1.25,
                        }}
                      >
                        {parsedDetails.map((detail, index) => (
                          <Paper
                            key={`${detail.label}-${index}`}
                            variant="outlined"
                            sx={{
                              position: "relative",
                              p: 1.6,
                              minHeight: 90,
                              overflow: "hidden",
                              borderRadius: "12px",
                              borderColor: crmPalette.border,
                              bgcolor: "#ffffff",
                              boxShadow: "none",
                              transition:
                                "border-color 160ms ease, background-color 160ms ease, transform 160ms ease",

                              "&:hover": {
                                borderColor: "#fed7aa",
                                bgcolor: "#fffdfb",
                                transform: "translateY(-1px)",
                              },
                            }}
                          >
                            {/* Barra lateral laranja */}
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: 0,
                                width: 4,
                                bgcolor: crmPalette.orange,
                              }}
                            />

                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                              }}
                            >
                              <Box
                                sx={{
                                  minWidth: 0,
                                  pl: 0.5,
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: crmPalette.muted,
                                    fontSize: 10.5,
                                    fontWeight: 900,
                                    letterSpacing: 0.45,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {detail.label}
                                </Typography>

                                <Typography
                                  sx={{
                                    mt: 0.8,
                                    color: crmPalette.text,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    lineHeight: 1.55,
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {detail.value}
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        ))}
                      </Box>
                    ) : (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 3,
                          borderRadius: "12px",
                          borderStyle: "dashed",
                          borderColor: crmPalette.border,
                          bgcolor: "#f8fafc",
                          textAlign: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            display: "grid",
                            placeItems: "center",
                            mx: "auto",
                            mb: 1.25,
                            borderRadius: "12px",
                            bgcolor: "#ffffff",
                            color: crmPalette.muted,
                            border: `1px solid ${crmPalette.border}`,
                          }}
                        >
                          <FileText size={20} />
                        </Box>

                        <Typography
                          sx={{
                            color: crmPalette.text,
                            fontSize: 14,
                            fontWeight: 900,
                          }}
                        >
                          Nenhuma informação cadastrada
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.5,
                            color: crmPalette.muted,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Os dados comerciais e operacionais aparecerão aqui.
                        </Typography>
                      </Paper>
                    )}
                  </Stack>
                </CrmSection>

                <CrmSection sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.5}
                      sx={{
                        alignItems: { xs: "stretch", md: "center" },
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            color: crmPalette.text,
                            fontSize: 16,
                            fontWeight: 900,
                          }}
                        >
                          Anexos
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.35,
                            color: crmPalette.muted,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Arquivos vinculados a esta proposta.
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
                                setSelectedFiles(
                                  Array.from(event.target.files ?? []),
                                );
                                event.target.value = "";
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
                              fontWeight: 900,
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
                              fontWeight: 800,
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
                                      fontWeight: 900,
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
                                      fontWeight: 700,
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
          </Stack>
        </CrmPageShell>

        <FeedbackToast
          open={Boolean(toast)}
          title={toast?.title ?? ""}
          message={toast?.message ?? ""}
          variant={toast?.variant ?? "success"}
          onClose={() => setToast(null)}
        />
      </AppLayout>
      );
}
