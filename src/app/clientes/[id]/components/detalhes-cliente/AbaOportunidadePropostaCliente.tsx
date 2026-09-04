"use client";

import type { FormEvent } from "react";
import Link from "next/link";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
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

import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";
import { formatOpportunityStage } from "@/services/crm.service";

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
  const proposalOptions =
    opportunityProposalForm.proposalType === "ARMAZENAGEM"
      ? STORAGE_PROPOSAL_OPTIONS
      : TRANSPORT_PROPOSAL_OPTIONS;
  const selectedProposalOptions =
    opportunityProposalForm.proposalType === "ARMAZENAGEM"
      ? opportunityProposalForm.storageOptions
      : opportunityProposalForm.transportOptions;
  const customSelectedOptions = selectedProposalOptions.filter(
    (option) => !proposalOptions.includes(option as never),
  );

  const editingProposalOptions =
    editingOpportunityForm.proposalType === "ARMAZENAGEM"
      ? STORAGE_PROPOSAL_OPTIONS
      : TRANSPORT_PROPOSAL_OPTIONS;

  const editingSelectedProposalOptions =
    editingOpportunityForm.proposalType === "ARMAZENAGEM"
      ? editingOpportunityForm.storageOptions
      : editingOpportunityForm.transportOptions;

  const editingCustomSelectedOptions =
    editingSelectedProposalOptions.filter(
      (option) =>
        !editingProposalOptions.includes(option as never),
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
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: "14px",
        border: `1px solid ${crmPalette.border}`,
        bgcolor: "#ffffff",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack spacing={2.5}>
        <CabecalhoSecao
          title="Oportunidades e propostas"
          description="Cadastre, acompanhe e gerencie as propostas comerciais deste cliente."
        />

        {canEditCommercialData ? (
          <Box
            component="form"
            onSubmit={handleCreateOpportunityProposal}
          >
            <Stack spacing={2}>
              {/* =========================================
          1. DADOS PRINCIPAIS DA NOVA PROPOSTA
      ========================================== */}
              <Paper
                variant="outlined"
                sx={{
                  overflow: "hidden",
                  borderRadius: "16px",
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

                        bgcolor: "#fff7ed",

                        color: crmPalette.orangeDark,
                      }}
                    >
                      <PlusCircle size={19} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: crmPalette.text,

                          fontSize: 15,

                          fontWeight: 900,

                          lineHeight: 1.3,
                        }}
                      >
                        Nova proposta
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.25,

                          color: crmPalette.muted,

                          fontSize: 11.5,

                          lineHeight: 1.45,
                        }}
                      >
                        Informe os dados principais da oportunidade comercial.
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
                      },

                      gap: 1.5,
                    }}
                  >
                    <TextField
                      required
                      fullWidth
                      size="small"
                      label="Título da proposta"
                      placeholder="Ex.: Operação Curitiba"
                      value={
                        opportunityProposalForm.title
                      }
                      onChange={(event) =>
                        setFormularioPropostaOportunidade(
                          (current) => ({
                            ...current,

                            title:
                              event.target.value,
                          }),
                        )
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      required
                      select
                      fullWidth
                      size="small"
                      label="Tipo de proposta"
                      value={
                        opportunityProposalForm.proposalType
                      }
                      onChange={(event) =>
                        setFormularioPropostaOportunidade(
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
                      sx={textFieldSx}
                    >
                      <MenuItem value="">
                        Selecione
                      </MenuItem>

                      <MenuItem value="TRANSPORTE_RODOVIARIO">
                        Transporte rodoviário
                      </MenuItem>

                      <MenuItem value="ARMAZENAGEM">
                        Armazenagem
                      </MenuItem>
                    </TextField>
                  </Box>
                </Box>
              </Paper>

              {/* =========================================
          2. SERVIÇOS
      ========================================== */}
              {opportunityProposalForm.proposalType ? (
                <Paper
                  variant="outlined"
                  sx={{
                    overflow: "hidden",

                    borderRadius: "16px",

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

                          bgcolor: "#fff7ed",

                          color:
                            crmPalette.orangeDark,
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

                            fontWeight: 900,

                            lineHeight: 1.3,
                          }}
                        >
                          {opportunityProposalForm
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
                                toggleProposalOption(
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

                              fontWeight: 700,
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
                          opportunityProposalForm.customOption
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
                            (current) => ({
                              ...current,

                              customOption:
                                event.target.value,
                            }),
                          )
                        }
                        sx={textFieldSx}
                      />

                      <Button
                        type="button"
                        variant="outlined"
                        startIcon={
                          <PlusCircle size={15} />
                        }
                        disabled={
                          !opportunityProposalForm.customOption.trim()
                        }
                        onClick={
                          addCustomProposalOption
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
              {opportunityProposalForm.proposalType ===
                "TRANSPORTE_RODOVIARIO" ? (
                <Paper
                  variant="outlined"
                  sx={{
                    overflow: "hidden",

                    borderRadius: "16px",

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

                          bgcolor: "#fff7ed",

                          color:
                            crmPalette.orangeDark,
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

                            fontWeight: 900,
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
                          opportunityProposalForm.origin
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
                            (current) => ({
                              ...current,

                              origin:
                                event.target.value,
                            }),
                          )
                        }
                        sx={textFieldSx}
                      />

                      <TextField
                        required
                        fullWidth
                        size="small"
                        label="Destino"
                        value={
                          opportunityProposalForm.destination
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
                            (current) => ({
                              ...current,

                              destination:
                                event.target.value,
                            }),
                          )
                        }
                        sx={textFieldSx}
                      />

                      <TextField
                        required
                        select
                        fullWidth
                        size="small"
                        label="Tipo de veículo"
                        value={
                          opportunityProposalForm.vehicleType
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
                            (current) => ({
                              ...current,

                              vehicleType:
                                event.target.value,
                            }),
                          )
                        }
                        sx={textFieldSx}
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
                          opportunityProposalForm.cargoType
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
                            (current) => ({
                              ...current,

                              cargoType:
                                event.target.value,
                            }),
                          )
                        }
                        sx={textFieldSx}
                      />

                      <TextField
                        required
                        fullWidth
                        size="small"
                        label="Peso médio"
                        placeholder="Ex.: 1.200 kg"
                        value={
                          opportunityProposalForm.averageWeight
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
                            (current) => ({
                              ...current,

                              averageWeight:
                                event.target.value,
                            }),
                          )
                        }
                        sx={textFieldSx}
                      />

                      <TextField
                        required
                        fullWidth
                        size="small"
                        label="Valor agregado"
                        placeholder="Ex.: R$ 80.000,00"
                        value={
                          opportunityProposalForm.aggregateValue
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
                            (current) => ({
                              ...current,

                              aggregateValue:
                                event.target.value,
                            }),
                          )
                        }
                        sx={textFieldSx}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="Cubagem"
                        placeholder="Opcional"
                        value={
                          opportunityProposalForm.cubage
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
                            (current) => ({
                              ...current,

                              cubage:
                                event.target.value,
                            }),
                          )
                        }
                        sx={textFieldSx}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="Quantidade de embarques/mês"
                        placeholder="Opcional"
                        value={
                          opportunityProposalForm.monthlyShipments
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
                            (current) => ({
                              ...current,

                              monthlyShipments:
                                event.target.value,
                            }),
                          )
                        }
                        sx={textFieldSx}
                      />

                      <TextField
                        required
                        select
                        fullWidth
                        size="small"
                        label="Produto perigoso"
                        value={
                          opportunityProposalForm.dangerousGoods
                        }
                        onChange={(event) =>
                          setFormularioPropostaOportunidade(
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
                        sx={textFieldSx}
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

                      {opportunityProposalForm.dangerousGoods ===
                        "SIM" ? (
                        <TextField
                          required
                          fullWidth
                          multiline
                          minRows={2}
                          label="FDS / Ficha de Emergência"
                          placeholder="Informe os dados ou instruções da FDS/Ficha de Emergência"
                          value={
                            opportunityProposalForm.dangerousGoodsInfo
                          }
                          onChange={(event) =>
                            setFormularioPropostaOportunidade(
                              (current) => ({
                                ...current,

                                dangerousGoodsInfo:
                                  event.target
                                    .value,
                              }),
                            )
                          }
                          sx={{
                            ...textFieldSx,

                            gridColumn: {
                              xs: "auto",
                              md: "1 / -1",
                            },
                          }}
                        />
                      ) : null}
                    </Box>
                  </Box>
                </Paper>
              ) : null}

              {/* =========================================
          4. VALORES DA PROPOSTA
      ========================================== */}
              {opportunityProposalForm.proposalType ===
                "TRANSPORTE_RODOVIARIO" ? (
                <Paper
                  variant="outlined"
                  sx={{
                    overflow: "hidden",

                    borderRadius: "16px",

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

                          bgcolor: "#fff7ed",

                          color:
                            crmPalette.orangeDark,
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

                            fontWeight: 900,
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
                          value={
                            opportunityProposalForm
                              .transportValues[
                            item
                            ] ?? ""
                          }
                          onChange={(event) =>
                            setFormularioPropostaOportunidade(
                              (current) => ({
                                ...current,

                                transportValues: {
                                  ...current.transportValues,

                                  [item]:
                                    event.target
                                      .value,
                                },
                              }),
                            )
                          }
                          sx={textFieldSx}
                        />
                      ),
                    )}
                  </Box>
                </Paper>
              ) : null}

              {/* =========================================
          ERRO
      ========================================== */}
              {opportunityProposalError ? (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: "12px",
                  }}
                >
                  {opportunityProposalError}
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
                  type="submit"
                  variant="contained"
                  disabled={
                    savingOpportunityProposal
                  }
                  startIcon={
                    savingOpportunityProposal ? (
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

                    fontWeight: 900,

                    textTransform: "none",

                    boxShadow: "none",

                    "&:hover": {
                      bgcolor:
                        crmPalette.orangeDark,

                      boxShadow: "none",
                    },
                  }}
                >
                  {savingOpportunityProposal
                    ? "Salvando..."
                    : "Cadastrar proposta"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        ) : (
          <Alert
            severity="info"
            sx={{
              borderRadius: "12px",
            }}
          >
            Nenhuma proposta cadastrada para este cliente.
          </Alert>
        )}

        {currentLead.opportunities.length > 0 ? (
          <Paper
            variant="outlined"
            sx={{
              overflow: "hidden",
              borderRadius: "16px",
              borderColor: "#e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "none",
            }}
          >
            {/* CABEÇALHO DA LISTA */}
            <Box
              sx={{
                px: {
                  xs: 1.75,
                  md: 2,
                },

                py: 1.5,

                borderBottom: `1px solid ${crmPalette.border}`,

                bgcolor: "#ffffff",
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
                sx={{
                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },

                  justifyContent: "space-between",
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

                      bgcolor: "#fff7ed",

                      color: crmPalette.orangeDark,
                    }}
                  >
                    <FileText size={18} />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color: crmPalette.text,

                        fontSize: 15,

                        fontWeight: 900,

                        lineHeight: 1.3,
                      }}
                    >
                      Propostas cadastradas
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,

                        color: crmPalette.muted,

                        fontSize: 11.5,
                      }}
                    >
                      Acompanhe as propostas comerciais deste cliente.
                    </Typography>
                  </Box>
                </Stack>

                <Chip
                  label={
                    currentLead.opportunities.length === 1
                      ? "1 proposta"
                      : `${currentLead.opportunities.length} propostas`
                  }
                  size="small"
                  sx={{
                    height: 26,

                    borderRadius: "8px",

                    bgcolor: "#f1f5f9",

                    color: "#475569",

                    fontSize: 11,

                    fontWeight: 900,
                  }}
                />
              </Stack>
            </Box>

            {/* CABEÇALHO DAS COLUNAS */}
            <Box
              sx={{
                display: {
                  xs: "none",
                  md: "grid",
                },

                gridTemplateColumns:
                  "minmax(0, 1.6fr) 130px 150px 110px 210px",

                gap: 1.25,

                px: 2,

                py: 1,

                alignItems: "center",

                bgcolor: "#f8fafc",

                borderBottom: `1px solid ${crmPalette.border}`,
              }}
            >
              {[
                "Proposta",
                "Etapa",
                "Cadastro",
                "Anexos",
                "Ações",
              ].map(
                (label) => (
                  <Typography
                    key={label}
                    sx={{
                      color: "#64748b",
                      fontSize: 10.5,
                      fontWeight: 900,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
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
                const isEditing = editingOpportunityId === opportunity.id;
                const isSaving =
                  savingEditingOpportunityId === opportunity.id;
                const isDeleting = deletingOpportunityId === opportunity.id;
                const anexosDaProposta = documentosPorProposta(opportunity.id);

                return (
                  <Box
                    key={opportunity.id}
                    component={isEditing ? "form" : "div"}
                    onSubmit={
                      isEditing
                        ? (event: FormEvent<HTMLFormElement>) =>
                          handleUpdateOpportunity(opportunity.id, event)
                        : undefined
                    }
                    sx={{
                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1fr",

                        md: isEditing
                          ? "minmax(0, 1fr)"
                          : "minmax(0, 1.6fr) 130px 150px 110px 210px",
                      },

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
                        xs: 1.5,
                        md: 1.4,
                      },

                      bgcolor: isEditing ? "#fffaf5" : "#ffffff",

                      transition: "background-color 160ms ease",

                      "&:hover": isEditing
                        ? undefined
                        : {
                          bgcolor: "#f8fafc",
                        },
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 0,
                        gridColumn: isEditing ? "1 / -1" : "auto",
                      }}
                    >
                      {isEditing ? (
                        <Paper
                          variant="outlined"
                          sx={{
                            overflow: "hidden",
                            borderRadius: "16px",
                            borderColor: "#e2e8f0",
                            bgcolor: "#ffffff",
                            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
                          }}
                        >
                          {/* CABEÇALHO */}
                          <Box
                            sx={{
                              px: { xs: 1.75, md: 2 },
                              py: 1.5,
                              borderBottom: `1px solid ${crmPalette.border}`,
                              bgcolor: "#fff7ed",
                            }}
                          >
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
                                spacing={1.25}
                                sx={{
                                  alignItems: "center",
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    display: "grid",
                                    placeItems: "center",
                                    flexShrink: 0,
                                    borderRadius: "12px",
                                    color: crmPalette.orangeDark,
                                    bgcolor: "#ffedd5",
                                    border: "1px solid #fed7aa",
                                  }}
                                >
                                  <Edit3 size={18} />
                                </Box>

                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    sx={{
                                      color: "#c2410c",
                                      fontSize: 14,
                                      fontWeight: 900,
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    Editar proposta
                                  </Typography>

                                  <Typography
                                    sx={{
                                      mt: 0.2,
                                      color: crmPalette.muted,
                                      fontSize: 11.5,
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    Atualize os dados comerciais da proposta selecionada.
                                  </Typography>
                                </Box>
                              </Stack>

                              <Stack
                                direction="row"
                                spacing={0.75}
                                useFlexGap
                                sx={{
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                }}
                              >
                                <Chip
                                  label={formatOpportunityStage(opportunity.stage)}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    borderRadius: "8px",
                                    bgcolor: "#ffedd5",
                                    color: crmPalette.orangeDark,
                                    fontSize: 10.5,
                                    fontWeight: 900,
                                  }}
                                />

                                <Chip
                                  label={formatarData(opportunity.createdAt)}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    borderRadius: "8px",
                                    bgcolor: "#f1f5f9",
                                    color: "#475569",
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                  }}
                                />
                              </Stack>
                            </Stack>
                          </Box>

                          {/* CORPO */}
                          <Box
                            sx={{
                              p: { xs: 1.75, md: 2 },
                            }}
                          >
                            <Stack spacing={2}>
                              {/* CAMPOS PRINCIPAIS */}
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
                                <TextField
                                  required
                                  fullWidth
                                  size="small"
                                  label="Título da proposta"
                                  placeholder="Digite um título para identificar a proposta"
                                  value={editingOpportunityForm.title}
                                  onChange={(event) =>
                                    updateEditingOpportunityForm(
                                      "title",
                                      event.target.value,
                                    )
                                  }
                                  sx={textFieldSx}
                                />

                                <TextField
                                  required
                                  select
                                  fullWidth
                                  size="small"
                                  label="Tipo de proposta"
                                  value={editingOpportunityForm.proposalType}
                                  onChange={(event) =>
                                    setEditingOpportunityForm((current) => ({
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
                                      transportValues: Object.fromEntries(
                                        TRANSPORT_PRICE_ITEMS.map((item) => [item, ""]),
                                      ) as Record<string, string>,
                                      customOption: "",
                                    }))
                                  }
                                  sx={textFieldSx}
                                >
                                  <MenuItem value="">Selecione</MenuItem>
                                  <MenuItem value="TRANSPORTE_RODOVIARIO">
                                    Transporte rodoviário
                                  </MenuItem>
                                  <MenuItem value="ARMAZENAGEM">
                                    Armazenagem
                                  </MenuItem>
                                </TextField>
                              </Box>

                              {/* SERVIÇOS */}
                              {editingOpportunityForm.proposalType ? (
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    overflow: "hidden",
                                    borderRadius: "14px",
                                    borderColor: "#e2e8f0",
                                    bgcolor: "#ffffff",
                                    boxShadow: "none",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      px: { xs: 1.5, md: 1.75 },
                                      py: 1.25,
                                      borderBottom: `1px solid ${crmPalette.border}`,
                                      bgcolor: "#faf5ff",
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        color: "#6d28d9",
                                        fontSize: 13,
                                        fontWeight: 900,
                                      }}
                                    >
                                      {editingOpportunityForm.proposalType === "ARMAZENAGEM"
                                        ? "Serviços de armazenagem"
                                        : "Serviços de transporte rodoviário"}
                                    </Typography>

                                    <Typography
                                      sx={{
                                        mt: 0.2,
                                        color: crmPalette.muted,
                                        fontSize: 11.5,
                                      }}
                                    >
                                      Selecione os serviços que fazem parte desta proposta.
                                    </Typography>
                                  </Box>

                                  <Box
                                    sx={{
                                      p: { xs: 1.5, md: 1.75 },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                          xs: "1fr",
                                          sm: "repeat(2, minmax(0, 1fr))",
                                          lg: "repeat(3, minmax(0, 1fr))",
                                        },
                                        gap: 0.5,
                                      }}
                                    >
                                      {[
                                        ...editingProposalOptions,
                                        ...editingCustomSelectedOptions,
                                      ].map((option) => (
                                        <FormControlLabel
                                          key={option}
                                          control={
                                            <Checkbox
                                              checked={editingSelectedProposalOptions.includes(option)}
                                              onChange={() =>
                                                toggleEditingProposalOption(option)
                                              }
                                              size="small"
                                              sx={{
                                                color: crmPalette.muted,
                                                "&.Mui-checked": {
                                                  color: crmPalette.orange,
                                                },
                                              }}
                                            />
                                          }
                                          label={option}
                                          sx={{
                                            m: 0,
                                            minHeight: 34,
                                            color: crmPalette.text,
                                            "& .MuiFormControlLabel-label": {
                                              fontSize: 13,
                                              fontWeight: 700,
                                              overflowWrap: "anywhere",
                                            },
                                          }}
                                        />
                                      ))}
                                    </Box>

                                    <Stack
                                      direction={{ xs: "column", sm: "row" }}
                                      spacing={1}
                                      sx={{
                                        mt: 1.5,
                                        alignItems: { xs: "stretch", sm: "center" },
                                      }}
                                    >
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Outros"
                                        placeholder="Digite uma opção que não está na lista"
                                        value={editingOpportunityForm.customOption}
                                        onChange={(event) =>
                                          updateEditingOpportunityForm(
                                            "customOption",
                                            event.target.value,
                                          )
                                        }
                                        sx={textFieldSx}
                                      />

                                      <Button
                                        type="button"
                                        variant="outlined"
                                        startIcon={<PlusCircle size={15} />}
                                        disabled={
                                          !editingOpportunityForm.customOption.trim() ||
                                          isSaving ||
                                          isDeleting
                                        }
                                        onClick={addCustomEditingProposalOption}
                                        sx={{
                                          ...secondaryButtonSx,
                                          minHeight: 40,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        Adicionar
                                      </Button>
                                    </Stack>
                                  </Box>
                                </Paper>
                              ) : null}

                              {/* INFORMAÇÕES OPERACIONAIS */}
                              {editingOpportunityForm.proposalType === "TRANSPORTE_RODOVIARIO" ? (
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    overflow: "hidden",
                                    borderRadius: "14px",
                                    borderColor: "#d1fae5",
                                    bgcolor: "#ffffff",
                                    boxShadow: "none",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      px: { xs: 1.5, md: 1.75 },
                                      py: 1.25,
                                      borderBottom: `1px solid ${crmPalette.border}`,
                                      bgcolor: "#ecfdf5",
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        color: "#047857",
                                        fontSize: 13,
                                        fontWeight: 900,
                                      }}
                                    >
                                      Informações operacionais
                                    </Typography>

                                    <Typography
                                      sx={{
                                        mt: 0.2,
                                        color: crmPalette.muted,
                                        fontSize: 11.5,
                                      }}
                                    >
                                      Dados utilizados para montar a cotação e a proposta comercial.
                                    </Typography>
                                  </Box>

                                  <Box
                                    sx={{
                                      p: { xs: 1.5, md: 1.75 },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                          xs: "1fr",
                                          md: "repeat(2, minmax(0, 1fr))",
                                          xl: "repeat(3, minmax(0, 1fr))",
                                        },
                                        gap: 1.25,
                                      }}
                                    >
                                      <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label="Origem"
                                        value={editingOpportunityForm.origin}
                                        onChange={(event) =>
                                          updateEditingOpportunityForm(
                                            "origin",
                                            event.target.value,
                                          )
                                        }
                                        sx={textFieldSx}
                                      />

                                      <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label="Destino"
                                        value={editingOpportunityForm.destination}
                                        onChange={(event) =>
                                          updateEditingOpportunityForm(
                                            "destination",
                                            event.target.value,
                                          )
                                        }
                                        sx={textFieldSx}
                                      />

                                      <TextField
                                        required
                                        select
                                        fullWidth
                                        size="small"
                                        label="Tipo de veículo"
                                        value={editingOpportunityForm.vehicleType}
                                        onChange={(event) =>
                                          updateEditingOpportunityForm(
                                            "vehicleType",
                                            event.target.value,
                                          )
                                        }
                                        sx={textFieldSx}
                                      >
                                        <MenuItem value="">Selecione</MenuItem>
                                        {VEHICLE_TYPE_OPTIONS.map((option) => (
                                          <MenuItem key={option} value={option}>
                                            {option}
                                          </MenuItem>
                                        ))}
                                      </TextField>

                                      <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label="Tipo de carga"
                                        value={editingOpportunityForm.cargoType}
                                        onChange={(event) =>
                                          updateEditingOpportunityForm(
                                            "cargoType",
                                            event.target.value,
                                          )
                                        }
                                        sx={textFieldSx}
                                      />

                                      <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label="Peso médio"
                                        placeholder="Ex.: 1.200 kg"
                                        value={editingOpportunityForm.averageWeight}
                                        onChange={(event) =>
                                          updateEditingOpportunityForm(
                                            "averageWeight",
                                            event.target.value,
                                          )
                                        }
                                        sx={textFieldSx}
                                      />

                                      <TextField
                                        required
                                        fullWidth
                                        size="small"
                                        label="Valor agregado"
                                        placeholder="Ex.: R$ 80.000,00"
                                        value={editingOpportunityForm.aggregateValue}
                                        onChange={(event) =>
                                          updateEditingOpportunityForm(
                                            "aggregateValue",
                                            event.target.value,
                                          )
                                        }
                                        sx={textFieldSx}
                                      />

                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Cubagem"
                                        placeholder="Opcional"
                                        value={editingOpportunityForm.cubage}
                                        onChange={(event) =>
                                          updateEditingOpportunityForm(
                                            "cubage",
                                            event.target.value,
                                          )
                                        }
                                        sx={textFieldSx}
                                      />

                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Quantidade de embarques/mês"
                                        placeholder="Opcional"
                                        value={editingOpportunityForm.monthlyShipments}
                                        onChange={(event) =>
                                          updateEditingOpportunityForm(
                                            "monthlyShipments",
                                            event.target.value,
                                          )
                                        }
                                        sx={textFieldSx}
                                      />

                                      <TextField
                                        required
                                        select
                                        fullWidth
                                        size="small"
                                        label="Produto perigoso"
                                        value={editingOpportunityForm.dangerousGoods}
                                        onChange={(event) =>
                                          setEditingOpportunityForm((current) => ({
                                            ...current,
                                            dangerousGoods:
                                              event.target
                                                .value as FormularioPropostaOportunidade["dangerousGoods"],
                                            dangerousGoodsInfo:
                                              event.target.value === "SIM"
                                                ? current.dangerousGoodsInfo
                                                : "",
                                          }))
                                        }
                                        sx={textFieldSx}
                                      >
                                        <MenuItem value="">Selecione</MenuItem>
                                        <MenuItem value="NAO">Não</MenuItem>
                                        <MenuItem value="SIM">Sim</MenuItem>
                                      </TextField>

                                      {editingOpportunityForm.dangerousGoods === "SIM" ? (
                                        <TextField
                                          required
                                          fullWidth
                                          multiline
                                          minRows={2}
                                          label="FDS / Ficha de Emergência"
                                          placeholder="Informe os dados ou instruções da FDS/Ficha de Emergência"
                                          value={editingOpportunityForm.dangerousGoodsInfo}
                                          onChange={(event) =>
                                            updateEditingOpportunityForm(
                                              "dangerousGoodsInfo",
                                              event.target.value,
                                            )
                                          }
                                          sx={{
                                            ...textFieldSx,
                                            gridColumn: { xs: "auto", md: "1 / -1" },
                                          }}
                                        />
                                      ) : null}
                                    </Box>

                                    <Box sx={{ mt: 2 }}>
                                      <Typography
                                        sx={{
                                          color: crmPalette.text,
                                          fontSize: 13,
                                          fontWeight: 900,
                                        }}
                                      >
                                        Valores da proposta
                                      </Typography>

                                      <Box
                                        sx={{
                                          mt: 1.25,
                                          display: "grid",
                                          gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "repeat(2, minmax(0, 1fr))",
                                            xl: "repeat(3, minmax(0, 1fr))",
                                          },
                                          gap: 1.25,
                                        }}
                                      >
                                        {TRANSPORT_PRICE_ITEMS.map((item) => (
                                          <TextField
                                            key={item}
                                            fullWidth
                                            size="small"
                                            label={item}
                                            placeholder="R$ 0,00"
                                            value={
                                              editingOpportunityForm.transportValues[item] ?? ""
                                            }
                                            onChange={(event) =>
                                              setEditingOpportunityForm((current) => ({
                                                ...current,
                                                transportValues: {
                                                  ...current.transportValues,
                                                  [item]: event.target.value,
                                                },
                                              }))
                                            }
                                            sx={textFieldSx}
                                          />
                                        ))}
                                      </Box>
                                    </Box>
                                  </Box>
                                </Paper>
                              ) : null}
                            </Stack>
                          </Box>

                          {/* RODAPÉ */}
                          <Box
                            sx={{
                              px: { xs: 1.75, md: 2 },
                              py: 1.4,
                              borderTop: `1px solid ${crmPalette.border}`,
                              bgcolor: "#f8fafc",
                            }}
                          >
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1.25}
                              sx={{
                                alignItems: { xs: "stretch", sm: "center" },
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography
                                sx={{
                                  color: crmPalette.muted,
                                  fontSize: 11.5,
                                  lineHeight: 1.5,
                                }}
                              >
                                Revise as informações antes de salvar as alterações.
                              </Typography>

                              <Stack
                                direction={{ xs: "column-reverse", sm: "row" }}
                                spacing={1}
                              >
                                <Button
                                  type="button"
                                  variant="outlined"
                                  disabled={isSaving || isDeleting}
                                  startIcon={<X size={15} />}
                                  onClick={() => setEditingOpportunityId(null)}
                                  sx={{
                                    ...secondaryButtonSx,
                                    minHeight: 40,
                                    px: 1.75,
                                    borderRadius: "10px",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Cancelar
                                </Button>

                                <Button
                                  type="submit"
                                  variant="contained"
                                  disabled={isSaving || isDeleting}
                                  startIcon={
                                    isSaving ? (
                                      <CircularProgress size={15} color="inherit" />
                                    ) : (
                                      <Save size={15} />
                                    )
                                  }
                                  sx={{
                                    minHeight: 40,
                                    px: 2,
                                    borderRadius: "10px",
                                    bgcolor: crmPalette.orange,
                                    fontSize: 12,
                                    fontWeight: 900,
                                    textTransform: "none",
                                    whiteSpace: "nowrap",
                                    boxShadow: "none",
                                    "&:hover": {
                                      bgcolor: crmPalette.orangeDark,
                                      boxShadow: "none",
                                    },
                                  }}
                                >
                                  {isSaving ? "Salvando..." : "Salvar alterações"}
                                </Button>
                              </Stack>
                            </Stack>
                          </Box>
                        </Paper>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center", minWidth: 0 }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,

                              display: "grid",
                              placeItems: "center",

                              flexShrink: 0,

                              borderRadius: "10px",

                              color: "#475569",

                              bgcolor: "#f8fafc",

                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <FileText size={17} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                color: "#0f172a",

                                fontSize: 13.5,

                                fontWeight: 850,

                                lineHeight: 1.4,

                                overflowWrap: "anywhere",
                              }}
                            >
                              {opportunity.title}
                            </Typography>
                            <Typography
                              sx={{
                                display: { xs: "block", md: "none" },
                                mt: 0.35,
                                color: crmPalette.muted,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {formatOpportunityStage(opportunity.stage)} -{" "}
                              {formatarData(opportunity.createdAt)}
                            </Typography>
                          </Box>
                        </Stack>
                      )}
                    </Box>

                    <Chip
                      label={formatOpportunityStage(opportunity.stage)}
                      size="small"
                      sx={{
                        display: isEditing
                          ? "none"
                          : {
                            xs: "none",
                            md: "inline-flex",
                          },

                        width: "fit-content",

                        height: 25,

                        borderRadius: "8px",

                        bgcolor: "#eff6ff",

                        color: "#1d4ed8",

                        border: "1px solid #dbeafe",

                        fontSize: 10.5,

                        fontWeight: 900,
                      }}
                    />
                    <Typography
                      sx={{
                        display: isEditing
                          ? "none"
                          : {
                            xs: "none",
                            md: "block",
                          },

                        color: "#475569",

                        fontSize: 12.5,

                        fontWeight: 700,
                      }}
                    >
                      {formatarData(opportunity.createdAt)}
                    </Typography>

                    <Chip
                      label={`${anexosDaProposta.length} anexo${anexosDaProposta.length === 1 ? "" : "s"
                        }`}
                      size="small"
                      sx={{
                        display: isEditing
                          ? "none"
                          : "inline-flex",

                        width: "fit-content",

                        height: 25,

                        borderRadius: "8px",

                        bgcolor: "#f8fafc",

                        color: "#475569",

                        border: "1px solid #e2e8f0",

                        fontSize: 10.5,

                        fontWeight: 800,
                      }}
                    />

                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      sx={{
                        display: isEditing ? "none" : "flex",

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
                      {isEditing ? (
                        <>
                          <IconButton
                            type="button"
                            aria-label="Cancelar edição"
                            title="Cancelar edição"
                            disabled={isSaving || isDeleting}
                            onClick={() => setEditingOpportunityId(null)}
                            sx={{
                              width: 34,
                              height: 34,
                              color: "#475569",
                              bgcolor: "#f8fafc",
                              border: `1px solid ${crmPalette.border}`,
                              "&:hover": { bgcolor: "#eef2f7" },
                            }}
                          >
                            <X size={16} />
                          </IconButton>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSaving || isDeleting}
                            startIcon={
                              isSaving ? (
                                <CircularProgress size={15} color="inherit" />
                              ) : (
                                <Save size={15} />
                              )
                            }
                            sx={{
                              minHeight: 34,
                              borderRadius: "9px",
                              bgcolor: crmPalette.orange,
                              fontSize: 12,
                              fontWeight: 900,
                              textTransform: "none",
                              boxShadow: "none",
                              "&:hover": {
                                bgcolor: crmPalette.orangeDark,
                                boxShadow: "none",
                              },
                            }}
                          >
                            {isSaving ? "Salvando..." : "Salvar"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            component={Link}
                            href={`/clientes/${currentLead.id}/propostas/${opportunity.id}`}
                            variant="outlined"
                            startIcon={<Eye size={15} />}
                            sx={{
                              minHeight: 34,

                              px: 1.4,

                              borderRadius: "9px",

                              borderColor: "#e2e8f0",

                              bgcolor: "#ffffff",

                              color: "#334155",

                              fontSize: 11.5,

                              fontWeight: 800,

                              textTransform: "none",

                              whiteSpace: "nowrap",

                              boxShadow: "none",

                              "&:hover": {
                                borderColor: "#cbd5e1",

                                bgcolor: "#f8fafc",

                                color: "#0f172a",

                                boxShadow: "none",
                              },
                            }}
                          >
                            Ver detalhes
                          </Button>

                          {canEditCommercialData ? (
                            <>
                              <IconButton
                                type="button"
                                aria-label="Editar proposta"
                                title="Editar proposta"
                                disabled={isDeleting}
                                onClick={() => startEditingOpportunity(opportunity)}
                                sx={{
                                  width: 34,
                                  height: 34,
                                  color: "#1d4ed8",
                                  bgcolor: "#eff6ff",
                                  border: "1px solid #bfdbfe",
                                  "&:hover": { bgcolor: "#dbeafe" },
                                }}
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
                                sx={{
                                  width: 36,
                                  height: 36,

                                  borderRadius: "10px",

                                  color: "#b91c1c",

                                  bgcolor: "#fef2f2",

                                  border: "1px solid #fecaca",

                                  transition: [
                                    "background-color 160ms ease",
                                    "border-color 160ms ease",
                                    "transform 160ms ease",
                                  ].join(", "),

                                  "&:hover": {
                                    bgcolor: "#fee2e2",
                                    borderColor: "#fca5a5",
                                    transform: "translateY(-1px)",
                                  },

                                  "&.Mui-disabled": {
                                    opacity: 0.5,
                                  },
                                }}
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
          </Paper>
        ) : null}

        {currentLead.opportunities.length > 0 ? (
          <Box
            sx={{
              display: "none",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "repeat(2, minmax(0, 1fr))",
              },
              gap: 1.25,
            }}
          >
            {currentLead.opportunities.map((opportunity) => {
              const isEditing = editingOpportunityId === opportunity.id;
              const isSaving = savingEditingOpportunityId === opportunity.id;
              const isDeleting = deletingOpportunityId === opportunity.id;
              const isUploading =
                uploadingProposalOpportunityId === opportunity.id;
              const selectedFiles = proposalFiles[opportunity.id] ?? [];
              const anexosDaProposta = documentosPorProposta(opportunity.id);

              return (
                <Paper
                  key={opportunity.id}
                  component={isEditing ? "form" : "article"}
                  variant="outlined"
                  onSubmit={
                    isEditing
                      ? (event: FormEvent<HTMLFormElement>) =>
                        handleUpdateOpportunity(opportunity.id, event)
                      : undefined
                  }
                  sx={{
                    p: { xs: 1.5, md: 1.75 },
                    borderRadius: "12px",
                    borderColor: isEditing ? crmPalette.orange : crmPalette.border,
                    bgcolor: isEditing ? "#fff7ed" : "#ffffff",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
                    minWidth: 0,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        minWidth: 0,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1.1}
                        sx={{ alignItems: "flex-start", minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            borderRadius: "10px",
                            color: crmPalette.orangeDark,
                            bgcolor: "#fff7ed",
                            border: "1px solid #fed7c3",
                          }}
                        >
                          <FileText size={18} />
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          {isEditing ? (
                            <TextField
                              required
                              fullWidth
                              size="small"
                              label="Título da proposta"
                              value={editingOpportunityForm.title}
                              onChange={(event) =>
                                updateEditingOpportunityForm(
                                  "title",
                                  event.target.value,
                                )
                              }
                              sx={textFieldSx}
                            />
                          ) : (
                            <Typography
                              sx={{
                                color: crmPalette.text,
                                fontSize: 15,
                                fontWeight: 900,
                                lineHeight: 1.35,
                                overflowWrap: "anywhere",
                              }}
                            >
                              {opportunity.title}
                            </Typography>
                          )}

                          <Stack
                            direction="row"
                            spacing={0.75}
                            useFlexGap
                            sx={{
                              mt: isEditing ? 1 : 0.9,
                              flexWrap: "wrap",
                            }}
                          >
                            <Chip
                              label={formatOpportunityStage(opportunity.stage)}
                              size="small"
                              sx={{
                                borderRadius: "8px",
                                bgcolor: "#ffedd5",
                                color: crmPalette.orangeDark,
                                fontSize: 11,
                                fontWeight: 900,
                              }}
                            />
                            <Chip
                              label={formatarData(opportunity.createdAt)}
                              size="small"
                              sx={{
                                borderRadius: "8px",
                                bgcolor: "#f1f5f9",
                                color: "#475569",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            />
                          </Stack>
                        </Box>
                      </Stack>

                      {canEditCommercialData ? (
                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ flexShrink: 0 }}
                        >
                          {isEditing ? (
                            <IconButton
                              type="button"
                              aria-label="Cancelar edição"
                              title="Cancelar edição"
                              disabled={isSaving || isDeleting}
                              onClick={() => setEditingOpportunityId(null)}
                              sx={{
                                width: 34,
                                height: 34,
                                color: "#475569",
                                bgcolor: "#f8fafc",
                                border: `1px solid ${crmPalette.border}`,
                                "&:hover": { bgcolor: "#eef2f7" },
                              }}
                            >
                              <X size={16} />
                            </IconButton>
                          ) : (
                            <IconButton
                              type="button"
                              aria-label="Editar proposta"
                              title="Editar proposta"
                              disabled={isDeleting}
                              onClick={() => startEditingOpportunity(opportunity)}
                              sx={{
                                width: 34,
                                height: 34,
                                color: "#1d4ed8",
                                bgcolor: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                "&:hover": { bgcolor: "#dbeafe" },
                              }}
                            >
                              <Edit3 size={16} />
                            </IconButton>
                          )}

                          <IconButton
                            type="button"
                            aria-label="Excluir proposta"
                            title="Excluir proposta"
                            disabled={isSaving || isDeleting}
                            onClick={() => handleDeleteOpportunity(opportunity.id)}
                            sx={{
                              width: 34,
                              height: 34,
                              color: "#b91c1c",
                              bgcolor: "#fef2f2",
                              border: "1px solid #fecaca",
                              "&:hover": { bgcolor: "#fee2e2" },
                            }}
                          >
                            {isDeleting ? (
                              <CircularProgress size={15} color="inherit" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </IconButton>
                        </Stack>
                      ) : null}

                      {currentLead.opportunities.length === 0 ? (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: {
                              xs: 2.5,
                              md: 3,
                            },

                            display: "flex",

                            flexDirection: "column",

                            alignItems: "center",

                            justifyContent: "center",

                            textAlign: "center",

                            borderRadius: "16px",

                            borderStyle: "dashed",

                            borderColor: "#cbd5e1",

                            bgcolor: "#f8fafc",
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,

                              display: "grid",

                              placeItems: "center",

                              borderRadius: "14px",

                              color: crmPalette.orangeDark,

                              bgcolor: "#fff7ed",

                              border: "1px solid #fed7aa",
                            }}
                          >
                            <FileText size={22} />
                          </Box>

                          <Typography
                            sx={{
                              mt: 1.5,
                              color: crmPalette.text,
                              fontSize: 15,
                              fontWeight: 900,
                            }}
                          >
                            Nenhuma proposta cadastrada
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.5,
                              maxWidth: 420,
                              color: crmPalette.muted,
                              fontSize: 12.5,
                              lineHeight: 1.6,
                            }}
                          >
                            Preencha o formulário acima para cadastrar a primeira proposta deste
                            cliente.
                          </Typography>
                        </Paper>
                      ) : null}
                    </Stack>

                    {isEditing ? (
                      <>
                        <TextField
                          required
                          select
                          fullWidth
                          size="small"
                          label="Tipo de proposta"
                          value={editingOpportunityForm.proposalType}
                          onChange={(event) =>
                            setEditingOpportunityForm((current) => ({
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
                              transportValues: Object.fromEntries(
                                TRANSPORT_PRICE_ITEMS.map((item) => [item, ""]),
                              ) as Record<string, string>,
                              customOption: "",
                            }))
                          }
                          sx={textFieldSx}
                        >
                          <MenuItem value="">Selecione</MenuItem>

                          <MenuItem value="TRANSPORTE_RODOVIARIO">
                            Transporte rodoviário
                          </MenuItem>

                          <MenuItem value="ARMAZENAGEM">
                            Armazenagem
                          </MenuItem>
                        </TextField>

                        {editingOpportunityForm.proposalType ? (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: { xs: 1.5, md: 2 },
                              borderRadius: "12px",
                              borderColor: crmPalette.border,
                              bgcolor: "#ffffff",
                            }}
                          >
                            <Typography
                              sx={{
                                color: crmPalette.text,
                                fontSize: 14,
                                fontWeight: 900,
                              }}
                            >
                              {editingOpportunityForm.proposalType === "ARMAZENAGEM"
                                ? "Serviços de armazenagem"
                                : "Serviços de transporte rodoviário"}
                            </Typography>

                            <Box
                              sx={{
                                mt: 1,
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "1fr",
                                  sm: "repeat(2, minmax(0, 1fr))",
                                  lg: "repeat(3, minmax(0, 1fr))",
                                },
                                gap: 0.5,
                              }}
                            >
                              {[
                                ...editingProposalOptions,
                                ...editingCustomSelectedOptions,
                              ].map((option) => (
                                <FormControlLabel
                                  key={option}
                                  control={
                                    <Checkbox
                                      checked={editingSelectedProposalOptions.includes(
                                        option,
                                      )}
                                      onChange={() =>
                                        toggleEditingProposalOption(option)
                                      }
                                      size="small"
                                      sx={{
                                        color: crmPalette.muted,

                                        "&.Mui-checked": {
                                          color: crmPalette.orange,
                                        },
                                      }}
                                    />
                                  }
                                  label={option}
                                  sx={{
                                    m: 0,
                                    minHeight: 34,
                                    color: crmPalette.text,

                                    "& .MuiFormControlLabel-label": {
                                      fontSize: 13,
                                      fontWeight: 700,
                                      overflowWrap: "anywhere",
                                    },
                                  }}
                                />
                              ))}
                            </Box>

                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              sx={{
                                mt: 1.5,
                                alignItems: {
                                  xs: "stretch",
                                  sm: "center",
                                },
                              }}
                            >
                              <TextField
                                fullWidth
                                size="small"
                                label="Outros"
                                placeholder="Digite uma opção que não está na lista"
                                value={editingOpportunityForm.customOption}
                                onChange={(event) =>
                                  updateEditingOpportunityForm(
                                    "customOption",
                                    event.target.value,
                                  )
                                }
                                sx={textFieldSx}
                              />

                              <Button
                                type="button"
                                variant="outlined"
                                startIcon={<PlusCircle size={15} />}
                                disabled={
                                  !editingOpportunityForm.customOption.trim() ||
                                  isSaving ||
                                  isDeleting
                                }
                                onClick={addCustomEditingProposalOption}
                                sx={{
                                  ...secondaryButtonSx,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Adicionar
                              </Button>
                            </Stack>
                          </Paper>
                        ) : null}

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          sx={{ justifyContent: "flex-end" }}
                        >
                          <Button
                            type="button"
                            variant="outlined"
                            disabled={isSaving || isDeleting}
                            startIcon={<X size={15} />}
                            onClick={() => setEditingOpportunityId(null)}
                            sx={{
                              ...secondaryButtonSx,
                              minHeight: 40,
                              px: 1.75,
                              borderRadius: "10px",
                              fontSize: 12,
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSaving || isDeleting}
                            startIcon={
                              isSaving ? (
                                <CircularProgress size={15} color="inherit" />
                              ) : (
                                <Save size={15} />
                              )
                            }
                            sx={{
                              minHeight: 40,
                              px: 2,
                              borderRadius: "10px",
                              bgcolor: crmPalette.orange,
                              fontSize: 12,
                              fontWeight: 900,
                              textTransform: "none",
                              whiteSpace: "nowrap",
                              boxShadow: "none",
                              "&:hover": {
                                bgcolor: crmPalette.orangeDark,
                                boxShadow: "none",
                              },
                            }}
                          >
                            {isSaving ? "Salvando..." : "Salvar alterações"}
                          </Button>
                        </Stack>
                      </>
                    ) : opportunity.preContractNotes ? (
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: "10px",
                          border: `1px solid ${crmPalette.border}`,
                          bgcolor: "#f8fafc",
                        }}
                      >
                        <Typography
                          component="div"
                          sx={{
                            color: crmPalette.text,
                            fontSize: 13,
                            lineHeight: 1.55,
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {opportunity.preContractNotes}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          color: crmPalette.muted,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        Sem informações adicionais.
                      </Typography>
                    )}

                    <Paper
                      variant="outlined"
                      sx={{
                        borderRadius: "16px",
                        borderColor: crmPalette.border,
                        bgcolor: "#ffffff",
                        overflow: "hidden",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                      }}
                    >
                      <Stack spacing={1.1}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          sx={{
                            alignItems: { xs: "stretch", sm: "center" },
                            justifyContent: "space-between",
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                color: crmPalette.text,
                                fontSize: 13,
                                fontWeight: 900,
                              }}
                            >
                              Anexos da proposta
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.25,
                                color: crmPalette.muted,
                                fontSize: 11.5,
                                fontWeight: 700,
                              }}
                            >
                              {anexosDaProposta.length > 0
                                ? `${anexosDaProposta.length} arquivo${anexosDaProposta.length === 1 ? "" : "s"
                                } anexado${anexosDaProposta.length === 1 ? "" : "s"
                                }`
                                : "Nenhum anexo cadastrado."}
                            </Typography>
                          </Box>

                          {canEditCommercialData ? (
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={0.75}
                              sx={{ alignItems: "stretch" }}
                            >
                              <Button
                                component="label"
                                variant="outlined"
                                startIcon={<FileText size={14} />}
                                disabled={Boolean(uploadingProposalOpportunityId)}
                                sx={{
                                  ...secondaryButtonSx,
                                  minHeight: 34,
                                  px: 1.4,
                                  fontSize: 12,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Selecionar
                                <Box
                                  component="input"
                                  type="file"
                                  multiple
                                  onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                  ) => {
                                    const nextFiles = Array.from(
                                      event.target.files ?? [],
                                    );

                                    setProposalFiles((current) => ({
                                      ...current,
                                      [opportunity.id]: nextFiles,
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
                                  selectedFiles.length === 0
                                }
                                startIcon={
                                  isUploading ? (
                                    <CircularProgress
                                      size={14}
                                      color="inherit"
                                    />
                                  ) : (
                                    <PlusCircle size={14} />
                                  )
                                }
                                onClick={() =>
                                  handleUploadProposalDocuments(opportunity.id)
                                }
                                sx={{
                                  minHeight: 34,
                                  px: 1.4,
                                  borderRadius: "9px",
                                  bgcolor: crmPalette.orange,
                                  fontSize: 12,
                                  fontWeight: 900,
                                  textTransform: "none",
                                  boxShadow: "none",
                                  whiteSpace: "nowrap",
                                  "&:hover": {
                                    bgcolor: crmPalette.orangeDark,
                                    boxShadow: "none",
                                  },
                                }}
                              >
                                {isUploading ? "Anexando..." : "Anexar"}
                              </Button>
                            </Stack>
                          ) : null}
                        </Stack>

                        {selectedFiles.length > 0 ? (
                          <Stack
                            direction="row"
                            spacing={0.75}
                            useFlexGap
                            sx={{ flexWrap: "wrap" }}
                          >
                            {selectedFiles.map((file) => (
                              <Chip
                                key={`${opportunity.id}-${file.name}-${file.size}-${file.lastModified}`}
                                label={file.name}
                                size="small"
                                onDelete={() =>
                                  setProposalFiles((current) => ({
                                    ...current,
                                    [opportunity.id]: (
                                      current[opportunity.id] ?? []
                                    ).filter(
                                      (currentFile) =>
                                        !(
                                          currentFile.name === file.name &&
                                          currentFile.size === file.size &&
                                          currentFile.lastModified ===
                                          file.lastModified
                                        ),
                                    ),
                                  }))
                                }
                                sx={{
                                  maxWidth: "100%",
                                  borderRadius: "8px",
                                  bgcolor: "#fff7ed",
                                  color: crmPalette.orangeDark,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  "& .MuiChip-label": {
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  },
                                }}
                              />
                            ))}
                          </Stack>
                        ) : null}

                        {anexosDaProposta.length > 0 ? (
                          <Stack spacing={0.75}>
                            {anexosDaProposta.map((document) => (
                              <Paper
                                key={document.id}
                                variant="outlined"
                                sx={{
                                  p: 1,
                                  borderRadius: "9px",
                                  borderColor: crmPalette.border,
                                  bgcolor: "#ffffff",
                                }}
                              >
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={1}
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
                                    spacing={0.9}
                                    sx={{
                                      alignItems: "center",
                                      minWidth: 0,
                                    }}
                                  >
                                    <FileText
                                      size={16}
                                      color={crmPalette.orangeDark}
                                    />
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography
                                        sx={{
                                          color: crmPalette.text,
                                          fontSize: 12.5,
                                          fontWeight: 900,
                                          overflowWrap: "anywhere",
                                        }}
                                      >
                                        {document.originalName}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          mt: 0.2,
                                          color: crmPalette.muted,
                                          fontSize: 11,
                                          fontWeight: 700,
                                        }}
                                      >
                                        {formatarData(document.createdAt)}
                                      </Typography>
                                    </Box>
                                  </Stack>

                                  <Stack
                                    direction="row"
                                    spacing={0.75}
                                    sx={{
                                      alignItems: "center",
                                      justifyContent: {
                                        xs: "flex-end",
                                        sm: "flex-start",
                                      },
                                    }}
                                  >
                                    <Button
                                      type="button"
                                      variant="outlined"
                                      size="small"
                                      onClick={() =>
                                        handleOpenDocument(document)
                                      }
                                      sx={{
                                        ...secondaryButtonSx,
                                        minHeight: 30,
                                        px: 1.2,
                                        fontSize: 11.5,
                                      }}
                                    >
                                      Abrir
                                    </Button>

                                    {canEditCommercialData ? (
                                      <IconButton
                                        type="button"
                                        aria-label={`Excluir ${document.originalName}`}
                                        title="Excluir anexo"
                                        onClick={() =>
                                          openDeleteDocumentDialog(document)
                                        }
                                        sx={{
                                          width: 30,
                                          height: 30,
                                          color: "#b91c1c",
                                          bgcolor: "#fef2f2",
                                          border: "1px solid #fecaca",
                                          "&:hover": {
                                            bgcolor: "#fee2e2",
                                          },
                                        }}
                                      >
                                        <Trash2 size={15} />
                                      </IconButton>
                                    ) : null}
                                  </Stack>
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        ) : null}
                      </Stack>
                    </Paper>
                  </Stack>
                </Paper>
              );
            })}
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
                    fontWeight: 900,
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
                  Selecione um ou vários arquivos para incluir nesta aba.
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
                      setProposalFiles((current) => ({
                        ...current,
                        __geral: Array.from(event.target.files ?? []),
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
                    fontWeight: 900,
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
                      fontWeight: 700,
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
                fontWeight: 900,
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
                    bgcolor: "#fff7f2",
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
                        color: crmPalette.orangeDark,
                      }}
                    >
                      <FileText size={18} />
                    </Box>

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
                      label="Abrir"
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenDocument(document);
                      }}
                      sx={{
                        borderRadius: "8px",
                        bgcolor: "#eaf4ff",
                        color: crmPalette.blue,
                        fontWeight: 900,
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
