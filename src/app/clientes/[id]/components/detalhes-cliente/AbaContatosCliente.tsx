"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import {
  ContactRound,
  PlusCircle,
  X,
} from "lucide-react";

import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";

import {
  CartaoContatoCliente,
  CabecalhoSecao,
  contatoClienteVazio,
  novoContatoClienteVazio,
  secondaryButtonSx,
  textFieldSx,
} from "./detalhes-cliente-compartilhado";
import type { PropriedadesAbaDetalhesCliente } from "./detalhes-cliente-compartilhado";

export function AbaContatosCliente(props: PropriedadesAbaDetalhesCliente) {
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
  return (
    <CrmSection sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{
            alignItems: {
              xs: "stretch",
              sm: "flex-start",
            },
            justifyContent: "space-between",
          }}
        >
          <CabecalhoSecao
            eyebrow="Contatos"
            title="Contatos do cliente"
            icon={<ContactRound size={20} />}
          />

          {canEditClient ? (
            <Button
              type="button"
              variant="contained"
              startIcon={
                showNewContactForm ? <X size={15} /> : <PlusCircle size={15} />
              }
              onClick={() => {
                setShowNewContactForm((current) => !current);
                setNewContactForm(novoContatoClienteVazio());
              }}
              sx={{
                flexShrink: 0,
                minHeight: 38,
                px: 1.75,
                borderRadius: "10px",
                bgcolor: showNewContactForm ? "#475569" : crmPalette.orange,
                fontSize: 13,
                fontWeight: 900,
                textTransform: "none",
                boxShadow: "none",

                "&:hover": {
                  bgcolor: showNewContactForm
                    ? "#334155"
                    : crmPalette.orangeDark,
                  boxShadow: "none",
                },
              }}
            >
              {showNewContactForm ? "Cancelar" : "Adicionar contato"}
            </Button>
          ) : null}
        </Stack>

        <Box>
          {showNewContactForm && canEditClient ? (
            <Paper
              component="form"
              variant="outlined"
              onSubmit={handleCreateContact}
              sx={{
                mt: 1.5,
                p: { xs: 1.75, md: 2 },
                borderRadius: "12px",
                borderColor: crmPalette.border,
                bgcolor: "#ffffff",
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
                  label="Nome do contato"
                  value={newContactForm.nomeContato}
                  onChange={(event) =>
                    setNewContactForm((current) => ({
                      ...current,
                      nomeContato: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Cargo"
                  value={newContactForm.cargo}
                  onChange={(event) =>
                    setNewContactForm((current) => ({
                      ...current,
                      cargo: event.target.value,
                    }))
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
                    setNewContactForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Telefone"
                  value={newContactForm.telefone}
                  onChange={(event) =>
                    setNewContactForm((current) => ({
                      ...current,
                      telefone: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="WhatsApp"
                  value={newContactForm.whatsapp}
                  onChange={(event) =>
                    setNewContactForm((current) => ({
                      ...current,
                      whatsapp: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="LinkedIn"
                  value={newContactForm.linkedin}
                  onChange={(event) =>
                    setNewContactForm((current) => ({
                      ...current,
                      linkedin: event.target.value,
                    }))
                  }
                  sx={textFieldSx}
                />
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{
                  mt: 1.5,
                  justifyContent: "flex-end",
                  alignItems: { xs: "stretch", sm: "center" },
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  disabled={savingContact}
                  onClick={() => {
                    setShowNewContactForm(false);
                    setNewContactForm(novoContatoClienteVazio());
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
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PlusCircle size={15} />
                    )
                  }
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
                  {savingContact ? "Salvando..." : "Salvar contato"}
                </Button>
              </Stack>
            </Paper>
          ) : null}

          {currentLead.contacts.length > 0 ? (
            <List
              disablePadding
              sx={{
                mt: 1.5,
                display: "grid",
                gap: 1.25,
                overflow: "visible",
                border: 0,
                bgcolor: "transparent",
                boxShadow: "none",
              }}
            >
              {currentLead.contacts.map((contact, index) => (
                <CartaoContatoCliente
                  key={contact.id}
                  contact={contact}
                  index={index}
                  canEdit={canEditClient}
                  canDelete={canEditClient}
                  deleting={deletingContactId === contact.id}
                  editing={editingContactId === contact.id}
                  saving={savingEditingContactId === contact.id}
                  editForm={editingContactForm}
                  onEdit={() => startEditingContact(contact)}
                  onCancelEdit={() => {
                    setEditingContactId(null);
                    setEditingContactForm(contatoClienteVazio());
                  }}
                  onEditFormChange={updateEditingContactForm}
                  onSaveEdit={() => handleUpdateContact(contact.id)}
                  onDelete={() => handleDeleteContact(contact.id)}
                />
              ))}
            </List>
          ) : (
            <Alert severity="info" sx={{ mt: 1.5, borderRadius: "12px" }}>
              Nenhum contato cadastrado para este cliente.
            </Alert>
          )}
        </Box>
      </Stack>
    </CrmSection>
  );
}
