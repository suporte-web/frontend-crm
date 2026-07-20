"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  CalendarDays,
  Download,
  FileText,
  Flag,
  Funnel,
  ListFilter,
  MapPin,
  RefreshCcw,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";
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

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "#fff",
    height: 56,
    fontWeight: 700,
  },

  "& .MuiInputBase-input": {
    fontSize: 14,
  },

  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    fontSize: 14,
  },

  "& .MuiInputLabel-root": {
    fontWeight: 700,
    fontSize: 14,
  },
};

function FilterGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        border: `1px solid ${crmPalette.border}`,
        borderRadius: "12px",
        bgcolor: "#fff",
        height: 135,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          mb: 1.5,
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 30,
            height: 30,
            borderRadius: "50%",
            bgcolor: "#fff0e8",
            color: crmPalette.orangeDark,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontWeight: 900, color: "#1e293b" }}>
          {title}
        </Typography>
      </Stack>

      {children}
    </Box>
  );
}

function occurrenceOptionValue(occurrence: DeliveryOccurrence) {
  return String(occurrence.ocorrencia ?? occurrence.ult_ocor ?? "");
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
    <CrmSection sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 42,
            height: 42,
            borderRadius: "12px",
            bgcolor: "#fff0e8",
            color: crmPalette.orangeDark,
          }}
        >
          <SlidersHorizontal size={20} />
        </Box>
        <Box>
          <Typography
            component="h2"
            sx={{ color: "#020617", fontSize: 20, fontWeight: 900 }}
          >
            Filtros de consulta
          </Typography>
          {/* <Typography sx={{ color: crmPalette.muted, fontSize: 14 }}>
            Refine por periodo, destino, documento, pagador e status.
          </Typography> */}
        </Box>
      </Stack>

      <Box
        sx={{
          mt: 3,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        <FilterGroup title="Periodo" icon={<CalendarDays size={16} />}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
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
              fullWidth
              label="No. CTRC"
              value={filters.nroCtrc}
              onChange={(event) =>
                onUpdateFilter("nroCtrc", event.target.value)
              }
              placeholder="Digite parte do CTRC"
              sx={textFieldSx}
            />
            <Autocomplete
              freeSolo
              fullWidth
              options={occurrenceOptions}
              inputValue={filters.ocorrencia}
              onInputChange={(_, value) => onUpdateFilter("ocorrencia", value)}
              getOptionLabel={(option) => String(option ?? "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Última ocorrência"
                  placeholder="Código ou descrição"
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
                  label="Última ocorrência"
                  placeholder="Código ou descrição"
                  sx={textFieldSx}
                />
              )}
            />

            <TextField
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
        sx={{ justifyContent: "flex-end" }}
      >
        <Button
          variant="outlined"
          startIcon={<Download size={16} />}
          onClick={onExportCsv}
          disabled={rowsCount === 0}
        >
          Exportar CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<ListFilter size={16} />}
          onClick={onClearFilters}
        >
          Limpar filtros
        </Button>
        <Button
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
          sx={{
            bgcolor: crmPalette.orange,
            boxShadow: "0 12px 24px rgba(255,77,0,0.22)",
            "&:hover": { bgcolor: crmPalette.orangeDark },
          }}
        >
          Aplicar filtros
        </Button>
      </Stack>
    </CrmSection>
  );
}
