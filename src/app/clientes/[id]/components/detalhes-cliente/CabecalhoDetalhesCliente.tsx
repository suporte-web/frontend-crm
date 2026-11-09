"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { ArrowLeft, Edit3, MoreVertical } from "lucide-react";
import { IdentificacaoProspeccao } from "@/components/crm/prospeccao-consultora";
import { CrmSection } from "@/components/mui/crm-primitives";
import { obterContatoPrincipal } from "@/lib/contato-principal";
import { moeda, valorMonetario } from "@/lib/bi-comercial";
import { formatLeadStatus } from "@/services/crm.service";
import type { LeadDetail } from "@/types/crm";
import { statusStyles } from "./detalhes-cliente-compartilhado";

type PropriedadesCabecalhoDetalhesCliente = {
  hrefVoltar?: string;
  lead: LeadDetail | null;
  loading: boolean;
  error: string;
  canEditClient?: boolean;
  onEditClient?: () => void;
  canRequestDeletion?: boolean;
  onRequestDeletion?: () => void;
};

function formatDate(date?: string | null) {
  if (!date) return "Não informado";
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

function InformacaoResumo({
  titulo,
  area,
  children,
}: {
  titulo: string;
  area: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0, gridArea: area }}>
      <Typography
        component="dt"
        sx={{ color: "#64748b", fontSize: 11.5, mb: 0.4 }}
      >
        {titulo}
      </Typography>
      <Typography
        component="dd"
        sx={{
          m: 0,
          color: "#334155",
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.5,
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export function CabecalhoDetalhesCliente({
  hrefVoltar = "/cadastros",
  lead,
  loading,
  error,
  canEditClient = false,
  onEditClient,
  canRequestDeletion = false,
  onRequestDeletion,
}: PropriedadesCabecalhoDetalhesCliente) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuAberto = Boolean(menuAnchorEl);
  const contatoPrincipal = lead ? obterContatoPrincipal(lead) : { nome: "", email: "", telefone: "" };
  const identificacaoContato = contatoPrincipal.nome || contatoPrincipal.email || contatoPrincipal.telefone;
  function fecharMenu() {
    setMenuAnchorEl(null);
  }
  function excluirPeloMenu() {
    fecharMenu();
    onRequestDeletion?.();
  }

  return (
    <CrmSection
      sx={{
        p: 0,
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        boxShadow: "none",
      }}
    >
      {loading ? (
        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            minHeight: 144,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={22} sx={{ color: "#ff5805" }} />
          <Typography sx={{ color: "#64748b", fontSize: 13 }}>
            Carregando cliente...
          </Typography>
        </Stack>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : lead ? (
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.75}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "stretch", md: "flex-start" },
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ minWidth: 0, alignItems: "flex-start", flex: 1 }}
            >
              <Avatar
                src={lead.fotoUrl || undefined}
                alt={lead.company || "Foto do cadastro"}
                variant="rounded"
                sx={{
                  width: 54,
                  height: 54,
                  flexShrink: 0,
                  borderRadius: "10px",
                  bgcolor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  fontSize: 23,
                  fontWeight: 600,
                }}
              >
                {(lead.company || "C").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  component="h1"
                  sx={{
                    color: "#1f2937",
                    fontSize: { xs: 20, md: 22 },
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: "-0.02em",
                    overflowWrap: "anywhere",
                  }}
                >
                  {lead.company || "Cliente"}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  sx={{ mt: 0.75, flexWrap: "wrap", alignItems: "center" }}
                >
                  <Typography
                    sx={{
                      mr: 0.5,
                      color: "#64748b",
                      fontSize: 12.5,
                      overflowWrap: "anywhere",
                    }}
                  >
                    CNPJ: {lead.document || "Não informado"}
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      lead.modalidadeCadastro === "LEAD" ? "Lead" : "Cliente"
                    }
                    sx={{
                      height: 23,
                      borderRadius: "6px",
                      bgcolor: "#f1f5f9",
                      color: "#475569",
                      fontSize: 11.5,
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={formatLeadStatus(lead.status)}
                    sx={{
                      ...statusStyles[lead.status],
                      height: 23,
                      borderRadius: "6px",
                      fontSize: 11.5,
                      fontWeight: 500,
                    }}
                  />
                </Stack>
                <IdentificacaoProspeccao registro={lead} />
              </Box>
            </Stack>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: "center",
                justifyContent: "flex-end",
                flexShrink: 0,
              }}
            >
              <Button
                component={Link}
                href={hrefVoltar}
                variant="outlined"
                size="small"
                startIcon={<ArrowLeft size={15} />}
                sx={{
                  minHeight: 40,
                  px: 1.75,
                  borderRadius: "8px",
                  color: "#334155",
                  bgcolor: "#f8fafc",
                  borderColor: "#cbd5e1",
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#f1f5f9", borderColor: "#94a3b8" },
                  "&.Mui-focusVisible": { outline: "2px solid #ff5805", outlineOffset: 2 },
                }}
              >
                Voltar
              </Button>
              {canEditClient && (
                <Button
                  type="button"
                  variant="contained"
                  size="small"
                  onClick={onEditClient}
                  startIcon={<Edit3 size={15} />}
                  sx={{
                    minHeight: 36,
                    px: 1.75,
                    borderRadius: "8px",
                    bgcolor: "#ff5805",
                    color: "#fff",
                    fontSize: 12.5,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#e94f00", boxShadow: "none" },
                  }}
                >
                  Editar
                </Button>
              )}
              {canRequestDeletion && (
                <>
                  <Tooltip title="Mais opções">
                    <IconButton
                      type="button"
                      size="small"
                      aria-label="Mais opções do cliente"
                      aria-haspopup="menu"
                      aria-controls={
                        menuAberto ? "menu-acoes-cliente" : undefined
                      }
                      aria-expanded={menuAberto ? true : undefined}
                      onClick={(event) => setMenuAnchorEl(event.currentTarget)}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "8px",
                        color: "#64748b",
                        "&:hover": { bgcolor: "#f8fafc" },
                      }}
                    >
                      <MoreVertical size={18} />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    id="menu-acoes-cliente"
                    anchorEl={menuAnchorEl}
                    open={menuAberto}
                    onClose={fecharMenu}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 0.75,
                          minWidth: 180,
                          borderRadius: "8px",
                          boxShadow: "0 4px 16px rgba(15,23,42,.08)",
                        },
                      },
                    }}
                  >
                    <MenuItem
                      onClick={excluirPeloMenu}
                      sx={{ color: "#dc2626", fontSize: 13 }}
                    >
                      <ListItemIcon sx={{ color: "inherit", minWidth: 30 }}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Excluir cliente"
                        slotProps={{ primary: { sx: { fontSize: 13 } } }}
                      />
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Stack>
          </Stack>
          <Box
            component="dl"
            sx={{
              m: 0,
              mt: 2,
              pt: 1.5,
              borderTop: "1px solid #f1f5f9",
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,minmax(0,1fr))",
                lg: "1.25fr 1fr 1fr 1.25fr 1fr",
              },
              gridTemplateAreas: {
                xs: '"contato responsavel" "interacao volume" "acao acao"',
                lg: '"contato responsavel interacao acao volume"',
              },
              gap: { xs: 1.25, md: 2 },
            }}
          >
            <InformacaoResumo titulo="Contato principal" area="contato">
              {identificacaoContato || "Não informado"}
              {contatoPrincipal.nome && contatoPrincipal.email && (
                <Box component="span" sx={{ display: "block", color: "#64748b", fontSize: 12 }}>{contatoPrincipal.email}</Box>
              )}
              {(contatoPrincipal.nome || contatoPrincipal.email) && contatoPrincipal.telefone && (
                <Box component="span" sx={{ display: "block", color: "#64748b", fontSize: 12 }}>{contatoPrincipal.telefone}</Box>
              )}
            </InformacaoResumo>
            <InformacaoResumo titulo="Responsável" area="responsavel">
              {lead.responsavel || getClientCreatedBy(lead)}
            </InformacaoResumo>
            <InformacaoResumo titulo="Última interação" area="interacao">
              {formatDate(lead.lastContactAt)}
            </InformacaoResumo>
            <InformacaoResumo titulo="Próxima ação" area="acao">
              {lead.proximaAcao || "Não informada"}
            </InformacaoResumo>
            <InformacaoResumo titulo="Volume mensal estimado" area="volume">
              {lead.volumeMensalEstimado
                ? moeda(valorMonetario(lead.volumeMensalEstimado))
                : "Não informado"}
            </InformacaoResumo>
          </Box>
        </Box>
      ) : null}
    </CrmSection>
  );
}
