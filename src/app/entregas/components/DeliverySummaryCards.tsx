"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  PackageSearch,
  Percent,
} from "lucide-react";
import { CrmKpiCard, crmPalette } from "@/components/mui/crm-primitives";
import type { DeliverySummary } from "@/types/deliveries";
import type { QuickFilter } from "./delivery-page.types";

type DeliverySummaryCardsProps = {
  summary: DeliverySummary;
  activeQuickFilter: QuickFilter;
  onToggleQuickFilter: (filter: QuickFilter) => void;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercentage(value: number) {
  return (
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value) + "%"
  );
}

export function DeliverySummaryCards({
  summary,
  activeQuickFilter,
  onToggleQuickFilter,
}: DeliverySummaryCardsProps) {
  const progressValue = Math.min(Math.max(summary.porcentagemEntrega, 0), 100);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(5, minmax(0, 1fr))",
        },
        gap: 2,
        alignItems: "stretch",
      }}
    >
      <CrmKpiCard
        title="Total de pedidos"
        value={formatNumber(summary.totalPedidos)}
        icon={<PackageSearch size={24} />}
        accent={crmPalette.blue}
        softColor="#eaf4ff"
        active={activeQuickFilter === "all"}
        onClick={() => onToggleQuickFilter("all")}
      />

      <CrmKpiCard
        title="Entregues"
        value={formatNumber(summary.entregues)}
        icon={<CheckCircle2 size={24} />}
        accent="#35a853"
        softColor="#eaf8ed"
        active={activeQuickFilter === "entregues"}
        onClick={() => onToggleQuickFilter("entregues")}
      />

      <CrmKpiCard
        title="Pendentes"
        value={formatNumber(summary.pendentes)}
        icon={<Clock3 size={24} />}
        accent={crmPalette.yellow}
        softColor="#fff7df"
        active={activeQuickFilter === "pendentes"}
        onClick={() => onToggleQuickFilter("pendentes")}
      />

      <CrmKpiCard
        title="Em atraso"
        value={formatNumber(summary.emAtraso)}
        icon={<AlertCircle size={24} />}
        accent={crmPalette.orangeDark}
        softColor="#fff0f1"
        active={activeQuickFilter === "atraso"}
        onClick={() => onToggleQuickFilter("atraso")}
      />

      <Box sx={{ minWidth: 0, height: "100%" }}>
        <CrmKpiCard
          title="Porcentagem de entrega"
          value={formatPercentage(summary.porcentagemEntrega)}
          icon={<Percent size={22} />}
          accent={crmPalette.orange}
          softColor="#fff7df"
          caption={
            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 999,
                    bgcolor: "#f1f5f9",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                      bgcolor: crmPalette.orange,
                    },
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onToggleQuickFilter("abertas")}
                  sx={{
                    minWidth: "auto",
                    px: 1,
                    fontSize: 11,
                    whiteSpace: "nowrap",
                  }}
                >
                  Ver abertas
                </Button>
              </Stack>
              <Typography sx={{ mt: 1, color: crmPalette.muted, fontSize: 13 }}>
                {formatNumber(summary.entregues)} de{" "}
                {formatNumber(summary.totalPedidos)} pedidos
              </Typography>
            </Box>
          }
          active={activeQuickFilter === "abertas"}
        />
      </Box>
    </Box>
  );
}
