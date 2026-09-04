"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";



import {
  ArrowLeft,
  Clock,
  Edit3,
  Mail,
  UserRoundCheck,
} from "lucide-react";

import {
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";

import { formatLeadStatus, requestClientDeletion, } from "@/services/crm.service";

import type { LeadDetail } from "@/types/crm";

import {
  statusStyles,
} from "./detalhes-cliente-compartilhado";

type PropriedadesCabecalhoDetalhesCliente = {
  lead: LeadDetail | null;
  loading: boolean;
  error: string;

  canEditClient?: boolean;
  onEditClient?: () => void;

  canRequestDeletion?: boolean;
  onRequestDeletion?: () => void;
};

function formatDate(date?: string | null) {
  if (!date) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function getClientCreatedBy(lead: LeadDetail) {
  const creationEvent = lead.timeline?.find((event) => {
    const title = event.title?.toLowerCase() ?? "";

    return (
      event.type === "LEAD_CREATED" ||
      title.includes("cliente criado") ||
      title.includes("cliente convertido")
    );
  });

  return creationEvent?.createdBy || "Não informado";
}

function HeaderSummaryItem({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  withDivider = false,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  iconBg: string;
  iconColor: string;
  withDivider?: boolean;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,

        p: {
          xs: 2,
          md: 2.5,
        },

        borderRight: {
          md: withDivider
            ? "1px solid rgba(15,23,42,0.08)"
            : "none",
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 50,
            height: 50,

            display: "grid",
            placeItems: "center",

            flex: "0 0 auto",

            borderRadius: "16px",

            bgcolor: iconBg,
            color: iconColor,
          }}
        >
          {icon}
        </Box>

        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              color: "#94a3b8",

              fontSize: 14,
              fontWeight: 800,

              lineHeight: 1.35,
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              mt: 0.35,

              color: "#1e293b",

              fontSize: 17,
              fontWeight: 900,

              lineHeight: 1.35,

              overflowWrap: "anywhere",
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function CabecalhoDetalhesCliente({
  lead,
  loading,
  error,

  canEditClient = false,
  onEditClient,

  canRequestDeletion = false,
  onRequestDeletion,
}: PropriedadesCabecalhoDetalhesCliente) {
  return (
    <CrmSection
      sx={{
        position: "relative",

        overflow: "hidden",

        p: 0,

        borderRadius: "20px",

        border: "1px solid rgba(15,23,42,0.08)",

        bgcolor: "#ffffff",

        boxShadow:
          "0 14px 40px rgba(15,23,42,0.06)",
      }}
    >
      {loading ? (
        <Box
          sx={{
            minHeight: 220,

            display: "grid",
            placeItems: "center",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
            }}
          >
            <CircularProgress
              size={24}
              sx={{
                color: crmPalette.orange,
              }}
            />

            <Typography
              sx={{
                color: "#64748b",

                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Carregando cliente...
            </Typography>
          </Stack>
        </Box>
      ) : error ? (
        <Box
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Alert
            severity="error"
            sx={{
              borderRadius: "12px",
            }}
          >
            {error}
          </Alert>
        </Box>
      ) : lead ? (
        <Box
          sx={{
            p: {
              xs: 2.25,
              md: 3.5,
            },
          }}
        >
          
          <Stack spacing={4}>
            {/* =========================================
                PARTE SUPERIOR DO CABEÇALHO
            ========================================== */}
            <Stack
              direction={{
                xs: "column",
                xl: "row",
              }}
              spacing={2.5}
              sx={{
                alignItems: {
                  xs: "stretch",
                  xl: "center",
                },

                justifyContent: "space-between",
              }}
            >
              {/* =========================================
                  AVATAR + INFORMAÇÕES DO CLIENTE
              ========================================== */}
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
                sx={{
                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },

                  minWidth: 0,
                }}
              >
                {/* LOGO / INICIAL DA EMPRESA */}
                <Avatar
                  variant="rounded"
                  sx={{
                    width: {
                      xs: 100,
                      md: 130,
                    },

                    height: {
                      xs: 100,
                      md: 130,
                    },

                    flex: "0 0 auto",

                    borderRadius: "16px",

                    bgcolor: "#fff7ed",

                    color: crmPalette.orange,

                    border: "1px solid #fed7aa",

                    fontSize: {
                      xs: 34,
                      md: 42,
                    },

                    fontWeight: 950,
                  }}
                >
                  {(lead.company || "C")
                    .slice(0, 1)
                    .toUpperCase()}
                </Avatar>

                {/* DADOS PRINCIPAIS */}
                <Box
                  sx={{
                    minWidth: 0,
                  }}
                >
                  {/* TEXTO PEQUENO */}
                  <Typography
                    sx={{
                      color: crmPalette.orangeDark,

                      fontSize: 14,

                      fontWeight: 900,

                      letterSpacing: ".16em",

                      textTransform: "uppercase",
                    }}
                  >
                    Comercial · Cliente
                  </Typography>

                  {/* NOME DA EMPRESA */}
                  <Typography
                    component="h1"
                    sx={{
                      mt: 0.5,

                      color: "#0f172a",

                      fontSize: {
                        xs: 28,
                        md: 34,
                      },

                      fontWeight: 950,

                      lineHeight: 1.08,

                      letterSpacing: "-0.03em",

                      overflowWrap: "anywhere",
                    }}
                  >
                    {lead.company || "Cliente"}
                  </Typography>

                  {/* CONTATO PRINCIPAL */}
                  <Typography
                    sx={{
                      mt: 1,

                      color: "#64748b",

                      fontSize: {
                        xs: 10,
                        md: 15,
                      },

                      lineHeight: 1.5,

                      fontWeight: 600,

                      overflowWrap: "anywhere",
                    }}
                  >
                    CNPJ: {lead.document || "Não informado"}
                  </Typography>
                  <Box
                    sx={{
                      mt: 1.5,

                      display: "flex",

                      flexWrap: "wrap",

                      gap: 1,
                    }}
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      label={formatLeadStatus(lead.status)}
                      sx={{
                        ...statusStyles[lead.status],

                        fontWeight: 900,

                        borderRadius: "8px",
                      }}
                    />
                  </Box>
                </Box>
              </Stack>

                    {/* =========================================
                    BOTÕES DO CABEÇALHO
                    ========================================== */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,

                  justifyContent: {
                    xs: "flex-start",
                    xl: "flex-end",
                  },
                }}
              >
                {/* VOLTAR */}
                <Tooltip title="Voltar para clientes">
                  <IconButton
                    component={Link}
                    href="/clientes"
                    aria-label="Voltar para clientes"
                    sx={{
                      width: 42,
                      height: 42,

                      borderRadius: "10px",

                      border: "1px solid #cbd5e1",

                      bgcolor: "#ffffff",

                      color: "#334155",

                      boxShadow: "none",

                      "&:hover": {
                        borderColor: "#ff5805",

                        bgcolor: "#fff7ed",

                        color: "#e94f00",
                      },
                    }}
                  >
                    <ArrowLeft size={18} />
                  </IconButton>
                </Tooltip>

                {/* EDITAR */}
                {canEditClient ? (
                  <Tooltip title="Editar cliente">
                    <IconButton
                      type="button"
                      onClick={onEditClient}
                      aria-label="Editar cliente"
                      sx={{
                        width: 42,
                        height: 42,

                        borderRadius: "10px",

                        border: "1px solid #ff5805",

                        bgcolor: "#ff5805",

                        color: "#ffffff",

                        boxShadow: "none",

                        "&:hover": {
                          borderColor: "#e94f00",

                          bgcolor: "#e94f00",

                          color: "#ffffff",
                        },
                      }}
                    >
                      <Edit3 size={18} />
                    </IconButton>
                  </Tooltip>
                ) : null}

                {/* EXCLUIR */}
                {canRequestDeletion ? (
                  <Tooltip title="Excluir cliente">
                    <IconButton
                      type="button"
                      onClick={onRequestDeletion}
                      aria-label="Excluir cliente"
                      sx={{
                        width: 42,
                        height: 42,

                        borderRadius: "10px",

                        border: "1px solid #ef4444",

                        bgcolor: "#ffffff",

                        color: "#dc2626",

                        boxShadow: "none",

                        "&:hover": {
                          borderColor: "#dc2626",

                          bgcolor: "#fef2f2",

                          color: "#b91c1c",
                        },
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>
                </Stack>
                

              {/* =========================================
                RESUMO DO CLIENTE
            ========================================== */}
              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1fr",

                    md: "repeat(3, minmax(0, 1fr))",
                  },

                  overflow: "hidden",

                  border:
                    "1px solid rgba(15,23,42,0.08)",

                  borderRadius: "12px",

                  bgcolor: "#ffffff",
                }}
              >
                {/* CONTATO */}
                <HeaderSummaryItem
                  icon={
                    <Mail size={22} />
                  }
                  label="Contato"
                  value={
                    lead.email ||
                    lead.phone ||
                    "Não informado"
                  }
                  iconBg="#eff6ff"
                  iconColor="#2563eb"
                  withDivider
                />

                {/* RESPONSÁVEL */}
                <HeaderSummaryItem
                  icon={
                    <UserRoundCheck size={22} />
                  }
                  label="Responsável"
                  value={getClientCreatedBy(lead)}
                  iconBg="#ecfdf5"
                  iconColor="#059669"
                  withDivider
                />

                {/* ÚLTIMA INTERAÇÃO */}
                <HeaderSummaryItem
                  icon={
                    <Clock size={22} />
                  }
                  label="Última interação"
                  value={formatDate(
                    lead.lastContactAt,
                  )}
                  iconBg="#fff7d6"
                  iconColor="#9a6700"
                />
              </Box>
            </Stack>
        </Box>
      ) : null}
    </CrmSection>
  );
}