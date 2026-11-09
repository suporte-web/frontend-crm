"use client";

import { campoPequenoClienteSx, superficieAbasCadastroSx as superficieAbasClienteSx, paletaAbasCliente as crmPalette } from "./estilos-abas-cliente";

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
  PlusCircle,
  X,
} from "lucide-react";

import { CrmSection } from "@/components/mui/crm-primitives";

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
      sx={[{
        p: {
          xs: 2,
          md: 2.5,
        },

        borderRadius: "14px",

        border: `1px solid ${crmPalette.border}`,

        bgcolor: "#ffffff",

        boxShadow:
          "0 8px 24px rgba(15, 23, 42, 0.04)",
      }, superficieAbasClienteSx]}
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
          <CabecalhoSecao compacto
            title="Contatos"
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

                fontWeight: 700,

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
          <Box component="form" onSubmit={handleCreateContact} sx={{ borderTop: '2px solid #ff5805', pt: 2.5 }}>
            <Typography component="h3" sx={{ fontSize: 14, fontWeight: 600, color: '#1f2937', mb: 2.5 }}>Novo contato</Typography>
            {/* CAMPOS */}
            <Box
              sx={{
                p: 0,
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

                  rowGap: 2.5,
                  columnGap: 2,
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
                  sx={[textFieldSx, campoPequenoClienteSx]}
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
                  sx={[textFieldSx, campoPequenoClienteSx]}
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
                  sx={[textFieldSx, campoPequenoClienteSx]}
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
                  sx={[textFieldSx, campoPequenoClienteSx]}
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
                  sx={[textFieldSx, campoPequenoClienteSx]}
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
                  sx={[textFieldSx, campoPequenoClienteSx]}
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
                  mt: 2.5,

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

                    fontWeight: 700,

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
          </Box>
        ) : null}

        {/* =====================================
            CONTATOS CADASTRADOS
        ====================================== */}
        <Box
          sx={{
            overflow: "hidden",

            border: 0,
            borderTop: "2px solid #ff5805",

            borderRadius: 0,

            bgcolor: "#ffffff",
          }}
        >
          <Typography sx={{ px: 2, py: 1.5, fontSize: 12, color: '#64748b', borderBottom: totalContacts ? '1px solid #f1f5f9' : 0 }}>{totalContacts === 1 ? '1 contato' : totalContacts+' contatos'}</Typography>

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
                  <CartaoContatoCliente compacto
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