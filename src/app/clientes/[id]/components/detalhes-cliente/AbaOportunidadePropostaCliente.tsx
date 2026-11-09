"use client";

import { marcadorEtapaOportunidadeSx, formularioOportunidadeSx, superficieOportunidadeSx } from '@/components/crm/estilos-oportunidades';
import { formatarValorOportunidade, origemValorOportunidade, mascararValorMonetario, formatarValorMonetarioSalvo } from '@/lib/valor-oportunidade';
import { campoPequenoClienteSx, superficieAbasClienteSx, paletaAbasCliente as crmPalette } from "./estilos-abas-cliente";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { validarDocumentosOportunidade } from "@/lib/opportunity-documents";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  Edit3,
  Eye,
  FileText,
  PlusCircle,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { CrmSection } from "@/components/mui/crm-primitives";
import { formatarEtapaOportunidade } from "@/services/crm.service";

import {
  TituloSecaoFormulario,
  CabecalhoSecao,
  STORAGE_PROPOSAL_OPTIONS,
  TRANSPORT_PRICE_ITEMS,
  TRANSPORT_PROPOSAL_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  formatarData,
  listItemSx,
  modernListSx,
  secondaryButtonSx,
  textFieldSx,
} from "./detalhes-cliente-compartilhado";
import type {
  PropriedadesAbaDetalhesCliente,
  FormularioPropostaOportunidade,
} from "./detalhes-cliente-compartilhado";


