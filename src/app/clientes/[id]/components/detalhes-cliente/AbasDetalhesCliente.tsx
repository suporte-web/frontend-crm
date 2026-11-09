"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";

import { CrmSection } from "@/components/mui/crm-primitives";

import type { LeadDetail } from "@/types/crm";

type PropriedadesAbasDetalhesCliente = {
  lead: LeadDetail | null;

  activeTab: number;

  setActiveTab: (nextTab: number) => void;
};

const tabsDetalhesCliente = [
  {
    label: "Cadastro",
    value: 0,
  },
  {
    label: "Contatos",
    value: 2,
  },
  {
    label: "Condições comerciais",
    value: 3,
  },
  {
    label: "Acesso às oportunidades",
    value: 4,
  },
  {
    label: "Documentos",
    value: 5,
  },
  {
    label: "Histórico",
    value: 6,
  },
  {
    label: "Modalidade",
    value: 7,
  },
];

export function AbasDetalhesCliente({
  lead,
  activeTab,
  setActiveTab,
}: PropriedadesAbasDetalhesCliente) {
  if (!lead) {
    return null;
  }

  return (
    <CrmSection
      sx={{
        px: 1,
        py: 0.5,
        overflow: "hidden",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        boxShadow: "none",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "stretch", lg: "center" } }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue: number) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Seções do cadastro"
          slotProps={{ indicator: { sx: { height: 2, bgcolor: "#ff5805" } } }}
          sx={{
            minHeight: 40,
            minWidth: 0,
            flex: 1,
            "& .MuiTabs-scrollButtons": { width: 28, color: "#64748b" },
            "& .MuiTab-root": {
              minHeight: 40,
              minWidth: "auto",
              px: { xs: 1.25, md: 1.75 },
              py: 1,
              color: "#64748b",
              fontSize: 12.5,
              fontWeight: 500,
              textTransform: "none",
              whiteSpace: "nowrap",
              borderRadius: "6px",
              "&:hover": { bgcolor: "#f8fafc", color: "#334155" },
            },
            "& .MuiTab-root.Mui-selected": {
              color: "#1f2937",
              fontWeight: 600,
            },
          }}
        >
          {tabsDetalhesCliente.map((tab) =>
            tab.value === 4 ? null : (
              <Tab
                key={tab.label}
                value={tab.value}
                disableRipple
                label={tab.label}
              />
            ),
          )}
        </Tabs>
        <Button
          component={Link}
          href={`/oportunidades/cadastro/${lead.id}`}
          variant="outlined"
          size="small"
          startIcon={<AutoGraphOutlinedIcon />}
          sx={{
            flexShrink: 0,
            alignSelf: { xs: "flex-start", lg: "center" },
            minHeight: 36,
            px: 1.25,
            borderRadius: "8px",
            textTransform: "none",
            fontSize: 12,
            fontWeight: 500,
            color: "#475569",
            borderColor: "#e2e8f0",
            "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
          }}
        >
          Oportunidades/propostas
        </Button>
      </Stack>
    </CrmSection>
  );
}
