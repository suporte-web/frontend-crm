"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";
import { formatLeadStatus } from "@/services/crm.service";

import {
  CartaoInformacao,
  CabecalhoSecao,
  detailsGridSx,
  formatarData,
  statusStyles,
} from "./detalhes-cliente-compartilhado";
import type { PropriedadesAbaDetalhesCliente } from "./detalhes-cliente-compartilhado";


export function AbaVisaoGeralCliente(props: PropriedadesAbaDetalhesCliente) {
  const { currentLead } = props;
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
        <Stack spacing={2}>
          <CabecalhoSecao
            eyebrow="Visão geral"
            title="Visão geral do cliente"
            // description="Resumo da conta para consulta rápida."
            // icon={<SpaceDashboardRoundedIcon sx={{ fontSize: 21 }} />}
          />

          <Box sx={detailsGridSx}>
            {[
              ["Empresa", currentLead.company],
              ["CNPJ", currentLead.document ?? "-"],
              ["Razão social", currentLead.legalName ?? "-"],
              ["Nome fantasia", currentLead.tradeName ?? "-"],
              [
                "Status",
                <Chip
                  key="status"
                  label={formatLeadStatus(currentLead.status)}
                  size="small"
                  variant="outlined"
                  sx={{
                    ...statusStyles[currentLead.status],
                    width: "fit-content",
                    height: 26,
                    borderRadius: "8px",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                />,
              ],
              ["Segmento", currentLead.segment],
              ["Telefone", currentLead.phone ?? "-"],
              [
                "Data do cadastro",
                formatarData(
                  currentLead.registrationDate ?? currentLead.createdAt,
                ),
              ],
            ].map(([label, value]) => (
              <CartaoInformacao
                key={String(label)}
                label={String(label)}
                value={value}
              />
            ))}
          </Box>
        </Stack>
      </CrmSection>
    );
  }
