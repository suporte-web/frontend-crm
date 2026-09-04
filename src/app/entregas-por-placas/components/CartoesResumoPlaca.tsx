"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import {
  CheckCircleRounded,
  LocalShippingRounded,
  PendingActionsRounded,
  PersonRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  CrmKpiCard,
  crmPalette,
} from "@/components/mui/crm-primitives";
import { obterStatusEntrega } from "@/lib/entrega-por-placa.utils";
import type { EntregasPorPlacaResponse } from "@/types/entregas-por-placas";


export type FiltroResumoPlaca =
  | "todos"
  | "entregues"
  | "pendentes"
  | "em-atraso";

type PropriedadesCartoesResumoPlaca = {
  resultado: EntregasPorPlacaResponse;
  motoristas: string[];
  filtroSelecionado: FiltroResumoPlaca;
  onSelecionarFiltro: (filtro: FiltroResumoPlaca) => void;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function iconSx(size = 26) {
  return {
    fontSize: size,
  };
}

export function CartoesResumoPlaca({
  resultado,
  motoristas,
  filtroSelecionado,
  onSelecionarFiltro,
}: PropriedadesCartoesResumoPlaca) {
  const entregues = resultado.data.filter(
    (entrega) => obterStatusEntrega(entrega) === "Entregue",
  ).length;

  const emAtraso = resultado.data.filter(
    (entrega) => obterStatusEntrega(entrega) === "Em atraso",
  ).length;

  const pendentes = resultado.data.filter(
    (entrega) => obterStatusEntrega(entrega) === "Pendente",
  ).length;

  function renderFiltroAtivo(ativo: boolean, cor: string) {
    if (!ativo) {
      return null;
    }

    return (
      <Chip
        label="Filtrando"
        size="small"
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 2,
          height: 24,
          bgcolor: `${cor}14`,
          color: cor,
          border: `1px solid ${cor}35`,
          fontSize: 11,
          fontWeight: 900,
          pointerEvents: "none",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(5, minmax(0, 1fr))",
        },
        gap: 2,
      }}
    >
      <Box sx={{ position: "relative", height: "100%" }}>
        {renderFiltroAtivo(filtroSelecionado === "todos", crmPalette.blue)}
        <CrmKpiCard
          title="Total de entregas"
          value={formatNumber(resultado.total)}
          icon={<LocalShippingRounded sx={iconSx()} />}
          accent={crmPalette.blue}
          softColor="#eaf4ff"
          active={filtroSelecionado === "todos"}
          onClick={() => onSelecionarFiltro("todos")}
          ariaLabel="Mostrar todas as entregas da placa"
          ariaPressed={filtroSelecionado === "todos"}
        />
      </Box>

      <Box sx={{ position: "relative", height: "100%" }}>
        {renderFiltroAtivo(filtroSelecionado === "entregues", crmPalette.green)}
        <CrmKpiCard
          title="Entregues"
          value={formatNumber(entregues)}
          icon={<CheckCircleRounded sx={iconSx()} />}
          accent={crmPalette.green}
          softColor="#ecfdf5"
          active={filtroSelecionado === "entregues"}
          onClick={() => onSelecionarFiltro("entregues")}
          ariaLabel="Filtrar entregas concluidas da placa"
          ariaPressed={filtroSelecionado === "entregues"}
        />
      </Box>

      <Box sx={{ position: "relative", height: "100%" }}>
        {renderFiltroAtivo(filtroSelecionado === "pendentes", crmPalette.yellow)}
        <CrmKpiCard
          title="Pendentes"
          value={formatNumber(pendentes)}
          icon={<PendingActionsRounded sx={iconSx()} />}
          accent={crmPalette.yellow}
          softColor="#fff7df"
          active={filtroSelecionado === "pendentes"}
          onClick={() => onSelecionarFiltro("pendentes")}
          ariaLabel="Filtrar entregas pendentes da placa"
          ariaPressed={filtroSelecionado === "pendentes"}
        />
      </Box>

      <Box sx={{ position: "relative", height: "100%" }}>
        {renderFiltroAtivo(filtroSelecionado === "em-atraso", crmPalette.red)}
        <CrmKpiCard
          title="Em atraso"
          value={formatNumber(emAtraso)}
          icon={<WarningAmberRounded sx={iconSx()} />}
          accent={crmPalette.red}
          softColor="#fef2f2"
          active={filtroSelecionado === "em-atraso"}
          onClick={() => onSelecionarFiltro("em-atraso")}
          ariaLabel="Filtrar entregas em atraso da placa"
          ariaPressed={filtroSelecionado === "em-atraso"}
        />
      </Box>

      <Box
        sx={{
          height: "100%",
          borderRadius: 3,
          transition: "transform 180ms ease",

          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <CrmKpiCard
          title="Motorista"
          value={
            <Typography
              component="span"
              sx={{
                display: "block",
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#020617",
                fontSize: 22,
                fontWeight: 900,
                lineHeight: 1.1,
              }}
              title={motoristas.join(", ") || "Não informado"}
            >
              {motoristas.length > 0
                ? motoristas.join(", ")
                : "Não informado"}
            </Typography>
          }
          icon={<PersonRounded sx={iconSx()} />}
          accent={crmPalette.orange}
          softColor="#fff0e8"
        />
      </Box>
    </Box>
  );
}
