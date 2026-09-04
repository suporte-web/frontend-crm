"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  ContactRound,
  PlusCircle,
  X,
} from "lucide-react";

import {
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";

import {
  CartaoContatoCliente,
  CabecalhoSecao,
  contatoClienteVazio,
  novoContatoClienteVazio,
  secondaryButtonSx,
  textFieldSx,
} from "./detalhes-cliente-compartilhado";

import type {
  PropriedadesAbaDetalhesCliente,
} from "./detalhes-cliente-compartilhado";

export function AbaContatosCliente(
  props: PropriedadesAbaDetalhesCliente,
) {
  const {
    currentLead,

    canEditClient,

    newContactForm,
    setNewContactForm,

    showNewContactForm,
    setShowNewContactForm,

    savingContact,
    handleCreateContact,

    editingContactId,
    setEditingContactId,

    editingContactForm,
    setEditingContactForm,

    savingEditingContactId,
    deletingContactId,

    startEditingContact,
    updateEditingContactForm,

    handleUpdateContact,
    handleDeleteContact,
  } = props;

  const totalContacts = currentLead.contacts.length;

  return (
    <CrmSection
      sx={{
        p: {
          xs: 2,
          md: 2.5,
        },

        borderRadius: "14px",

        border: `1px solid ${crmPalette.border}`,

        bgcolor: "#ffffff",

        boxShadow:
          "0 8px 24px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack spacing={2.5}>
        {/* =====================================
            CABEÇALHO
        ====================================== */}
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
            title="Contatos do cliente"
            description="Pessoas e responsáveis vinculados a este cliente."
          />

          {canEditClient ? (
            <Button
              type="button"
              variant={
                showNewContactForm
                  ? "outlined"
                  : "contained"
              }
              startIcon={
                showNewContactForm ? (
                  <X size={15} />
                ) : (
                  <PlusCircle size={15} />
                )
              }
              onClick={() => {
                setShowNewContactForm(
                  (current) => !current,
                );

                setNewContactForm(
                  novoContatoClienteVazio(),
                );
              }}
              sx={{
                flexShrink: 0,

                minHeight: 38,

                px: 1.75,

                borderRadius: "9px",

                borderColor: showNewContactForm
                  ? "#cbd5e1"
                  : crmPalette.orange,

                bgcolor: showNewContactForm
                  ? "#ffffff"
                  : crmPalette.orange,

                color: showNewContactForm
                  ? "#475569"
                  : "#ffffff",

                fontSize: 12.5,

                fontWeight: 900,

                textTransform: "none",

                boxShadow: "none",

                "&:hover": {
                  borderColor: showNewContactForm
                    ? "#94a3b8"
                    : crmPalette.orangeDark,

                  bgcolor: showNewContactForm
                    ? "#f8fafc"
                    : crmPalette.orangeDark,

                  boxShadow: "none",
                },
              }}
            >
              {showNewContactForm
                ? "Cancelar"
                : "Adicionar contato"}
            </Button>
          ) : null}
        </Stack>

        {/* =====================================
            NOVO CONTATO
        ====================================== */}
        {showNewContactForm &&
        canEditClient ? (
          <Paper
            component="form"
            variant="outlined"
            onSubmit={handleCreateContact}
            sx={{
              overflow: "hidden",

              borderRadius: "14px",

              borderColor:
                crmPalette.border,

              bgcolor: "#ffffff",

              boxShadow: "none",
            }}
          >
            {/* CABEÇALHO DO FORM */}
            <Box
              sx={{
                px: {
                  xs: 1.75,
                  md: 2,
                },

                py: 1.4,

                borderBottom: `1px solid ${crmPalette.border}`,

                bgcolor: "#eff6ff",
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
                    width: 36,
                    height: 36,

                    display: "grid",

                    placeItems: "center",

                    flexShrink: 0,

                    borderRadius: "10px",

                    bgcolor: "#dbeafe",

                    color: "#2563eb",

                    "& svg": {
                      width: 18,
                      height: 18,
                    },
                  }}
                >
                  <ContactRound />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: "#1d4ed8",

                      fontSize: 13.5,

                      fontWeight: 900,

                      lineHeight: 1.3,
                    }}
                  >
                    Novo contato
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,

                      color: "#64748b",

                      fontSize: 11.5,

                      lineHeight: 1.4,
                    }}
                  >
                    Cadastre uma nova pessoa
                    vinculada ao cliente.
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

                  gap: 1.25,
                }}
              >
                <TextField
                  required
                  fullWidth
                  size="small"
                  label="Nome do contato"
                  value={
                    newContactForm.nomeContato
                  }
                  onChange={(event) =>
                    setNewContactForm(
                      (current) => ({
                        ...current,

                        nomeContato:
                          event.target.value,
                      }),
                    )
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Cargo"
                  value={newContactForm.cargo}
                  onChange={(event) =>
                    setNewContactForm(
                      (current) => ({
                        ...current,

                        cargo:
                          event.target.value,
                      }),
                    )
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label="E-mail"
                  value={newContactForm.email}
                  onChange={(event) =>
                    setNewContactForm(
                      (current) => ({
                        ...current,

                        email:
                          event.target.value,
                      }),
                    )
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Telefone"
                  value={
                    newContactForm.telefone
                  }
                  onChange={(event) =>
                    setNewContactForm(
                      (current) => ({
                        ...current,

                        telefone:
                          event.target.value,
                      }),
                    )
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="WhatsApp"
                  value={
                    newContactForm.whatsapp
                  }
                  onChange={(event) =>
                    setNewContactForm(
                      (current) => ({
                        ...current,

                        whatsapp:
                          event.target.value,
                      }),
                    )
                  }
                  sx={textFieldSx}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="LinkedIn"
                  value={
                    newContactForm.linkedin
                  }
                  onChange={(event) =>
                    setNewContactForm(
                      (current) => ({
                        ...current,

                        linkedin:
                          event.target.value,
                      }),
                    )
                  }
                  sx={textFieldSx}
                />
              </Box>

              {/* BOTÕES DO FORM */}
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
                sx={{
                  mt: 1.75,

                  justifyContent:
                    "flex-end",

                  alignItems: {
                    xs: "stretch",
                    sm: "center",
                  },
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  disabled={savingContact}
                  onClick={() => {
                    setShowNewContactForm(
                      false,
                    );

                    setNewContactForm(
                      novoContatoClienteVazio(),
                    );
                  }}
                  sx={secondaryButtonSx}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingContact}
                  startIcon={
                    savingContact ? (
                      <CircularProgress
                        size={16}
                        color="inherit"
                      />
                    ) : (
                      <PlusCircle size={15} />
                    )
                  }
                  sx={{
                    minHeight: 40,

                    px: 2,

                    borderRadius: "9px",

                    bgcolor:
                      crmPalette.orange,

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
                  {savingContact
                    ? "Salvando..."
                    : "Salvar contato"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        ) : null}

        {/* =====================================
            CONTATOS CADASTRADOS
        ====================================== */}
        <Box
          sx={{
            overflow: "hidden",

            border:
              `1px solid ${crmPalette.border}`,

            borderRadius: "14px",

            bgcolor: "#ffffff",
          }}
        >
          {/* CABEÇALHO DA LISTA */}
          <Box
            sx={{
              px: {
                xs: 1.75,
                md: 2,
              },

              py: 1.4,

              borderBottom:
                totalContacts > 0
                  ? `1px solid ${crmPalette.border}`
                  : 0,

              bgcolor: "#f8fafc",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={0.5}
              sx={{
                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },

                justifyContent:
                  "space-between",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: crmPalette.text,

                    fontSize: 13.5,

                    fontWeight: 900,

                    lineHeight: 1.3,
                  }}
                >
                  Contatos cadastrados
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,

                    color:
                      crmPalette.muted,

                    fontSize: 11.5,

                    lineHeight: 1.4,
                  }}
                >
                  Pessoas vinculadas a este
                  cliente.
                </Typography>
              </Box>

              <Typography
                sx={{
                  color:
                    crmPalette.muted,

                  fontSize: 11.5,

                  fontWeight: 800,
                }}
              >
                {totalContacts === 0
                  ? "Nenhum contato"
                  : totalContacts === 1
                    ? "1 contato"
                    : `${totalContacts} contatos`}
              </Typography>
            </Stack>
          </Box>

          {/* LISTA */}
          {totalContacts > 0 ? (
            <List
              disablePadding
              sx={{
                display: "grid",

                gap: 1,

                p: {
                  xs: 1,
                  md: 1.25,
                },

                overflow: "visible",

                bgcolor: "#ffffff",
              }}
            >
              {currentLead.contacts.map(
                (contact, index) => (
                  <CartaoContatoCliente
                    key={contact.id}
                    contact={contact}
                    index={index}
                    canEdit={canEditClient}
                    canDelete={
                      canEditClient
                    }
                    deleting={
                      deletingContactId ===
                      contact.id
                    }
                    editing={
                      editingContactId ===
                      contact.id
                    }
                    saving={
                      savingEditingContactId ===
                      contact.id
                    }
                    editForm={
                      editingContactForm
                    }
                    onEdit={() =>
                      startEditingContact(
                        contact,
                      )
                    }
                    onCancelEdit={() => {
                      setEditingContactId(
                        null,
                      );

                      setEditingContactForm(
                        contatoClienteVazio(),
                      );
                    }}
                    onEditFormChange={
                      updateEditingContactForm
                    }
                    onSaveEdit={() =>
                      handleUpdateContact(
                        contact.id,
                      )
                    }
                    onDelete={() =>
                      handleDeleteContact(
                        contact.id,
                      )
                    }
                  />
                ),
              )}
            </List>
          ) : (
            <Box
              sx={{
                p: 2,
              }}
            >
              <Alert
                severity="info"
                sx={{
                  borderRadius: "10px",
                }}
              >
                Nenhum contato cadastrado
                para este cliente.
              </Alert>
            </Box>
          )}
        </Box>
      </Stack>
    </CrmSection>
  );
}