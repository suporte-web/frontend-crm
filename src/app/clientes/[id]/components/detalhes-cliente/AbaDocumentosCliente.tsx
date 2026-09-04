"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  FileText,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";

import {
  CabecalhoSecao,
  formatarData,
  secondaryButtonSx,
} from "./detalhes-cliente-compartilhado";
import type { PropriedadesAbaDetalhesCliente } from "./detalhes-cliente-compartilhado";


export function AbaDocumentosCliente(props: PropriedadesAbaDetalhesCliente) {
  const { canEditCommercialData, documentFiles, setDocumentFiles, uploadingDocuments, handleUploadDocuments, handleOpenDocument, openDeleteDocumentDialog, cadastralDocuments } = props;
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
            eyebrow="Documentos"
            title="Histórico documental"
            description="Arquivos cadastrados no histórico deste cliente."
            icon={<FileText size={20} />}
          />

          {canEditCommercialData ? (
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
                    Anexar documentos
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.35,
                      color: crmPalette.muted,
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    Selecione um ou vários arquivos para incluir no cadastro.
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
                        setDocumentFiles(Array.from(event.target.files ?? []));
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
                    disabled={uploadingDocuments || documentFiles.length === 0}
                    startIcon={
                      uploadingDocuments ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <PlusCircle size={15} />
                      )
                    }
                    onClick={handleUploadDocuments}
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
                    {uploadingDocuments ? "Anexando..." : "Anexar"}
                  </Button>
                </Stack>
              </Stack>

              {documentFiles.length > 0 ? (
                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  sx={{ mt: 1.5, flexWrap: "wrap" }}
                >
                  {documentFiles.map((file) => (
                    <Chip
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      label={file.name}
                      size="small"
                      onDelete={() =>
                        setDocumentFiles((current) =>
                          current.filter(
                            (currentFile) =>
                              !(
                                currentFile.name === file.name &&
                                currentFile.size === file.size &&
                                currentFile.lastModified === file.lastModified
                              ),
                          ),
                        )
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

          {cadastralDocuments.length > 0 ? (
            <Stack spacing={1.25}>
              {cadastralDocuments.map((document) => (
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
                          {document.description || "Documento cadastral"} •{" "}
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
                          title="Excluir documento"
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
          ) : (
            <Alert severity="info" sx={{ borderRadius: "12px" }}>
              Nenhum documento anexado a este cliente.
            </Alert>
          )}
        </Stack>
      </CrmSection>
    );
  }
