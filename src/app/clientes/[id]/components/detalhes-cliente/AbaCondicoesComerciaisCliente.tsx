"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  CreditCard,
  Edit3,
  PlusCircle,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";

import {
  ACCOUNT_TYPE_OPTIONS,
  BANK_OPTIONS,
  TituloSecaoFormulario,
  PAYMENT_METHOD_OPTIONS,
  CabecalhoSecao,
  clienteParaFormularioCondicoesComerciais,
  editFormSectionSx,
  dadosBancariosVazio,
  parseFormasPagamento,
  parseListaDadosBancarios,
  secondaryButtonSx,
  temDadosBancarios,
  textFieldSx,
} from "./detalhes-cliente-compartilhado";
import type { PropriedadesAbaDetalhesCliente } from "./detalhes-cliente-compartilhado";


export function AbaCondicoesComerciaisCliente(props: PropriedadesAbaDetalhesCliente) {
  const { currentLead, canEditCommercialData, commercialTermsForm, setFormularioCondicoesComerciais, commercialTermsFormError, setFormularioCondicoesComerciaisError, isEditingCommercialTerms, setIsEditingCommercialTerms, savingCommercialTerms, handleUpdateCommercialTerms, startEditingCommercialTerms } = props;
  const adicionarFormaPagamento = (paymentMethod: string) => {
    const nextPaymentMethod = paymentMethod.trim();

    if (!nextPaymentMethod) {
      return;
    }

    setFormularioCondicoesComerciais((current) => {
      if (current.paymentMethods.includes(nextPaymentMethod)) {
        return {
          ...current,
          nextPaymentMethod: "",
          customPaymentMethod: "",
        };
      }

      return {
        ...current,
        paymentMethods: [...current.paymentMethods, nextPaymentMethod],
        nextPaymentMethod: "",
        customPaymentMethod: "",
      };
    });
  };

  const adicionarFormaPagamentoPersonalizada = () => {
    adicionarFormaPagamento(commercialTermsForm.customPaymentMethod);
  };

  const removePaymentMethod = (paymentMethod: string) => {
    setFormularioCondicoesComerciais((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.filter(
        (currentPaymentMethod) => currentPaymentMethod !== paymentMethod,
      ),
    }));
  };

  const dadosBancariosAtuais = {
    bankName: commercialTermsForm.bankName,
    customBankName: commercialTermsForm.customBankName,
    bankAgency: commercialTermsForm.bankAgency,
    bankAccount: commercialTermsForm.bankAccount,
    bankAccountType: commercialTermsForm.bankAccountType,
  };
  const podeAdicionarDadosBancarios =
    temDadosBancarios(dadosBancariosAtuais) &&
    (commercialTermsForm.bankName !== "Outro banco" ||
      Boolean(commercialTermsForm.customBankName.trim()));
  const formasPagamentoExibicao = parseFormasPagamento(currentLead.paymentMethod);
  const bancosExibicao = parseListaDadosBancarios(currentLead.bankDetails);
  const contatoFatura = [
    currentLead.invoiceContactName,
    currentLead.invoiceContactEmail,
    currentLead.invoiceContactPhone,
  ]
    .filter(Boolean)
    .join(" | ");

  const adicionarDadosBancarios = () => {
    if (!podeAdicionarDadosBancarios) {
      return;
    }

    setFormularioCondicoesComerciais((current) => ({
      ...current,
      bankAccounts: [
        ...current.bankAccounts,
        {
          bankName: current.bankName,
          customBankName: current.customBankName.trim(),
          bankAgency: current.bankAgency.trim(),
          bankAccount: current.bankAccount.trim(),
          bankAccountType: current.bankAccountType,
        },
      ],
      ...dadosBancariosVazio(),
    }));
  };

  const removerDadosBancarios = (index: number) => {
    setFormularioCondicoesComerciais((current) => ({
      ...current,
      bankAccounts: current.bankAccounts.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  };

    return (
      <CrmSection sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "stretch", md: "flex-start" },
              justifyContent: "space-between",
            }}
          >
            <CabecalhoSecao
              eyebrow="Condições comerciais"
              title="Pagamentos e faturamento"
              // description="Forma de pagamento, prazos, vigência e contato para envio de fatura."
              icon={<CreditCard size={20} />}
            />

            {canEditCommercialData ? (
              <Button
                type="button"
                variant="outlined"
                startIcon={
                  isEditingCommercialTerms ? (
                    <X size={16} />
                  ) : (
                    <Edit3 size={16} />
                  )
                }
                onClick={() => {
                  if (isEditingCommercialTerms) {
                    setIsEditingCommercialTerms(false);
                    setFormularioCondicoesComerciais(
                      clienteParaFormularioCondicoesComerciais(currentLead),
                    );
                    setFormularioCondicoesComerciaisError("");
                    return;
                  }

                  startEditingCommercialTerms(currentLead);
                }}
                sx={secondaryButtonSx}
              >
                {isEditingCommercialTerms
                  ? "Cancelar edição"
                  : "Editar condições"}
              </Button>
            ) : null}
          </Stack>

          {isEditingCommercialTerms ? (
            <Box component="form" onSubmit={handleUpdateCommercialTerms}>
              {commercialTermsFormError ? (
                <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
                  {commercialTermsFormError}
                </Alert>
              ) : null}

              <Box sx={editFormSectionSx}>
                <TituloSecaoFormulario
                  icon={<CreditCard size={18} />}
                  title="Condições de pagamento"
                  // description="Dados usados pelo financeiro e pelo histórico comercial."
                />

                <Paper
                  variant="outlined"
                  sx={{
                    gridColumn: "1 / -1",
                    p: { xs: 1.25, md: 1.5 },
                    borderRadius: "12px",
                    borderColor: crmPalette.border,
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      sx={{
                        alignItems: { xs: "stretch", md: "flex-end" },
                      }}
                    >
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Forma de pagamento"
                        value={commercialTermsForm.nextPaymentMethod}
                        onChange={(event) => {
                          const selectedPaymentMethod = event.target.value;

                          if (
                            selectedPaymentMethod &&
                            selectedPaymentMethod !== "Outro"
                          ) {
                            adicionarFormaPagamento(selectedPaymentMethod);
                            return;
                          }

                          setFormularioCondicoesComerciais((current) => ({
                            ...current,
                            nextPaymentMethod: selectedPaymentMethod,
                            customPaymentMethod:
                              selectedPaymentMethod === "Outro"
                                ? current.customPaymentMethod
                                : "",
                          }));
                        }}
                        sx={textFieldSx}
                      >
                        <MenuItem value="">Selecione</MenuItem>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>

                      {commercialTermsForm.nextPaymentMethod === "Outro" ? (
                        <TextField
                          fullWidth
                          size="small"
                          label="Adicionar forma"
                          placeholder="Informe a forma de pagamento"
                          value={commercialTermsForm.customPaymentMethod}
                          onChange={(event) =>
                            setFormularioCondicoesComerciais((current) => ({
                              ...current,
                              customPaymentMethod: event.target.value,
                            }))
                          }
                          onBlur={adicionarFormaPagamentoPersonalizada}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              adicionarFormaPagamentoPersonalizada();
                            }
                          }}
                          sx={textFieldSx}
                        />
                      ) : null}
                    </Stack>

                    {commercialTermsForm.paymentMethods.length > 0 ? (
                      <Stack
                        direction="row"
                        spacing={0.75}
                        useFlexGap
                        sx={{ flexWrap: "wrap" }}
                      >
                        {commercialTermsForm.paymentMethods.map(
                          (paymentMethod) => (
                            <Chip
                              key={paymentMethod}
                              label={paymentMethod}
                              onDelete={() => removePaymentMethod(paymentMethod)}
                              deleteIcon={<Trash2 size={14} />}
                              sx={{
                                borderRadius: "9px",
                                bgcolor: "#fff7ed",
                                color: crmPalette.orangeDark,
                                border: "1px solid #fed7c3",
                                fontSize: 12,
                                fontWeight: 900,
                                "& .MuiChip-deleteIcon": {
                                  color: crmPalette.orangeDark,
                                },
                              }}
                            />
                          ),
                        )}
                      </Stack>
                    ) : (
                      <Typography
                        sx={{
                          color: crmPalette.muted,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Nenhuma forma de pagamento adicionada.
                      </Typography>
                    )}
                  </Stack>
                </Paper>

                <TextField
                  fullWidth
                  size="small"
                  label="Prazo de pagamento"
                  placeholder="Ex.: 15 dias, 30/45 dias, à vista"
                  value={commercialTermsForm.paymentTerm}
                  onChange={(event) =>
                    setFormularioCondicoesComerciais((current) => ({
                      ...current,
                      paymentTerm: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Vigência"
                  placeholder="Ex.: 12 meses, indeterminado"
                  value={commercialTermsForm.contractValidity}
                  onChange={(event) =>
                    setFormularioCondicoesComerciais((current) => ({
                      ...current,
                      contractValidity: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Reajuste"
                  placeholder="Ex.: anual pelo IPCA"
                  value={commercialTermsForm.priceAdjustment}
                  onChange={(event) =>
                    setFormularioCondicoesComerciais((current) => ({
                      ...current,
                      priceAdjustment: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Nome para envio de fatura"
                  value={commercialTermsForm.invoiceContactName}
                  onChange={(event) =>
                    setFormularioCondicoesComerciais((current) => ({
                      ...current,
                      invoiceContactName: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label="E-mail para envio de fatura"
                  value={commercialTermsForm.invoiceContactEmail}
                  onChange={(event) =>
                    setFormularioCondicoesComerciais((current) => ({
                      ...current,
                      invoiceContactEmail: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Telefone para envio de fatura"
                  value={commercialTermsForm.invoiceContactPhone}
                  onChange={(event) =>
                    setFormularioCondicoesComerciais((current) => ({
                      ...current,
                      invoiceContactPhone: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />

                <Paper
                  variant="outlined"
                  sx={{
                    gridColumn: "1 / -1",
                    p: { xs: 1.25, md: 1.5 },
                    borderRadius: "12px",
                    borderColor: crmPalette.border,
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Typography
                    sx={{
                      mb: 1.25,
                      color: crmPalette.text,
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    Dados bancários
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                        xl: "repeat(4, minmax(0, 1fr))",
                      },
                      gap: 1.25,
                    }}
                  >
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Banco"
                      value={commercialTermsForm.bankName}
                      onChange={(event) =>
                        setFormularioCondicoesComerciais((current) => ({
                          ...current,
                          bankName: event.target.value,
                          customBankName:
                            event.target.value === "Outro banco"
                              ? current.customBankName
                              : "",
                        }))
                      }
                      sx={textFieldSx}
                    >
                      <MenuItem value="">Selecione</MenuItem>
                      {BANK_OPTIONS.map((bank) => (
                        <MenuItem key={bank} value={bank}>
                          {bank}
                        </MenuItem>
                      ))}
                    </TextField>

                    {commercialTermsForm.bankName === "Outro banco" ? (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ alignItems: { xs: "stretch", sm: "flex-end" } }}
                      >
                        <TextField
                          fullWidth
                          size="small"
                          label="Nome do banco"
                          placeholder="Informe o banco"
                          value={commercialTermsForm.customBankName}
                          onChange={(event) =>
                            setFormularioCondicoesComerciais((current) => ({
                              ...current,
                              customBankName: event.target.value,
                            }))
                          }
                          sx={textFieldSx}
                        />
                      </Stack>
                    ) : null}

                    <TextField
                      fullWidth
                      size="small"
                      label="Agência"
                      value={commercialTermsForm.bankAgency}
                      onChange={(event) =>
                        setFormularioCondicoesComerciais((current) => ({
                          ...current,
                          bankAgency: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Conta"
                      value={commercialTermsForm.bankAccount}
                      onChange={(event) =>
                        setFormularioCondicoesComerciais((current) => ({
                          ...current,
                          bankAccount: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Tipo de conta"
                      value={commercialTermsForm.bankAccountType}
                      onChange={(event) =>
                        setFormularioCondicoesComerciais((current) => ({
                          ...current,
                          bankAccountType: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    >
                      <MenuItem value="">Selecione</MenuItem>
                      {ACCOUNT_TYPE_OPTIONS.map((accountType) => (
                        <MenuItem key={accountType} value={accountType}>
                          {accountType}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{
                      mt: 1.5,
                      alignItems: { xs: "stretch", sm: "center" },
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      sx={{
                        color: crmPalette.muted,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Adicione um ou mais dados bancários para este cliente.
                    </Typography>

                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<PlusCircle size={15} />}
                      disabled={!podeAdicionarDadosBancarios}
                      onClick={adicionarDadosBancarios}
                      sx={{
                        minHeight: 38,
                        px: 2,
                        borderRadius: "10px",
                        borderColor: "#fed7c3",
                        color: crmPalette.orangeDark,
                        bgcolor: "#fff7ed",
                        fontSize: 13,
                        fontWeight: 900,
                        textTransform: "none",
                        whiteSpace: "nowrap",
                        "&:hover": {
                          borderColor: crmPalette.orange,
                          bgcolor: "#ffede3",
                        },
                      }}
                    >
                      Adicionar dados bancários
                    </Button>
                  </Stack>

                  {commercialTermsForm.bankAccounts.length > 0 ? (
                    <Box
                      sx={{
                        mt: 1.5,
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 1,
                      }}
                    >
                      {commercialTermsForm.bankAccounts.map((bank, index) => {
                        const bankName =
                          bank.bankName === "Outro banco"
                            ? bank.customBankName
                            : bank.bankName;

                        return (
                          <Paper
                            key={`${bankName}-${bank.bankAgency}-${bank.bankAccount}-${index}`}
                            variant="outlined"
                            sx={{
                              p: 1.25,
                              borderRadius: "12px",
                              borderColor: "#fed7c3",
                              bgcolor: "#ffffff",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                              }}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    color: crmPalette.text,
                                    fontSize: 13,
                                    fontWeight: 900,
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {bankName || "Banco não informado"}
                                </Typography>
                                <Typography
                                  sx={{
                                    mt: 0.4,
                                    color: crmPalette.muted,
                                    fontSize: 12,
                                    lineHeight: 1.5,
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  Agência: {bank.bankAgency || "-"} | Conta:{" "}
                                  {bank.bankAccount || "-"} | Tipo:{" "}
                                  {bank.bankAccountType || "-"}
                                </Typography>
                              </Box>

                              <IconButton
                                type="button"
                                aria-label="Remover dados bancários"
                                title="Remover dados bancários"
                                onClick={() => removerDadosBancarios(index)}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  color: "#b91c1c",
                                  bgcolor: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  flexShrink: 0,
                                  "&:hover": { bgcolor: "#fee2e2" },
                                }}
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Box>
                  ) : null}
                </Paper>

                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  label="Informações adicionais"
                  placeholder="Escreva instruções de faturamento, exceções, acordos comerciais e observações internas."
                  value={commercialTermsForm.commercialTermsNotes}
                  onChange={(event) =>
                    setFormularioCondicoesComerciais((current) => ({
                      ...current,
                      commercialTermsNotes: event.target.value,
                    }))
                  }
                  sx={{
                    ...textFieldSx,
                    gridColumn: { xs: "auto", md: "1 / -1" },
                  }}
                />
              </Box>

              <Stack direction="row" sx={{ mt: 2, justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingCommercialTerms}
                  startIcon={
                    savingCommercialTerms ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Save size={16} />
                    )
                  }
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    minHeight: 40,
                    borderRadius: "10px",
                    bgcolor: crmPalette.orange,
                    fontWeight: 800,
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: crmPalette.orangeDark,
                      boxShadow: "none",
                    },
                  }}
                >
                  {savingCommercialTerms ? "Salvando..." : "Salvar condições"}
                </Button>
              </Stack>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1.25,
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    borderColor: crmPalette.border,
                    bgcolor: "#ffffff",
                    minHeight: 92,
                  }}
                >
                  <Typography
                    sx={{
                      color: crmPalette.muted,
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    Forma de pagamento
                  </Typography>

                  {formasPagamentoExibicao.length > 0 ? (
                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      sx={{ mt: 1, flexWrap: "wrap" }}
                    >
                      {formasPagamentoExibicao.map((paymentMethod) => (
                        <Chip
                          key={paymentMethod}
                          label={paymentMethod}
                          size="small"
                          sx={{
                            borderRadius: "8px",
                            bgcolor: "#fff7ed",
                            color: crmPalette.orangeDark,
                            border: "1px solid #fed7c3",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      sx={{
                        mt: 1,
                        color: crmPalette.text,
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      -
                    </Typography>
                  )}
                </Paper>

                {[
                  ["Prazo de pagamento", currentLead.paymentTerm ?? "-"],
                  ["Vigência", currentLead.contractValidity ?? "-"],
                  ["Reajuste", currentLead.priceAdjustment ?? "-"],
                ].map(([label, value]) => (
                  <Paper
                    key={label}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      borderColor: crmPalette.border,
                      bgcolor: "#ffffff",
                      minHeight: 92,
                    }}
                  >
                    <Typography
                      sx={{
                        color: crmPalette.muted,
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 1,
                        color: crmPalette.text,
                        fontSize: 14,
                        fontWeight: 800,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {value}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  borderColor: crmPalette.border,
                  bgcolor: "#ffffff",
                }}
              >
                <Typography
                  sx={{
                    color: crmPalette.muted,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  Contato para envio de fatura
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    color: crmPalette.text,
                    fontSize: 14,
                    fontWeight: 800,
                    overflowWrap: "anywhere",
                  }}
                >
                  {contatoFatura || "-"}
                </Typography>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  borderColor: crmPalette.border,
                  bgcolor: "#ffffff",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    mb: bancosExibicao.length > 0 ? 1.25 : 0,
                  }}
                >
                  <Typography
                    sx={{
                      color: crmPalette.muted,
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    Dados bancários
                  </Typography>

                  {bancosExibicao.length > 0 ? (
                    <Chip
                      label={`${bancosExibicao.length} ${
                        bancosExibicao.length === 1 ? "conta" : "contas"
                      }`}
                      size="small"
                      sx={{
                        borderRadius: "8px",
                        bgcolor: "#eef6ff",
                        color: "#1d4ed8",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    />
                  ) : null}
                </Stack>

                {bancosExibicao.length > 0 ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        lg: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 1,
                    }}
                  >
                    {bancosExibicao.map((bank, index) => {
                      const bankName =
                        bank.bankName === "Outro banco"
                          ? bank.customBankName
                          : bank.bankName;

                      return (
                        <Paper
                          key={`${bankName}-${bank.bankAgency}-${bank.bankAccount}-${index}`}
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: "10px",
                            borderColor: "#dbeafe",
                            bgcolor: "#f8fbff",
                          }}
                        >
                          <Typography
                            sx={{
                              color: crmPalette.text,
                              fontSize: 14,
                              fontWeight: 900,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {bankName || "Banco não informado"}
                          </Typography>

                          <Box
                            sx={{
                              mt: 1,
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(3, minmax(0, 1fr))",
                              },
                              gap: 0.75,
                            }}
                          >
                            {[
                              ["Agência", bank.bankAgency || "-"],
                              ["Conta", bank.bankAccount || "-"],
                              ["Tipo", bank.bankAccountType || "-"],
                            ].map(([label, value]) => (
                              <Box
                                key={label}
                                sx={{
                                  p: 1,
                                  borderRadius: "8px",
                                  border: "1px solid #e2e8f0",
                                  bgcolor: "#ffffff",
                                  minWidth: 0,
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: crmPalette.muted,
                                    fontSize: 10,
                                    fontWeight: 900,
                                    letterSpacing: 0.4,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {label}
                                </Typography>
                                <Typography
                                  sx={{
                                    mt: 0.35,
                                    color: crmPalette.text,
                                    fontSize: 13,
                                    fontWeight: 800,
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {value}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography
                    sx={{
                      mt: 1,
                      color: crmPalette.text,
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    -
                  </Typography>
                )}
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  borderColor: crmPalette.border,
                  bgcolor: "#ffffff",
                }}
              >
                <Typography
                  sx={{
                    color: crmPalette.muted,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  Informações adicionais
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    color: crmPalette.text,
                    fontSize: 14,
                    fontWeight: 800,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {currentLead.commercialTermsNotes || "-"}
                </Typography>
              </Paper>
            </Stack>
          )}
        </Stack>
      </CrmSection>
    );
  }