const campoPropostaSx = {
  minWidth: 0,
  '& .MuiOutlinedInput-root': {
    height: 40,
    borderRadius: '8px',
    bgcolor: '#fff',
    fontSize: 14,
    fontWeight: 400,
    boxShadow: 'none',
    '& fieldset': { borderColor: '#cbd5e1' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused fieldset': { borderColor: '#ff5805', borderWidth: '1.5px' },
  },
  '& .MuiInputBase-input': { fontSize: 14, fontWeight: 400 },
  '& .MuiInputBase-input::placeholder': { color: '#94a3b8', opacity: 1, fontWeight: 400 },
  '& .MuiSelect-select': { display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 400 },
};



export function AbaOportunidadePropostaCliente(props: PropriedadesAbaDetalhesCliente) {
  const {
    currentLead,
    canEditCommercialData,
    proposalFiles,
    setProposalFiles,
    uploadingProposalOpportunityId,
    handleUploadProposalDocuments,
    handleOpenDocument,
    openDeleteDocumentDialog,
    opportunityProposalDocuments,
    opportunityProposalForm,
    setFormularioPropostaOportunidade,
    opportunityProposalError,
    savingOpportunityProposal,
    editingOpportunityId,
    editingOpportunityForm,
    setEditingOpportunityForm,
    savingEditingOpportunityId,
    deletingOpportunityId,
    handleCreateOpportunityProposal,
    startEditingOpportunity,
    setEditingOpportunityId,
    updateEditingOpportunityForm,
    handleUpdateOpportunity,
    handleDeleteOpportunity,
    toggleProposalOption,
    addCustomProposalOption,
  } = props;

  const parametros = useSearchParams();
  const [erroAnexo, setErroAnexo] = useState('');
  const [novaPropostaAberta, setNovaPropostaAberta] = useState(parametros.get("nova") === "1");
  const idsAntesDeSalvar = useRef<Set<string> | null>(null);
  const emEdicao = Boolean(editingOpportunityId);
  const formularioAtivo = emEdicao ? editingOpportunityForm : opportunityProposalForm;
  const setFormularioAtivo = emEdicao ? setEditingOpportunityForm : setFormularioPropostaOportunidade;
  const salvandoFormulario = emEdicao ? savingEditingOpportunityId === editingOpportunityId : savingOpportunityProposal;
  const erroFormulario = emEdicao ? '' : opportunityProposalError;
  const alternarOpcaoProposta = emEdicao ? toggleEditingProposalOption : toggleProposalOption;
  const adicionarOpcaoProposta = emEdicao ? addCustomEditingProposalOption : addCustomProposalOption;

  // Fecha o modal somente quando uma nova proposta aparecer na lista.
  // Se a API retornar erro, o formulario permanece aberto com os dados digitados.
  useEffect(() => {
    if (!idsAntesDeSalvar.current) return;
    const existeNovaProposta = currentLead.opportunities.some(
      (item) => !idsAntesDeSalvar.current?.has(item.id),
    );
    if (existeNovaProposta) {
      idsAntesDeSalvar.current = null;
      setNovaPropostaAberta(false);
    }
  }, [currentLead.opportunities]);

  function abrirNovaProposta() {
    idsAntesDeSalvar.current = null;
    setEditingOpportunityId(null);
    setNovaPropostaAberta(true);
  }

  function fecharNovaProposta() {
    if (salvandoFormulario) return;
    idsAntesDeSalvar.current = null;
    setNovaPropostaAberta(false);
    if (emEdicao) setEditingOpportunityId(null);
  }

  function enviarNovaProposta(event: FormEvent<HTMLFormElement>) {
    if (salvandoFormulario) { event.preventDefault(); return; }
    if (editingOpportunityId) {
      void handleUpdateOpportunity(editingOpportunityId, event);
      return;
    }
    // A funcao do projeto continua responsavel pela validacao e persistencia.
    idsAntesDeSalvar.current = new Set(
      currentLead.opportunities.map((item) => item.id),
    );
    void handleCreateOpportunityProposal(event);
  }

  function abrirEdicaoProposta(oportunidade: (typeof currentLead.opportunities)[number]) {
    idsAntesDeSalvar.current = null;
    setNovaPropostaAberta(false);
    startEditingOpportunity(oportunidade);
  }

  const proposalOptions =
    formularioAtivo.proposalType === "ARMAZENAGEM"
      ? STORAGE_PROPOSAL_OPTIONS
      : TRANSPORT_PROPOSAL_OPTIONS;
  const selectedProposalOptions =
    formularioAtivo.proposalType === "ARMAZENAGEM"
      ? formularioAtivo.storageOptions
      : formularioAtivo.transportOptions;
  const customSelectedOptions = selectedProposalOptions.filter(
    (option) => !proposalOptions.includes(option as never),
  );

  const marcadorAnexoProposta = (opportunityId: string) =>
    `oportunidade:${opportunityId}`;
  const documentosPorProposta = (opportunityId: string) =>
    opportunityProposalDocuments.filter((document) =>
      document.description?.includes(marcadorAnexoProposta(opportunityId)),
    );
  const documentosSemProposta = opportunityProposalDocuments.filter(
    (document) => !document.description?.includes("oportunidade:"),
  );

  function toggleEditingProposalOption(option: string) {
    setEditingOpportunityForm((current) => {
      const field =
        current.proposalType === "ARMAZENAGEM"
          ? "storageOptions"
          : "transportOptions";

      const currentOptions = current[field];

      const nextOptions = currentOptions.includes(option)
        ? currentOptions.filter((item) => item !== option)
        : [...currentOptions, option];

      return {
        ...current,
        [field]: nextOptions,
      };
    });
  }

  function addCustomEditingProposalOption() {
    const option =
      editingOpportunityForm.customOption.trim();

    if (
      !option ||
      !editingOpportunityForm.proposalType
    ) {
      return;
    }

    setEditingOpportunityForm((current) => {
      const field =
        current.proposalType === "ARMAZENAGEM"
          ? "storageOptions"
          : "transportOptions";

      if (current[field].includes(option)) {
        return {
          ...current,
          customOption: "",
        };
      }

      return {
        ...current,
        [field]: [...current[field], option],
        customOption: "",
      };
    });
  }


  return (
    <CrmSection
      sx={[{
        p: { xs: 2, md: 2.5 },
        borderRadius: "14px",
        border: `1px solid ${crmPalette.border}`,
        bgcolor: "#ffffff",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
      }, superficieAbasClienteSx, superficieOportunidadeSx, formularioOportunidadeSx, {
        containerType: 'inline-size', containerName: 'propostas-cliente',
        '@container propostas-cliente (max-width: 680px)': {
          '& [data-colunas-propostas]': { display: 'none' },
          '& [data-linha-proposta]': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))', py: 2, gap: 1.5 },
          '& [data-linha-proposta] > :first-child': { gridColumn: '1 / -1' },
          '& [data-linha-proposta] > .MuiStack-root:last-child': { gridColumn: '1 / -1', width: '100%', justifyContent: 'flex-end' },
        },
        '@container propostas-cliente (max-width: 420px)': {
          '& [data-linha-proposta]': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))' },
          '& [data-linha-proposta] .MuiButton-root': { maxWidth: '100%' },
        },
      }]}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                color: crmPalette.text,
                fontWeight: 600,
                fontSize: 20,
              }}
            >
              Oportunidades e propostas
            </Typography>

            <Chip
              label={`${currentLead.opportunities.length} ${currentLead.opportunities.length === 1
                  ? "proposta"
                  : "propostas"
                }`}
              size="small"
              sx={{
                height: 25,
                bgcolor: "#f1f5f9",
                color: "#475569",
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          </Stack>

          {canEditCommercialData && (
            <Button
              type="button"
              variant="contained"
              startIcon={<PlusCircle size={16} />}
              onClick={abrirNovaProposta}
              sx={{
                minHeight: 36,
                px: 1.75,
                borderRadius: "8px",
                bgcolor: "#ff5805",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: crmPalette.orangeDark,
                  boxShadow: "none",
                },
              }}
            >
              Nova proposta
            </Button>
          )}
        </Stack>

        <Divider sx={{ borderColor: crmPalette.border, my: .5 }} />

        {canEditCommercialData && (
          <Dialog
            open={novaPropostaAberta || emEdicao}
            onClose={fecharNovaProposta}
            fullWidth
            maxWidth="md"
            scroll="paper"
            aria-labelledby="titulo-nova-proposta"
            slotProps={{
              paper: {
                sx: {
                  borderRadius: "12px",
                  bgcolor: "#ffffff",
                  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.12)",
                  overflow: "hidden",
                },
              },
            }}
          >
            <DialogTitle id="titulo-nova-proposta" sx={{ px: { xs: 2, md: 3 }, py: 2, bgcolor: "#fff" }}>

              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: "#fff7ed", color: crmPalette.orangeDark, display: "grid", placeItems: "center" }}>
                    <FileText size={22} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 600, color: crmPalette.text }}>{emEdicao ? "Editar proposta" : "Nova proposta"}</Typography>
                    <Typography sx={{ fontSize: 12, color: crmPalette.muted }}>Preencha as informações comerciais e operacionais.</Typography>
                  </Box>
                </Stack>
                <IconButton aria-label="Fechar formulário" onClick={fecharNovaProposta} disabled={salvandoFormulario} size="small" sx={{ color: crmPalette.muted }}>
                  <X size={20} />
                </IconButton>
              </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ ...formularioOportunidadeSx, p: { xs: 2, md: 2.5 } }}>
              <Box component="form" id="formulario-nova-proposta" onSubmit={enviarNovaProposta}>

                <Stack spacing={2}>
                  {/* =========================================
          1. DADOS PRINCIPAIS DA NOVA PROPOSTA
        ======================================= */}
                  <Box component="section" aria-label="Dados principais da proposta" sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1.3fr) minmax(0, 1fr)' }, gap: 2.5 }}>
                    <Stack spacing={1} sx={{ minWidth: 0 }}>
                      <Typography component="label" htmlFor="titulo-proposta" sx={{ color: '#334155', fontSize: 13, fontWeight: 600 }}>Título da proposta *</Typography>
                      <TextField
                        required
                        fullWidth
                        size="small"
                        id="titulo-proposta"
                        placeholder="Ex.: Operação Curitiba"
                        value={
                          formularioAtivo.title
                        }
                        onChange={(event) =>
                          setFormularioAtivo(
                            (current) => ({
                              ...current,

                              title:
                                event.target.value,
                            }),
                          )
                        }
                        sx={campoPropostaSx}
                      />
                    </Stack>
                    <Stack spacing={1} sx={{ minWidth: 0 }}>
                      <Typography component="label" id="rotulo-tipo-proposta" htmlFor="tipo-proposta" sx={{ color: '#334155', fontSize: 13, fontWeight: 600 }}>Tipo de proposta *</Typography>
                      <TextField
                        required
                        select
                        fullWidth
                        size="small"
                        id="tipo-proposta"
                        slotProps={{ select: { displayEmpty: true, labelId: "rotulo-tipo-proposta" } }}
                        value={
                          formularioAtivo.proposalType
                        }
                        onChange={(event) =>
                          setFormularioAtivo(
                            (current) => ({
                              ...current,

                              proposalType:
                                event.target
                                  .value as FormularioPropostaOportunidade["proposalType"],

                              origin: "",
                              destination: "",
                              vehicleType: "",
                              cargoType: "",
                              averageWeight: "",
                              aggregateValue: "",
                              cubage: "",
                              monthlyShipments: "",
                              dangerousGoods: "",
                              dangerousGoodsInfo: "",

                              transportValues:
                                Object.fromEntries(
                                  TRANSPORT_PRICE_ITEMS.map(
                                    (item) => [
                                      item,
                                      "",
                                    ],
                                  ),
                                ) as Record<
                                  string,
                                  string
                                >,

                              customOption: "",
                            }),
                          )
                        }
                        sx={campoPropostaSx}
                      >
                        <MenuItem value="" disabled>
                          Selecione o tipo
                        </MenuItem>

                        <MenuItem value="TRANSPORTE_RODOVIARIO">
                          Transporte rodoviário
                        </MenuItem>

                        <MenuItem value="ARMAZENAGEM">
                          Armazenagem
                        </MenuItem>
                      </TextField>
                    </Stack>
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    label="Valor total (R$)"
                    placeholder="0,00"
                    helperText="Valor total negociado do serviço."
                    value={formatarValorMonetarioSalvo(formularioAtivo.valorTotal)}
                    onChange={(event) => setFormularioAtivo((current) => ({ ...current, valorTotal: mascararValorMonetario(event.target.value) }))}
                    slotProps={{ htmlInput: { inputMode: 'decimal' }, inputLabel: { shrink: true } }}
                    sx={campoPropostaSx}
                  />

                  {/* =========================================
          2. SERVIÇOS
      ========================================== */}
                  {formularioAtivo.proposalType ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        overflow: "hidden",

                        borderRadius: "10px",

                        borderColor: "#e2e8f0",

                        bgcolor: "#ffffff",

                        boxShadow: "none",
                      }}
                    >
                      {/* CABEÇALHO */}
                      <Box
                        sx={{
                          px: {
                            xs: 1.75,
                            md: 2,
                          },

                          py: 1.5,

                          borderBottom:
                            `1px solid ${crmPalette.border}`,

                          bgcolor: "#ffffff",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.25}
                          sx={{
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: 38,
                              height: 38,

                              display: "grid",
                              placeItems: "center",

                              flexShrink: 0,

                              borderRadius: "10px",

                              bgcolor: "#ffffff",

                              color:
                                "#64748b",
                            }}
                          >
                            <FileText size={18} />
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                color:
                                  crmPalette.text,

                                fontSize: 15,

                                fontWeight: 600,

                                lineHeight: 1.3,
                              }}
                            >
                              {formularioAtivo
                                .proposalType ===
                                "ARMAZENAGEM"
                                ? "Serviços de armazenagem"
                                : "Serviços de transporte rodoviário"}
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.25,

                                color:
                                  crmPalette.muted,

                                fontSize: 11.5,

                                lineHeight: 1.45,
                              }}
                            >
                              Selecione os serviços que farão parte desta proposta.
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* CONTEÚDO */}
                      <Box
                        sx={{
                          p: {
                            xs: 1.75,
                            md: 2,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "grid",

                            gridTemplateColumns: {
                              xs: "1fr",

                              sm:
                                "repeat(2, minmax(0, 1fr))",

                              lg:
                                "repeat(3, minmax(0, 1fr))",
                            },

                            columnGap: 2,

                            rowGap: 0.5,
                          }}
                        >
                          {[
                            ...proposalOptions,
                            ...customSelectedOptions,
                          ].map((option) => (
                            <FormControlLabel
                              key={option}
                              control={
                                <Checkbox
                                  checked={selectedProposalOptions.includes(
                                    option,
                                  )}
                                  onChange={() =>
                                    alternarOpcaoProposta(
                                      option,
                                    )
                                  }
                                  size="small"
                                  sx={{
                                    color: "#94a3b8",

                                    "&.Mui-checked": {
                                      color:
                                        crmPalette.orange,
                                    },
                                  }}
                                />
                              }
                              label={option}
                              sx={{
                                m: 0,

                                minHeight: 38,

                                color:
                                  crmPalette.text,

                                "& .MuiFormControlLabel-label":
                                {
                                  fontSize: 13,

                                  fontWeight: 600,
                                },
                              }}
                            />
                          ))}
                        </Box>

                        {/* OUTRO SERVIÇO */}
                        <Stack
                          direction={{
                            xs: "column",
                            sm: "row",
                          }}
                          spacing={1}
                          sx={{
                            mt: 1.75,

                            pt: 1.75,

                            borderTop:
                              `1px solid ${crmPalette.border}`,

                            alignItems: {
                              xs: "stretch",
                              sm: "center",
                            },
                          }}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            label="Outro serviço"
                            placeholder="Digite uma opção que não está na lista"
                            value={
                              formularioAtivo.customOption
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  customOption:
                                    event.target.value,
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]} slotProps={{ inputLabel: { shrink: true } }}
                          />

                          <Button
                            type="button"
                            variant="outlined"
                            startIcon={
                              <PlusCircle size={15} />
                            }
                            disabled={
                              !formularioAtivo.customOption.trim()
                            }
                            onClick={
                              adicionarOpcaoProposta
                            }
                            sx={{
                              ...secondaryButtonSx,

                              minHeight: 40,

                              px: 2,

                              whiteSpace: "nowrap",
                            }}
                          >
                            Adicionar
                          </Button>
                        </Stack>
                      </Box>
                    </Paper>
                  ) : null}

                  {/* =========================================
          3. INFORMAÇÕES OPERACIONAIS
      ========================================== */}
                  {formularioAtivo.proposalType ===
                    "TRANSPORTE_RODOVIARIO" ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        overflow: "hidden",

                        borderRadius: "10px",

                        borderColor: "#e2e8f0",

                        bgcolor: "#ffffff",

                        boxShadow: "none",
                      }}
                    >
                      {/* CABEÇALHO */}
                      <Box
                        sx={{
                          px: {
                            xs: 1.75,
                            md: 2,
                          },

                          py: 1.5,

                          borderBottom:
                            `1px solid ${crmPalette.border}`,

                          bgcolor: "#ffffff",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.25}
                          sx={{
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: 38,
                              height: 38,

                              display: "grid",
                              placeItems: "center",

                              flexShrink: 0,

                              borderRadius: "10px",

                              bgcolor: "#ffffff",

                              color:
                                "#64748b",
                            }}
                          >
                            <FileText size={18} />
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                color:
                                  crmPalette.text,

                                fontSize: 15,

                                fontWeight: 600,
                              }}
                            >
                              Informações operacionais
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.25,

                                color:
                                  crmPalette.muted,

                                fontSize: 11.5,

                                lineHeight: 1.45,
                              }}
                            >
                              Dados necessários para montar a cotação e a proposta comercial.
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* CAMPOS */}
                      <Box
                        sx={{
                          p: {
                            xs: 1.75,
                            md: 2,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "grid",

                            gridTemplateColumns: {
                              xs: "1fr",

                              md:
                                "repeat(2, minmax(0, 1fr))",

                              xl:
                                "repeat(3, minmax(0, 1fr))",
                            },

                            gap: 1.5,
                          }}
                        >
                          <TextField
                            required
                            fullWidth
                            size="small"
                            label="Origem"
                            value={
                              formularioAtivo.origin
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  origin:
                                    event.target.value,
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]}
                          />

                          <TextField
                            required
                            fullWidth
                            size="small"
                            label="Destino"
                            value={
                              formularioAtivo.destination
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  destination:
                                    event.target.value,
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]}
                          />

                          <TextField
                            required
                            select
                            fullWidth
                            size="small"
                            label="Tipo de veículo"
                            value={
                              formularioAtivo.vehicleType
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  vehicleType:
                                    event.target.value,
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]}
                          >
                            <MenuItem value="">
                              Selecione
                            </MenuItem>

                            {VEHICLE_TYPE_OPTIONS.map(
                              (option) => (
                                <MenuItem
                                  key={option}
                                  value={option}
                                >
                                  {option}
                                </MenuItem>
                              ),
                            )}
                          </TextField>

                          <TextField
                            required
                            fullWidth
                            size="small"
                            label="Tipo de carga"
                            value={
                              formularioAtivo.cargoType
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  cargoType:
                                    event.target.value,
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]}
                          />

                          <TextField

                            fullWidth
                            size="small"
                            label="Peso médio"
                            placeholder="Ex.: 1.200 kg"
                            value={
                              formularioAtivo.averageWeight
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  averageWeight:
                                    event.target.value,
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]} slotProps={{ inputLabel: { shrink: true } }}
                          />

                          <TextField

                            fullWidth
                            size="small"
                            label="Valor agregado"
                            placeholder="Ex.: R$ 80.000,00"
                            value={
                              formatarValorMonetarioSalvo(formularioAtivo.aggregateValue)
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  aggregateValue:
                                    mascararValorMonetario(event.target.value),
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]} slotProps={{ inputLabel: { shrink: true } }}
                          />

                          <TextField
                            fullWidth
                            size="small"
                            label="Cubagem"
                            placeholder="Opcional"
                            value={
                              formularioAtivo.cubage
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  cubage:
                                    event.target.value,
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]} slotProps={{ inputLabel: { shrink: true } }}
                          />

                          <TextField
                            fullWidth
                            size="small"
                            label="Quantidade de embarques/mês"
                            placeholder="Opcional"
                            value={
                              formularioAtivo.monthlyShipments
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  monthlyShipments:
                                    event.target.value,
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]} slotProps={{ inputLabel: { shrink: true } }}
                          />

                          <TextField

                            select
                            fullWidth
                            size="small"
                            label="Produto perigoso"
                            value={
                              formularioAtivo.dangerousGoods
                            }
                            onChange={(event) =>
                              setFormularioAtivo(
                                (current) => ({
                                  ...current,

                                  dangerousGoods:
                                    event.target
                                      .value as FormularioPropostaOportunidade["dangerousGoods"],

                                  dangerousGoodsInfo:
                                    event.target.value ===
                                      "SIM"
                                      ? current.dangerousGoodsInfo
                                      : "",
                                }),
                              )
                            }
                            sx={[textFieldSx, campoPequenoClienteSx]}
                          >
                            <MenuItem value="">
                              Selecione
                            </MenuItem>

                            <MenuItem value="NAO">
                              Não
                            </MenuItem>

                            <MenuItem value="SIM">
                              Sim
                            </MenuItem>
                          </TextField>

                          {formularioAtivo.dangerousGoods ===
                            "SIM" ? (
                            <TextField
                              required
                              fullWidth
                              multiline
                              minRows={2}
                              label="FDS / Ficha de Emergência"
                              placeholder="Informe os dados ou instruções da FDS/Ficha de Emergência"
                              value={
                                formularioAtivo.dangerousGoodsInfo
                              }
                              onChange={(event) =>
                                setFormularioAtivo(
                                  (current) => ({
                                    ...current,

                                    dangerousGoodsInfo:
                                      event.target
                                        .value,
                                  }),
                                )
                              }
                              sx={[{
                                ...textFieldSx,

                                gridColumn: {
                                  xs: "auto",
                                  md: "1 / -1",
                                },
                              }, campoPequenoClienteSx]} size="small" slotProps={{ inputLabel: { shrink: true } }}
                            />
                          ) : null}
                        </Box>
                      </Box>
                    </Paper>
                  ) : null}

                  {/* =========================================
          4. VALORES DA PROPOSTA
      ========================================== */}
                  {formularioAtivo.proposalType ===
                    "TRANSPORTE_RODOVIARIO" ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        overflow: "hidden",

                        borderRadius: "10px",

                        borderColor: "#e2e8f0",

                        bgcolor: "#ffffff",

                        boxShadow: "none",
                      }}
                    >
                      {/* CABEÇALHO */}
                      <Box
                        sx={{
                          px: {
                            xs: 1.75,
                            md: 2,
                          },

                          py: 1.5,

                          borderBottom:
                            `1px solid ${crmPalette.border}`,

                          bgcolor: "#ffffff",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.25}
                          sx={{
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: 38,
                              height: 38,

                              display: "grid",
                              placeItems: "center",

                              flexShrink: 0,

                              borderRadius: "10px",

                              bgcolor: "#ffffff",

                              color:
                                "#64748b",
                            }}
                          >
                            <FileText size={18} />
                          </Box>

                          <Box>
                            <Typography
                              sx={{
                                color:
                                  crmPalette.text,

                                fontSize: 15,

                                fontWeight: 600,
                              }}
                            >
                              Valores da proposta
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.25,

                                color:
                                  crmPalette.muted,

                                fontSize: 11.5,
                              }}
                            >
                              Informe os valores comerciais da operação.
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* VALORES */}
                      <Box
                        sx={{
                          p: {
                            xs: 1.75,
                            md: 2,
                          },

                          display: "grid",

                          gridTemplateColumns: {
                            xs: "1fr",

                            sm:
                              "repeat(2, minmax(0, 1fr))",

                            xl:
                              "repeat(3, minmax(0, 1fr))",
                          },

                          gap: 1.5,
                        }}
                      >
                        {TRANSPORT_PRICE_ITEMS.map(
                          (item) => (
                            <TextField
                              key={item}
                              fullWidth
                              size="small"
                              label={item}
                              placeholder="R$ 0,00"
                              value={formatarValorMonetarioSalvo(formularioAtivo.transportValues[item] ?? "")}
                              onChange={(event) =>
                                setFormularioAtivo(
                                  (current) => ({
                                    ...current,

                                    transportValues: {
                                      ...current.transportValues,

                                      [item]:
                                        mascararValorMonetario(event.target.value),
                                    },
                                  }),
                                )
                              }
                              sx={[textFieldSx, campoPequenoClienteSx]} slotProps={{ inputLabel: { shrink: true } }}
                            />
                          ),
                        )}
                      </Box>
                    </Paper>
                  ) : null}

                  {/* =========================================
          ERRO
      ========================================== */}
                  {erroFormulario ? (
                    <Alert
                      severity="error"
                      sx={{
                        borderRadius: "12px",
                      }}
                    >
                      {erroFormulario}
                    </Alert>
                  ) : null}

                  {/* =========================================
          AÇÃO FINAL
      ========================================== */}
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={1}
                    sx={{
                      pt: 0.25,

                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={fecharNovaProposta}
                      disabled={salvandoFormulario}
                      sx={{ ...secondaryButtonSx, minHeight: 42, borderRadius: "10px", textTransform: "none" }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={
                        salvandoFormulario
                      }
                      startIcon={
                        salvandoFormulario ? (
                          <CircularProgress
                            size={16}
                            color="inherit"
                          />
                        ) : (
                          <Save size={16} />
                        )
                      }
                      sx={{
                        width: {
                          xs: "100%",
                          sm: "auto",
                        },

                        minHeight: 42,

                        px: 2.5,

                        borderRadius: "10px",

                        bgcolor: crmPalette.orange,

                        color: "#ffffff",

                        fontSize: 13,

                        fontWeight: 600,

                        textTransform: "none",

                        boxShadow: "none",

                        "&:hover": {
                          bgcolor:
                            crmPalette.orangeDark,

                          boxShadow: "none",
                        },
                      }}
                    >
                      {salvandoFormulario
                        ? "Salvando..."
                        : emEdicao ? "Salvar alterações" : "Cadastrar proposta"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </DialogContent>
          </Dialog>
        )}

        {currentLead.opportunities.length === 0 && (
          <Paper variant="outlined" sx={{ py: 5, px: 2, textAlign: "center", borderRadius: "14px", borderStyle: "dashed", borderColor: crmPalette.border, bgcolor: "#fff" }}>
            <FileText size={30} color={crmPalette.orangeDark} />
            <Typography sx={{ mt: 1, fontWeight: 600, color: crmPalette.text }}>Nenhuma proposta cadastrada</Typography>
            <Typography sx={{ mt: 0.5, fontSize: 12.5, color: crmPalette.muted }}>
              {canEditCommercialData ? "Clique em Nova proposta para cadastrar a primeira." : "Não há propostas cadastradas para este cliente."}
            </Typography>
          </Paper>
        )}

        {currentLead.opportunities.length > 0 ? (
          <Box sx={{ minWidth: 0 }}>
            {/* CABEÇALHO DAS COLUNAS */}
            <Box data-colunas-propostas
              sx={{
                display: "grid",

                gridTemplateColumns:
                  "minmax(0, 1.8fr) minmax(85px, .8fr) minmax(110px, .9fr) 120px",

                gap: 1.25,

                px: 2,

                py: 1,

                alignItems: "center",

                bgcolor: "#ffffff",

                borderBottom: `1px solid ${crmPalette.border}`,
              }}
            >
              {[
                "Proposta",
                "Etapa",
                "Cadastro",
                "Ações",
              ].map(
                (label) => (
                  <Typography
                    key={label}
                    sx={{
                      color: "#64748b",
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      textAlign: label === "Ações" ? "right" : "left",
                    }}
                  >
                    {label}
                  </Typography>
                ),
              )}
            </Box>

            <Stack
              divider={
                <Box sx={{ borderTop: `1px solid ${crmPalette.border}` }} />
              }
            >
              {currentLead.opportunities.map((opportunity) => {
                const isDeleting = deletingOpportunityId === opportunity.id;
                const anexosDaProposta = documentosPorProposta(opportunity.id);

                return (
                  <Box
                    key={opportunity.id}
                    data-linha-proposta
                    component={"div"}

                    sx={{
                      display: "grid",

                      gridTemplateColumns: "minmax(0, 1.8fr) minmax(85px, .8fr) minmax(110px, .9fr) 120px",

                      gap: {
                        xs: 1.25,
                        md: 1.25,
                      },

                      alignItems: "center",

                      px: {
                        xs: 1.5,
                        md: 2,
                      },

                      py: {
                        xs: 1.25,
                        md: 1,
                      },

                      bgcolor: "#ffffff",

                      transition: "background-color 160ms ease",

                      "&:hover": {
                          bgcolor: "#ffffff",
                        },
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 0,
                        gridColumn: "auto",
                      }}
                    >
                      {(
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: crmPalette.text, fontSize: 14, fontWeight: 600, lineHeight: 1.45, overflowWrap: 'anywhere' }}>
                            {opportunity.title}
                          </Typography>
                          <Typography title={origemValorOportunidade(opportunity)} sx={{ fontSize: 12, color: crmPalette.muted, mt: .5, lineHeight: 1.5 }}>
                            {anexosDaProposta.length} {anexosDaProposta.length === 1 ? 'anexo' : 'anexos'} · {formatarValorOportunidade(opportunity) === 'Não informado' ? 'Valor não informado' : formatarValorOportunidade(opportunity)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Chip
                      label={formatarEtapaOportunidade(opportunity.stage)}
                      size="small"
                      sx={{
                        display: "inline-flex",

                        width: "fit-content",

                        height: 25,

                        borderRadius: "8px",



                        fontSize: 10.5,

                        fontWeight: 600,
                        ...marcadorEtapaOportunidadeSx(opportunity.stage),
                      }}
                    />
                    <Typography
                      sx={{
                        display: "block",

                        color: "#475569",

                        fontSize: 12.5,

                        fontWeight: 600,
                      }}
                    >
                      {formatarData(opportunity.createdAt)}
                    </Typography>



                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      sx={{
                        display: "flex",

                        alignItems: "center",

                        justifyContent: {
                          xs: "flex-start",
                          md: "flex-end",
                        },

                        flexWrap: "wrap",

                        width: {
                          xs: "100%",
                          md: "auto",
                        },
                      }}
                    >
                      {(
                        <>
                          <IconButton
                            component={Link}
                            href={`/oportunidades/cadastro/${currentLead.id}/propostas/${opportunity.id}`}
                            aria-label="Ver detalhes da proposta"
                            title="Ver detalhes da proposta"
                            sx={{ width: 36, height: 36, color: '#334155', borderRadius: '8px', '&:hover': { bgcolor: '#f1f5f9' } }}
                          >
                            <Eye size={19} />
                          </IconButton>

                          {canEditCommercialData ? (
                            <>
                              <IconButton
                                type="button"
                                aria-label="Editar proposta"
                                title="Editar proposta"
                                disabled={isDeleting}
                                onClick={() => abrirEdicaoProposta(opportunity)}
                                sx={{ width: 36, height: 36, borderRadius: '8px', color: '#1d4ed8', '&:hover': { bgcolor: '#f1f5f9' } }}
                              >
                                <Edit3 size={16} />
                              </IconButton>
                              <IconButton
                                type="button"
                                aria-label="Excluir proposta"
                                title="Excluir proposta"
                                disabled={isDeleting}
                                onClick={() =>
                                  handleDeleteOpportunity(opportunity.id)
                                }
                                sx={{ width: 36, height: 36, borderRadius: '8px', color: '#b91c1c', '&:hover': { bgcolor: '#fef2f2' } }}
                              >
                                {isDeleting ? (
                                  <CircularProgress
                                    size={15}
                                    color="inherit"
                                  />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </IconButton>
                            </>
                          ) : null}
                        </>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ) : null}



        {false ? (
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 1.75, md: 2 },
              borderRadius: "12px",
              borderStyle: "dashed",
              borderColor: crmPalette.border,
              bgcolor: "#ffffff",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              sx={{
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: crmPalette.text,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Anexar propostas
                </Typography>
                <Typography
                  sx={{
                    mt: 0.35,
                    color: crmPalette.muted,
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  Selecione até 20 arquivos por envio, com até 20 MB cada. Planilhas .xlsm são aceitas.
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ alignItems: { xs: "stretch", sm: "center" } }}
              >
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<FileText size={15} />}
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
                      setProposalFiles((current) => ({
                        ...current,
                        __geral: selecionados,
                      }));
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
                  disabled={
                    Boolean(uploadingProposalOpportunityId) ||
                    (proposalFiles.__geral ?? []).length === 0
                  }
                  startIcon={
                    Boolean(uploadingProposalOpportunityId) ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PlusCircle size={15} />
                    )
                  }
                  onClick={() => handleUploadProposalDocuments("__geral")}
                  sx={{
                    minHeight: 40,
                    borderRadius: "10px",
                    bgcolor: crmPalette.orange,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: crmPalette.orangeDark,
                      boxShadow: "none",
                    },
                  }}
                >
                  {Boolean(uploadingProposalOpportunityId)
                    ? "Anexando..."
                    : "Anexar"}
                </Button>
              </Stack>
            </Stack>

            {erroAnexo && <Alert severity="error" sx={{ mt: 1.5 }}>{erroAnexo}</Alert>}
            {(proposalFiles.__geral ?? []).length > 0 ? (
              <Stack
                direction="row"
                spacing={0.75}
                useFlexGap
                sx={{ mt: 1.5, flexWrap: "wrap" }}
              >
                {(proposalFiles.__geral ?? []).map((file) => (
                  <Chip
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    label={file.name}
                    size="small"
                    onDelete={() =>
                      setProposalFiles((current) => ({
                        ...current,
                        __geral: (current.__geral ?? []).filter(
                          (currentFile) =>
                            !(
                              currentFile.name === file.name &&
                              currentFile.size === file.size &&
                              currentFile.lastModified === file.lastModified
                            ),
                        ),
                      }))
                    }
                    sx={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      bgcolor: "#f1f5f9",
                      color: crmPalette.text,
                      fontSize: 12,
                      fontWeight: 600,
                      "& .MuiChip-label": {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
                  />
                ))}
              </Stack>
            ) : null}
          </Paper>
        ) : null}

        {documentosSemProposta.length > 0 ? (
          <Stack spacing={1.25}>
            <Typography
              sx={{
                color: crmPalette.text,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Anexos sem proposta vinculada
            </Typography>

            {documentosSemProposta.map((document) => (
              <Paper
                key={document.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  borderColor: crmPalette.border,
                  color: "inherit",
                  cursor: "pointer",
                  bgcolor: "#ffffff",
                  transition:
                    "background-color 160ms ease, border-color 160ms ease",
                  "&:hover": {
                    bgcolor: "#ffffff",
                    borderColor: crmPalette.orange,
                  },
                }}
                onClick={() => handleOpenDocument(document)}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    minWidth: 0,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: "center", minWidth: 0 }}
                  >
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        color: "#64748b",
                      }}
                    >
                      <FileText size={18} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: crmPalette.text,
                          fontSize: 14,
                          fontWeight: 600,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {document.originalName}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.4,
                          color: crmPalette.muted,
                          fontSize: 13,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {document.description || "Oportunidade/Proposta"} •{" "}
                        {formatarData(document.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      flexShrink: 0,
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      label="Visualizar"
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenDocument(document);
                      }}
                      sx={{
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        color: crmPalette.blue,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    />

                    {canEditCommercialData ? (
                      <IconButton
                        type="button"
                        aria-label={`Excluir ${document.originalName}`}
                        title="Excluir proposta"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDeleteDocumentDialog(document);
                        }}
                        sx={{
                          width: 32,
                          height: 32,
                          color: "#b91c1c",
                          bgcolor: "#fef2f2",
                          border: "1px solid #fecaca",

                          "&:hover": {
                            bgcolor: "#fee2e2",
                          },
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    ) : null}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </CrmSection>
  );
}
