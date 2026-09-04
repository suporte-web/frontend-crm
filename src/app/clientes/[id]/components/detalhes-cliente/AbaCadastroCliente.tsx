"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import {
  Activity,
  Badge,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  Landmark,
  MapPin,
  Phone,
  ReceiptText,
  Save,
  ShieldCheck,
  StickyNote,
  Tag,
  UserRound,
} from "lucide-react";

import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";
import { formatLeadStatus } from "@/services/crm.service";
import type { LeadStatus } from "@/types/crm";

import {
  TituloSecaoFormulario,
  ListaInformacoes,
  CabecalhoSecao,
  UF_OPTIONS,
  addressGridSx,
  clienteParaFormularioCliente,
  editFormSectionSx,
  formatarData,
  contatosClienteParaFormulario,
  textFieldSx,
} from "./detalhes-cliente-compartilhado";
import type { PropriedadesAbaDetalhesCliente } from "./detalhes-cliente-compartilhado";


function displayValue(value?: string | null) {
  return value?.trim() || "Não informado";
}

export function AbaCadastroCliente(props: PropriedadesAbaDetalhesCliente) {
  const { currentLead, canEditClient, clientForm, setFormularioCliente, clientFormError, setFormularioClienteError, isEditingClient, setIsEditingClient, savingClient, handleUpdateClient, setClientContacts } = props;
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
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
          sx={{
            alignItems: {
              xs: "stretch",
              sm: "center",
            },

            justifyContent: "space-between",
          }}
        >
          <CabecalhoSecao
            title="Dados do cliente"
            description="Informações cadastrais, fiscais e operacionais do cliente."
          />

          {canEditClient ? (
            <Button
              type="button"
              variant={isEditingClient ? "contained" : "outlined"}
              startIcon={
                isEditingClient ? (
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <EditRoundedIcon sx={{ fontSize: 18 }} />
                )
              }
              onClick={() => {
                setIsEditingClient((current) => !current);
                setFormularioCliente(clienteParaFormularioCliente(currentLead));
                setClientContacts(contatosClienteParaFormulario(currentLead));
                setFormularioClienteError("");
              }}
              sx={{
                minHeight: 38,
                px: 1.75,

                borderRadius: "9px",

                borderColor: isEditingClient
                  ? "#475569"
                  : "#fed7aa",

                bgcolor: isEditingClient
                  ? "#475569"
                  : "#fff7ed",

                color: isEditingClient
                  ? "#ffffff"
                  : crmPalette.orangeDark,

                fontSize: 12.5,
                fontWeight: 800,

                textTransform: "none",
                whiteSpace: "nowrap",
                boxShadow: "none",

                transition: `
                background-color 180ms ease,
                border-color 180ms ease,
                color 180ms ease,
                transform 180ms ease,
                box-shadow 180ms ease
              `,

                "& .MuiButton-startIcon": {
                  mr: 0.75,
                },

                "&:hover": {
                  borderColor: isEditingClient
                    ? "#334155"
                    : crmPalette.orange,

                  bgcolor: isEditingClient ? "#334155" : "#ffede3",

                  boxShadow: isEditingClient
                    ? "0 6px 14px rgba(51, 65, 85, 0.18)"
                    : "0 6px 14px rgba(255, 77, 0, 0.12)",

                  transform: "translateY(-1px)",
                },

                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "none",
                },

                "&.Mui-focusVisible": {
                  outline: `3px solid ${isEditingClient
                    ? "rgba(71, 85, 105, 0.22)"
                    : "rgba(255, 77, 0, 0.20)"
                    }`,
                  outlineOffset: 2,
                },
              }}
            >
              {isEditingClient ? "Cancelar edição" : "Editar cadastro"}
            </Button>
          ) : null}
        </Stack>

        {isEditingClient ? (
          <Box component="form" onSubmit={handleUpdateClient}>
            {clientFormError ? (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
                {clientFormError}
              </Alert>
            ) : null}

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  xl: "repeat(2, minmax(0, 1fr))",
                },

                gap: 2,

                alignItems: "stretch",
              }}
            >
              <Box
                sx={{
                  ...editFormSectionSx,

                  height: "100%",
                }}
              >
                <TituloSecaoFormulario
                  icon={<Building2 size={18} />}
                  title="Identificação"
                  headerBg="#fff7ed"
                  headerColor="#c2410c"
                  iconBg="#ffedd5"
                  iconColor="#ea580c"
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Empresa"
                  value={clientForm.companyName}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="CNPJ"
                  value={clientForm.document}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      document: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Razão social"
                  value={clientForm.legalName}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      legalName: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Nome fantasia"
                  value={clientForm.tradeName}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      tradeName: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={clientForm.status}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,

                      status:
                        event.target.value as LeadStatus,
                    }))
                  }
                  sx={{
                    ...textFieldSx,

                    gridColumn: {
                      xs: "auto",
                      md: "1 / -1",
                    },
                  }}
                >
                  <MenuItem value="PENDENTE">
                    Pendente
                  </MenuItem>

                  <MenuItem value="ATIVO">
                    Ativo
                  </MenuItem>

                  <MenuItem value="INATIVO">
                    Inativo
                  </MenuItem>
                </TextField>
              </Box>

              <Box
                sx={{
                  ...editFormSectionSx,

                  height: "100%",
                }}
              >
                <TituloSecaoFormulario
                  icon={<Activity size={18} />}
                  title="Fiscal"
                  headerBg="#f5f3ff"
                  headerColor="#6d28d9"
                  iconBg="#ede9fe"
                  iconColor="#7c3aed"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="CNAE"
                  value={clientForm.cnae}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      cnae: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Inscrição estadual"
                  value={clientForm.stateRegistration}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      stateRegistration: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Atividade comercial"
                  value={clientForm.businessActivity}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      businessActivity: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
                <Box
                  sx={{
                    gridColumn: "1 / -1",
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md:
                        clientForm.taxRegime === "REGIME_NORMAL"
                          ? "repeat(2, minmax(0, 1fr))"
                          : "1fr",
                    },
                    gap: 1.25,
                    p: 1.5,
                    border: `1px solid ${clientForm.taxRegime === "REGIME_NORMAL"
                      ? "#fdba74"
                      : crmPalette.border
                      }`,
                    borderRadius: "12px",
                    bgcolor:
                      clientForm.taxRegime === "REGIME_NORMAL"
                        ? "#fffaf5"
                        : "#f8fafc",
                    transition: "all 180ms ease",
                  }}
                >
                  <Box>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Regime tributário"
                      value={clientForm.taxRegime}
                      onChange={(event) => {
                        const selectedTaxRegime = event.target.value;

                        setFormularioCliente((current) => ({
                          ...current,
                          taxRegime: selectedTaxRegime,

                          // Quando sair de Regime Normal,
                          // limpa a tributação anteriormente selecionada.
                          taxation:
                            selectedTaxRegime === "REGIME_NORMAL"
                              ? current.taxation
                              : "",
                        }));
                      }}
                      helperText="Selecione o enquadramento tributário da empresa."
                      sx={{
                        ...textFieldSx,

                        "& .MuiOutlinedInput-root": {
                          minHeight: 40,
                          borderRadius: "10px",
                          bgcolor: "#ffffff",

                          "&.Mui-focused fieldset": {
                            borderColor: crmPalette.orange,
                          },
                        },

                        "& .MuiInputLabel-root.Mui-focused": {
                          color: crmPalette.orangeDark,
                        },

                        "& .MuiFormHelperText-root": {
                          mx: 0.25,
                          mt: 0.75,
                          fontSize: 11,
                        },
                      }}
                    >
                      <MenuItem value="">
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                            Selecione
                          </Typography>
                          <Typography
                            sx={{ fontSize: 11, color: crmPalette.muted }}
                          >
                            Escolha o regime tributário
                          </Typography>
                        </Box>
                      </MenuItem>

                      <MenuItem value="SIMPLES_NACIONAL">
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            Simples Nacional
                          </Typography>
                          <Typography
                            sx={{ fontSize: 11, color: crmPalette.muted }}
                          >
                            Regime simplificado para empresas elegíveis
                          </Typography>
                        </Box>
                      </MenuItem>

                      <MenuItem value="SIMPLES_NACIONAL_EXCESSO_SUBLIMITE">
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            Simples Nacional — excesso do sublimite
                          </Typography>
                          <Typography
                            sx={{ fontSize: 11, color: crmPalette.muted }}
                          >
                            Empresa que ultrapassou o sublimite de receita
                          </Typography>
                        </Box>
                      </MenuItem>

                      <MenuItem value="REGIME_NORMAL">
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            Regime Normal
                          </Typography>
                          <Typography
                            sx={{ fontSize: 11, color: crmPalette.muted }}
                          >
                            Será necessário informar a tributação
                          </Typography>
                        </Box>
                      </MenuItem>

                      <MenuItem value="MEI">
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                            MEI
                          </Typography>
                          <Typography
                            sx={{ fontSize: 11, color: crmPalette.muted }}
                          >
                            Microempreendedor Individual
                          </Typography>
                        </Box>
                      </MenuItem>
                    </TextField>
                  </Box>

                  {clientForm.taxRegime === "REGIME_NORMAL" ? (
                    <Box>
                      <TextField
                        select
                        required
                        fullWidth
                        size="small"
                        label="Tributação"
                        value={clientForm.taxation}
                        onChange={(event) =>
                          setFormularioCliente((current) => ({
                            ...current,
                            taxation: event.target.value,
                          }))
                        }
                        helperText="Campo obrigatório para empresas do Regime Normal."
                        sx={{
                          ...textFieldSx,

                          "& .MuiOutlinedInput-root": {
                            minHeight: 40,
                            borderRadius: "10px",
                            bgcolor: "#ffffff",

                            "&.Mui-focused fieldset": {
                              borderColor: crmPalette.orange,
                            },
                          },

                          "& .MuiInputLabel-root.Mui-focused": {
                            color: crmPalette.orangeDark,
                          },

                          "& .MuiFormHelperText-root": {
                            mx: 0.25,
                            mt: 0.75,
                            fontSize: 11,
                            color: clientForm.taxation
                              ? crmPalette.muted
                              : "#b45309",
                          },
                        }}
                      >
                        <MenuItem value="">
                          <Box>
                            <Typography
                              sx={{ fontSize: 13, fontWeight: 700 }}
                            >
                              Selecione
                            </Typography>
                            <Typography
                              sx={{ fontSize: 11, color: crmPalette.muted }}
                            >
                              Escolha a forma de tributação
                            </Typography>
                          </Box>
                        </MenuItem>

                        <MenuItem value="LUCRO_PRESUMIDO">
                          <Box>
                            <Typography
                              sx={{ fontSize: 13, fontWeight: 800 }}
                            >
                              Lucro Presumido
                            </Typography>
                            <Typography
                              sx={{ fontSize: 11, color: crmPalette.muted }}
                            >
                              Tributação baseada em margem presumida
                            </Typography>
                          </Box>
                        </MenuItem>

                        <MenuItem value="LUCRO_REAL">
                          <Box>
                            <Typography
                              sx={{ fontSize: 13, fontWeight: 800 }}
                            >
                              Lucro Real
                            </Typography>
                            <Typography
                              sx={{ fontSize: 11, color: crmPalette.muted }}
                            >
                              Tributação baseada no lucro efetivamente apurado
                            </Typography>
                          </Box>
                        </MenuItem>

                        <MenuItem value="SIMPLES_NACIONAL">
                          <Box>
                            <Typography
                              sx={{ fontSize: 13, fontWeight: 800 }}
                            >
                              Simples Nacional
                            </Typography>
                            <Typography
                              sx={{ fontSize: 11, color: crmPalette.muted }}
                            >
                              Opção disponível conforme cadastro fiscal
                            </Typography>
                          </Box>
                        </MenuItem>
                      </TextField>
                    </Box>
                  ) : null}
                </Box>
              </Box>

              <Box
                sx={{
                  ...editFormSectionSx,

                  gridColumn: {
                    xs: "auto",
                    xl: "1 / -1",
                  },
                }}
              >
                <TituloSecaoFormulario
                  icon={<ShieldCheck size={18} />}
                  title="Informações comerciais"
                  headerBg="#ecfdf5"
                  headerColor="#047857"
                  iconBg="#d1fae5"
                  iconColor="#059669"
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Segmento"
                  value={clientForm.segment}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      segment: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
                {/* <TextField
                    fullWidth
                    size="small"
                    label="Modalidade"
                    value={clientForm.modality}
                    onChange={(event) =>
                      setFormularioCliente((current) => ({
                        ...current,
                        modality: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  /> */}
                <TextField
                  fullWidth
                  size="small"
                  label="Telefone"
                  value={clientForm.phone}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Data do cadastro"
                  type="date"
                  value={clientForm.registrationDate}
                  onChange={(event) =>
                    setFormularioCliente((current) => ({
                      ...current,
                      registrationDate: event.target.value,
                    }))
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={textFieldSx}
                />
              </Box>

              <Box
                sx={{
                  ...editFormSectionSx,

                  p: {
                    xs: 1.5,
                    md: 1.75,
                  },

                  gap: 1.25,
                }}
              >
                <TituloSecaoFormulario
                  icon={<FileText size={18} />}
                  title="Informações complementares"
                />

                <Box
                  sx={{
                    gridColumn: "1 / -1",

                    display: "grid",

                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(3, minmax(0, 1fr))",
                    },

                    gap: 1.25,
                  }}

                >

                  <Box
                    sx={{
                      gridColumn: "1 / -1",

                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1fr",

                        md: "repeat(3, minmax(0, 1fr))",
                      },

                      gap: 1.25,
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="Segmento"
                      value={clientForm.segment}
                      onChange={(event) =>
                        setFormularioCliente((current) => ({
                          ...current,

                          segment: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Telefone"
                      value={clientForm.phone}
                      onChange={(event) =>
                        setFormularioCliente((current) => ({
                          ...current,

                          phone: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Data do cadastro"
                      type="date"
                      value={clientForm.registrationDate}
                      onChange={(event) =>
                        setFormularioCliente((current) => ({
                          ...current,

                          registrationDate:
                            event.target.value,
                        }))
                      }
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                      sx={textFieldSx}
                    />
                  </Box>

                </Box>
                <Box sx={addressGridSx}>
                  <Typography
                    sx={{
                      gridColumn: "1 / -1",
                      mb: 0.25,
                      color: crmPalette.text,
                      fontSize: 12,
                      fontWeight: 900,
                      lineHeight: 1.3,
                    }}
                  >
                    Endereço
                  </Typography>

                  <TextField
                    fullWidth
                    size="small"
                    label="CEP"
                    value={clientForm.zipCode}
                    onChange={(event) =>
                      setFormularioCliente((current) => ({
                        ...current,
                        zipCode: event.target.value,
                      }))
                    }
                    placeholder="00000-000"
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Rua / Logradouro"
                    value={clientForm.street}
                    onChange={(event) =>
                      setFormularioCliente((current) => ({
                        ...current,
                        street: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Número"
                    value={clientForm.number}
                    onChange={(event) =>
                      setFormularioCliente((current) => ({
                        ...current,
                        number: event.target.value,
                      }))
                    }
                    placeholder="Número ou S/N"
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Complemento"
                    value={clientForm.complement}
                    onChange={(event) =>
                      setFormularioCliente((current) => ({
                        ...current,
                        complement: event.target.value,
                      }))
                    }
                    placeholder="Sala, bloco, galpão..."
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Bairro"
                    value={clientForm.neighborhood}
                    onChange={(event) =>
                      setFormularioCliente((current) => ({
                        ...current,
                        neighborhood: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Cidade"
                    value={clientForm.city}
                    onChange={(event) =>
                      setFormularioCliente((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />

                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="UF"
                    value={clientForm.state}
                    onChange={(event) =>
                      setFormularioCliente((current) => ({
                        ...current,
                        state: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  >
                    {UF_OPTIONS.map((uf) => (
                      <MenuItem key={uf} value={uf}>
                        {uf}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box
                  sx={{
                    gridColumn: "1 / -1",
                    display: "grid",

                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, minmax(0, 1fr))",
                    },

                    gap: 1.25,
                  }}
                >
                  {/* <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={1}
                      label="Dados bancários"
                      placeholder="Banco, agência, conta, chave Pix..."
                      value={clientForm.bankDetails}
                      onChange={(event) =>
                        setFormularioCliente((current) => ({
                          ...current,
                          bankDetails: event.target.value,
                        }))
                      }
                      sx={[textFieldSx, compactMultilineSx]}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={1}
                      label="Observações cadastrais"
                      placeholder="Informações adicionais sobre o cadastro..."
                      value={clientForm.notes}
                      onChange={(event) =>
                        setFormularioCliente((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      sx={[textFieldSx, compactMultilineSx]}
                    /> */}
                </Box>
              </Box>
            </Box>
            <Stack direction="row" sx={{ mt: 2, justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="contained"
                disabled={savingClient}
                startIcon={
                  savingClient ? (
                    <CircularProgress size={16} color="inherit" />
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

                  boxShadow: "0 8px 18px rgba(255, 77, 0, 0.18)",

                  transition: `
                     background-color 180ms ease,
                      box-shadow 180ms ease,
                      transform 180ms ease
                      `,

                  "&:hover": {
                    bgcolor: crmPalette.orangeDark,
                    boxShadow: "0 10px 24px rgba(255, 77, 0, 0.24)",
                    transform: "translateY(-1px)",
                  },

                  "&:active": {
                    transform: "translateY(0)",
                    boxShadow: "none",
                  },

                  "&.Mui-disabled": {
                    bgcolor: "#fed7c3",
                    color: "#ffffff",
                  },
                }}
              >
                {savingClient ? "Salvando..." : "Salvar cadastro"}
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                lg: "repeat(2, minmax(0, 1fr))",
              },

              gap: 2,

              alignItems: "stretch",
            }}
          >
            {/* =======================================
            IDENTIFICAÇÃO
            ======================================== */}
            <Box
              sx={{
                minWidth: 0,

                "& > *": {
                  height: "100%",
                },
              }}
            >
              <ListaInformacoes
                icon={<Building2 />}
                title="Identificação"

                headerBg="#fff7ed"
                headerColor="#c2410c"

                iconBg="#ffedd5"
                iconColor="#ea580c"

                items={[
                  [
                    "Empresa",
                    displayValue(currentLead.company),
                    <Building2 />,
                  ],

                  [
                    "CNPJ",
                    displayValue(currentLead.document),
                    <ClipboardList />,
                  ],

                  [
                    "Razão social",
                    displayValue(currentLead.legalName),
                    <Badge />,
                  ],

                  [
                    "Nome fantasia",
                    displayValue(currentLead.tradeName),
                    <UserRound />,
                  ],

                  [
                    "Segmento",
                    displayValue(currentLead.segment),
                    <Tag />,
                  ],
                ]}
              />
            </Box>

            {/* =======================================
        FISCAL
    ======================================== */}
            <Box
              sx={{
                minWidth: 0,

                "& > *": {
                  height: "100%",
                },
              }}
            >
              <ListaInformacoes
                icon={<Activity />}
                title="Fiscal"

                headerBg="#f5f3ff"
                headerColor="#6d28d9"

                iconBg="#ede9fe"
                iconColor="#7c3aed"

                items={[
                  [
                    "CNAE",
                    displayValue(currentLead.cnae),
                    <ReceiptText />,
                  ],

                  [
                    "Inscrição estadual",
                    displayValue(
                      currentLead.stateRegistration,
                    ),
                    <FileText />,
                  ],

                  [
                    "Atividade comercial",
                    displayValue(
                      currentLead.businessActivity,
                    ),
                    <Activity />,
                  ],

                  [
                    "Regime tributário",
                    displayValue(currentLead.taxRegime),
                    <Landmark />,
                  ],

                  [
                    "Tributação",
                    displayValue(currentLead.taxation),
                    <ShieldCheck />,
                  ],
                ]}
              />
            </Box>

            {/* =======================================
        ENDEREÇO E CADASTRO
        OCUPA A LARGURA INTEIRA
    ======================================== */}
            <Box
              sx={{
                gridColumn: {
                  xs: "auto",
                  lg: "1 / -1",
                },

                minWidth: 0,
              }}
            >
              <ListaInformacoes
                icon={<MapPin />}
                title="Endereço e cadastro"

                headerBg="#eff6ff"
                headerColor="#1d4ed8"

                iconBg="#dbeafe"
                iconColor="#2563eb"

                items={[
                  [
                    "Endereço",
                    displayValue(currentLead.address),
                    <MapPin />,
                  ],

                  [
                    "Cidade",
                    displayValue(currentLead.city),
                    <MapPin />,
                  ],

                  [
                    "Data do cadastro",
                    formatarData(
                      currentLead.registrationDate ??
                      currentLead.createdAt,
                    ),
                    <CalendarDays />,
                  ],

                  [
                    "Status",
                    formatLeadStatus(currentLead.status),
                    <ClipboardList />,
                  ],
                ]}
              />
            </Box>

            {/* =======================================
        OBSERVAÇÕES
    ======================================== */}
            <Box
              sx={{
                gridColumn: {
                  xs: "auto",
                  lg: "1 / -1",
                },

                minWidth: 0,
              }}
            >
              <ListaInformacoes
                icon={<StickyNote />}
                title="Observações"

                headerBg="#fffbeb"
                headerColor="#a16207"

                iconBg="#fef3c7"
                iconColor="#d97706"

                items={[
                  [
                    "Observações",
                    displayValue(currentLead.notes),
                    <StickyNote />,
                  ],
                ]}
              />
            </Box>
          </Box>
        )}

      </Stack>
    </CrmSection>
  );
}
