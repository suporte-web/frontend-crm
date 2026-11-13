"use client";

import { campoOperacaoSx, superficieOperacaoSx, acaoPrincipalOperacaoSx, acaoSecundariaOperacaoSx } from "@/components/operacao/operacao-primitives";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { CalendarDays, Download, FileText, Flag, Funnel, ListFilter, MapPin, RefreshCcw, SlidersHorizontal, Tag } from "lucide-react";
import { CrmSection } from "@/components/mui/crm-primitives";
import type { DeliveryFilters, DeliveryOccurrence } from "@/types/deliveries";

type DeliveriesFiltersPanelProps = {
  filters: DeliveryFilters;
  availableUfs: string[];
  availableCities: string[];
  availablePayers: string[];
  availableOccurrences: DeliveryOccurrence[];
  availableClassifications: string[];
  statusOptions: string[];
  rowsCount: number;
  onUpdateFilter: <K extends keyof DeliveryFilters>(
    field: K,
    value: DeliveryFilters[K],
  ) => void;
  onUpdateUfFilter: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onRefreshData: () => void;
  onExportCsv: () => void;
};

const textFieldSx = campoOperacaoSx;

function FilterGroup({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: "center", color: "#ff5805" }}>
        {icon}
        <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
}

function occurrenceOptionValue(occurrence: DeliveryOccurrence) {
  return String(occurrence.ocorrencia ?? occurrence.ult_ocor ?? "");
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 14) {
    return value;
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

export function DeliveriesFiltersPanel({
  filters,
  availableUfs,
  availableCities,
  availablePayers,
  availableOccurrences,
  availableClassifications,
  statusOptions,
  rowsCount,
  onUpdateFilter,
  onUpdateUfFilter,
  onApplyFilters,
  onClearFilters,
  onRefreshData,
  onExportCsv,
}: DeliveriesFiltersPanelProps) {
  const occurrenceOptions = availableOccurrences
    .map(occurrenceOptionValue)
    .filter(Boolean)
    .map((value) => String(value));

  return (
    <CrmSection sx={superficieOperacaoSx}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <SlidersHorizontal size={17} color="#ff5805" />
        <Typography component="h2" sx={{ fontSize: 15, fontWeight: 600 }}>Filtros</Typography>
      </Stack>

      <Box
        sx={{
          mt: 2.5,
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        <FilterGroup title="Período" icon={<CalendarDays size={16} />}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              fullWidth
              type="date"
              label="Data inicial"
              value={filters.dataInicio}
              onChange={(event) =>
                onUpdateFilter("dataInicio", event.target.value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
              sx={textFieldSx}
            />
            <TextField
              size="small"
              fullWidth
              type="date"
              label="Data final"
              value={filters.dataFim}
              onChange={(event) =>
                onUpdateFilter("dataFim", event.target.value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
              sx={textFieldSx}
            />
          </Stack>
        </FilterGroup>

        <FilterGroup title="Destino" icon={<MapPin size={16} />}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              select
              fullWidth
              label="UF destino"
              value={filters.ufDest}
              onChange={(event) => onUpdateUfFilter(event.target.value)}
              sx={textFieldSx}
            >
              <MenuItem value="">Todas</MenuItem>
              {availableUfs.map((uf) => (
                <MenuItem key={uf} value={uf}>
                  {uf}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              select
              fullWidth
              label="Cidade destino"
              value={filters.cidadeDest}
              onChange={(event) =>
                onUpdateFilter("cidadeDest", event.target.value)
              }
              sx={textFieldSx}
            >
              <MenuItem value="">Todas</MenuItem>
              {availableCities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </FilterGroup>

        <FilterGroup title="Documento e pagador" icon={<FileText size={16} />}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              fullWidth
              label="Nº CTRC"
              value={filters.nroCtrc}
              onChange={(event) =>
                onUpdateFilter("nroCtrc", event.target.value)
              }
              placeholder="Digite parte do CTRC"
              sx={textFieldSx}
            />

            <Autocomplete
              fullWidth
              options={availablePayers}
              value={filters.cnpjPagador || null}
              onChange={(_, value) =>
                onUpdateFilter("cnpjPagador", value ?? "")
              }
              getOptionLabel={(option) => formatCnpj(String(option ?? ""))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="CNPJ pagador"
                  placeholder="Selecione o CNPJ"
                  sx={textFieldSx}
                />
              )}
            />
          </Stack>
        </FilterGroup>

        <FilterGroup title="Ocorrência e status" icon={<Flag size={16} />}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Autocomplete
              freeSolo
              fullWidth
              options={occurrenceOptions}
              inputValue={filters.ocorrencia}
              onInputChange={(_, value) => onUpdateFilter("ocorrencia", value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Última ocorrência"
                  placeholder="Código ou descrição"
                  sx={textFieldSx}
                />
              )}
            />

            <TextField
              size="small"
              select
              fullWidth
              label="Status entrega"
              value={filters.statusEntrega}
              onChange={(event) =>
                onUpdateFilter("statusEntrega", event.target.value)
              }
              sx={textFieldSx}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </FilterGroup>

        <FilterGroup title="Classificação" icon={<Tag size={16} />}>
          <TextField
            size="small"
            select
            fullWidth
            label="Classificação operacional"
            value={filters.classificacaoRota}
            onChange={(event) =>
              onUpdateFilter("classificacaoRota", event.target.value)
            }
            sx={textFieldSx}
          >
            <MenuItem value="Todos">Todas</MenuItem>
            {availableClassifications.map((classification) => (
              <MenuItem key={classification} value={classification}>
                {classification}
              </MenuItem>
            ))}
          </TextField>
        </FilterGroup>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ justifyContent: "flex-end", flexWrap: "wrap", gap: 1 }}
      >
        <Button
          sx={acaoSecundariaOperacaoSx}
          variant="outlined"
          startIcon={<Download size={16} />}
          onClick={onExportCsv}
          disabled={rowsCount === 0}
        >
          Exportar CSV
        </Button>
        <Button
          sx={acaoSecundariaOperacaoSx}
          variant="outlined"
          startIcon={<ListFilter size={16} />}
          onClick={onClearFilters}
        >
          Limpar filtros
        </Button>
        <Button
          sx={acaoSecundariaOperacaoSx}
          variant="outlined"
          startIcon={<RefreshCcw size={16} />}
          onClick={onRefreshData}
        >
          Atualizar
        </Button>
        <Button
          variant="contained"
          startIcon={<Funnel size={16} />}
          onClick={onApplyFilters}
          sx={acaoPrincipalOperacaoSx}
        >
          Aplicar filtros
        </Button>
      </Stack>
    </CrmSection>
  );
}
