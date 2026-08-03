"use client";

import Link from "next/link";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ArrowLeft } from "lucide-react";

import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";
import { formatLeadStatus } from "@/services/crm.service";
import type { LeadDetail } from "@/types/crm";

import { secondaryButtonSx, statusStyles } from "./detalhes-cliente-compartilhado";

type PropriedadesCabecalhoDetalhesCliente = {
  lead: LeadDetail | null;
  loading: boolean;
  error: string;
};

export function CabecalhoDetalhesCliente({ lead, loading, error }: PropriedadesCabecalhoDetalhesCliente) {
    return (
      <CrmSection
        sx={{
          p: { xs: 2, md: 2.25 },
          borderRadius: "12px",
          border: `1px solid ${crmPalette.border}`,
          bgcolor: "#ffffff",
          boxShadow: "none",
        }}
      >
        <Stack spacing={1.5}>
          <Button
            component={Link}
            href="/clientes"
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            sx={{
              ...secondaryButtonSx,
              width: "fit-content",
              minHeight: 34,
              px: 1.6,
              borderRadius: "999px",
              fontSize: 12,
            }}
          >
            Voltar para clientes
          </Button>

          {loading ? (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <CircularProgress size={22} sx={{ color: crmPalette.orange }} />
              <Typography
                sx={{ color: crmPalette.muted, fontSize: 14, fontWeight: 700 }}
              >
                Carregando cliente...
              </Typography>
            </Stack>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: "12px" }}>
              {error}
            </Alert>
          ) : lead ? (
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              sx={{
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", flexWrap: "wrap" }}
                  >
                    <Typography
                      component="h1"
                      sx={{
                        color: "#020617",
                        fontSize: {
                          xs: 20,
                          sm: 23,
                          md: 26,
                        },
                        fontWeight: 900,
                        lineHeight: 1.2,
                        letterSpacing: "-0.02em",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {lead.company}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      mt: 1.25,
                      alignItems: "center",
                      flexWrap: "wrap",
                      rowGap: 0.75,
                    }}
                  >
                    <Chip
                      label={`CNPJ: ${lead.document ?? "-"}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        maxWidth: "100%",
                        height: 28,
                        borderRadius: "8px",
                        bgcolor: "#f8fafc",
                        color: "#475569",
                        borderColor: crmPalette.border,
                        fontSize: 11,
                        fontWeight: 800,

                        "& .MuiChip-label": {
                          px: 1.2,
                          overflowWrap: "anywhere",
                        },
                      }}
                    />

                    <Chip
                      label={formatLeadStatus(lead.status)}
                      size="small"
                      variant="outlined"
                      sx={{
                        ...statusStyles[lead.status],
                        height: 28,
                        borderRadius: "8px",
                        fontSize: 11,
                        fontWeight: 900,

                        "& .MuiChip-label": {
                          px: 1.2,
                        },
                      }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      </CrmSection>
    );
  }