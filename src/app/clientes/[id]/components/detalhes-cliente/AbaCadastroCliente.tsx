"use client";

import type { ReactNode } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

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


const cadastroFormCardSx = {
  ...editFormSectionSx,
  p: { xs: 2.25, md: 2.75 },
  borderRadius: "16px",
  border: "1px solid rgba(23, 33, 43, 0.08)",
  bgcolor: "#ffffff",
  boxShadow: "0 10px 30px rgba(23, 33, 43, 0.035)",
};

function DetailField({
  icon,
  label,
  value,
  color = "#17456B",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  color?: string;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: 2,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: alpha("#17212B", 0.06),
        bgcolor: "#F8F9FA",
        transition:
          "transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          bgcolor: "#ffffff",
          borderColor: alpha(color, 0.2),
        },
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            borderRadius: 2,
            bgcolor: alpha(color, 0.09),
            color,
            "& svg": {
              width: 18,
              height: 18,
              strokeWidth: 2.2,
            },
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: 10.5,
              fontWeight: 900,
              lineHeight: 1.2,
              textTransform: "uppercase",
              letterSpacing: 0.45,
            }}
          >
            {label}
          </Typography>

          <Typography
            component="div"
            sx={{
              mt: 0.55,
              color: "text.primary",
              fontSize: 14,
              fontWeight: 800,
              lineHeight: 1.45,
              overflowWrap: "anywhere",
            }}
          >
            {value || "Não informado"}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function DetailSection({
  icon,
  title,
  description,
  color,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: { xs: 2.25, md: 2.75 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha("#17212B", 0.08),
        bgcolor: "#ffffff",
        boxShadow: "0 10px 30px rgba(23, 33, 43, 0.035)",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            borderRadius: 2.5,
            bgcolor: alpha(color, 0.1),
            color,
            "& svg": {
              width: 22,
              height: 22,
              strokeWidth: 2.2,
            },
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h3"
            sx={{
              color: "text.primary",
              fontSize: 17,
              lineHeight: 1.25,
              fontWeight: 900,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color: "text.secondary",
              fontSize: 12.5,
              lineHeight: 1.45,
            }}
          >
            {description}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2.25 }} />

      {children}
    </Paper>
  );
}

export function AbaCadastroCliente(props: PropriedadesAbaDetalhesCliente) {
  const { currentLead, canEditClient, clientForm, setFormularioCliente, clientFormError, setFormularioClienteError, isEditingClient, setIsEditingClient, savingClient, handleUpdateClient, setClientContacts } = props;
  return (
    <CrmSection
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: `1px solid ${crmPalette.border}`,
        bgcolor: "#F8F9FA",
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
                  ...cadastroFormCardSx,

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
                  ...cadastroFormCardSx,

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
                  ...cadastroFormCardSx,

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
                  ...cadastroFormCardSx,

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
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  xl: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2.5,
                alignItems: "stretch",
              }}
            >
              <DetailSection
                icon={<Building2 />}
                title="Identificação"
                description="Dados cadastrais e empresariais do cliente"
                color="#ff5805"
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  <DetailField
                    icon={<Building2 />}
                    label="Empresa"
                    value={displayValue(currentLead.company)}
                    color="#ff5805"
                  />

                  <DetailField
                    icon={<ClipboardList />}
                    label="CNPJ"
                    value={displayValue(currentLead.document)}
                    color="#ff5805"
                  />

                  <DetailField
                    icon={<Badge />}
                    label="Razão social"
                    value={displayValue(currentLead.legalName)}
                    color="#ff5805"
                  />

                  <DetailField
                    icon={<UserRound />}
                    label="Nome fantasia"
                    value={displayValue(currentLead.tradeName)}
                    color="#ff5805"
                  />

                  <Box
                    sx={{
                      gridColumn: {
                        xs: "auto",
                        sm: "1 / -1",
                      },
                    }}
                  >
                    <DetailField
                      icon={<Tag />}
                      label="Segmento"
                      value={displayValue(currentLead.segment)}
                      color="#ff5805"
                    />
                  </Box>
                </Box>
              </DetailSection>

              <DetailSection
                icon={<Activity />}
                title="Fiscal"
                description="Dados fiscais e tributários"
                color="#7c3aed"
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  <DetailField
                    icon={<ReceiptText />}
                    label="CNAE"
                    value={displayValue(currentLead.cnae)}
                    color="#7c3aed"
                  />

                  <DetailField
                    icon={<FileText />}
                    label="Inscrição estadual"
                    value={displayValue(currentLead.stateRegistration)}
                    color="#7c3aed"
                  />

                  <DetailField
                    icon={<Activity />}
                    label="Atividade comercial"
                    value={displayValue(currentLead.businessActivity)}
                    color="#7c3aed"
                  />

                  <DetailField
                    icon={<Landmark />}
                    label="Regime tributário"
                    value={displayValue(currentLead.taxRegime)}
                    color="#7c3aed"
                  />

                  <Box
                    sx={{
                      gridColumn: {
                        xs: "auto",
                        sm: "1 / -1",
                      },
                    }}
                  >
                    <DetailField
                      icon={<ShieldCheck />}
                      label="Tributação"
                      value={displayValue(currentLead.taxation)}
                      color="#7c3aed"
                    />
                  </Box>
                </Box>
              </DetailSection>
            </Box>

            <DetailSection
              icon={<MapPin />}
              title="Endereço e cadastro"
              description="Localização e informações de registro"
              color="#17456B"
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    gridColumn: {
                      xs: "auto",
                      sm: "1 / -1",
                      lg: "span 2",
                    },
                  }}
                >
                  <DetailField
                    icon={<MapPin />}
                    label="Endereço"
                    value={displayValue(currentLead.address)}
                    color="#17456B"
                  />
                </Box>

                <DetailField
                  icon={<MapPin />}
                  label="Cidade"
                  value={displayValue(currentLead.city)}
                  color="#17456B"
                />

                <DetailField
                  icon={<CalendarDays />}
                  label="Data do cadastro"
                  value={formatarData(
                    currentLead.registrationDate ?? currentLead.createdAt,
                  )}
                  color="#17456B"
                />

                <Box
                  sx={{
                    gridColumn: {
                      xs: "auto",
                      sm: "1 / -1",
                    },
                  }}
                >
                  <DetailField
                    icon={<ClipboardList />}
                    label="Status"
                    value={formatLeadStatus(currentLead.status)}
                    color="#2E7D32"
                  />
                </Box>
              </Box>
            </DetailSection>

            <DetailSection
              icon={<StickyNote />}
              title="Observações"
              description="Informações adicionais sobre o cadastro"
              color="#A35A00"
            >
              <Box
                sx={{
                  p: 2.25,
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: alpha("#A35A00", 0.12),
                  bgcolor: alpha("#A35A00", 0.04),
                }}
              >
                <Typography
                  sx={{
                    color: currentLead.notes
                      ? "text.primary"
                      : "text.secondary",
                    fontSize: 14,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {displayValue(currentLead.notes)}
                </Typography>
              </Box>
            </DetailSection>
          </Stack>
        )}

      </Stack>
    </CrmSection>
  );
}
