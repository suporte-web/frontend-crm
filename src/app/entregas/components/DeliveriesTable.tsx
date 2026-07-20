"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { Route } from "lucide-react";
import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";
import type { DeliveryRow } from "@/types/deliveries";
import {
  DELIVERY_TABLE_COLUMNS,
  type QuickFilter,
  type SortField,
} from "./delivery-page.types";

type DeliveriesTableProps = {
  rows: DeliveryRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalFiltered: number;
  activeQuickFilter: QuickFilter;
  sortField: SortField;
  sortDirection: "asc" | "desc";
  onToggleSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onToggleQuickFilter: (filter: QuickFilter) => void;
  getQuickFilterLabel: (filter: QuickFilter) => string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function formatCnpj(value?: string | null) {
  if (!value) return "-";

  const digits = value.replace(/\D/g, "");

  if (digits.length !== 14) {
    return value;
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function getStatusChipSx(status: string) {
  if (status === "Entregue") {
    return { borderColor: "#bbf7d0", bgcolor: "#ecfdf5", color: "#047857" };
  }

  if (status === "Em atraso") {
    return { borderColor: "#fecaca", bgcolor: "#fef2f2", color: "#b91c1c" };
  }

  return { borderColor: "#fde68a", bgcolor: "#fffbeb", color: "#b45309" };
}

function getLateChipSx(value: string) {
  return value === "Sim"
    ? { borderColor: "#fecaca", bgcolor: "#fef2f2", color: "#b91c1c" }
    : { borderColor: "#e2e8f0", bgcolor: "#f8fafc", color: "#475569" };
}

function getSlaChipSx(value: string) {
  if (value === "DENTRO DO SLA") {
    return { borderColor: "#bbf7d0", bgcolor: "#ecfdf5", color: "#047857" };
  }

  if (value === "FORA DO SLA") {
    return { borderColor: "#fecaca", bgcolor: "#fef2f2", color: "#b91c1c" };
  }

  return { borderColor: "#e2e8f0", bgcolor: "#f8fafc", color: "#475569" };
}

function renderCell(row: DeliveryRow, field: string) {
  if (field === "nro_ctrc") {
    return (
      <Chip
        label={row.nro_ctrc}
        size="small"
        sx={{
          height: 26,
          bgcolor: crmPalette.text,
          color: "#fff",
          fontWeight: 900,
          fontSize: 12,
          borderRadius: "8px",
        }}
      />
    );
  }

  if (field === "cgc_pag") return formatCnpj(row.cgc_pag);
  if (field === "data_prev_ent") return formatDate(row.data_prev_ent);
  if (field === "data_entrega") return formatDate(row.data_entrega);

  if (field === "uf_dest") {
    return <Chip label={row.uf_dest || "-"} size="small" variant="outlined" />;
  }

  if (field === "ult_ocor") {
    return (
      <Chip
        label={row.ult_ocor || "-"}
        size="small"
        sx={{ bgcolor: "#f1f5f9" }}
      />
    );
  }

  if (field === "status_entrega") {
    return (
      <Chip
        label={row.status_entrega}
        size="small"
        variant="outlined"
        sx={{
          ...getStatusChipSx(row.status_entrega),
          height: 26,
          fontWeight: 800,
          fontSize: 12,
          borderRadius: "8px",
        }}
      />
    );
  }

  if (field === "em_atraso") {
    return (
      <Chip
        label={row.em_atraso}
        size="small"
        variant="outlined"
        sx={{
          ...getLateChipSx(row.em_atraso),
          height: 26,
          fontWeight: 800,
          fontSize: 12,
          borderRadius: "8px",
        }}
      />
    );
  }

  if (field === "sla_entrega") {
    return (
      <Chip
        label={row.sla_entrega}
        size="small"
        variant="outlined"
        sx={{
          ...getSlaChipSx(row.sla_entrega),
          height: 26,
          fontWeight: 800,
          fontSize: 12,
          borderRadius: "8px",
        }}
      />
    );
  }

  return String(row[field as keyof DeliveryRow] ?? "-");
}

export function DeliveriesTable({
  rows,
  loading,
  page,
  totalPages,
  totalFiltered,
  activeQuickFilter,
  sortField,
  sortDirection,
  onToggleSort,
  onPageChange,
  onToggleQuickFilter,
  getQuickFilterLabel,
}: DeliveriesTableProps) {
  return (
    <CrmSection>
      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 2,
          borderBottom: `1px solid ${crmPalette.border}`,
          bgcolor: "#fff",
        }}
      >
        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", xl: "center" },
          }}
        >
          <Box>
            <Typography
              sx={{
                color: crmPalette.orangeDark,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: ".18em",
                textTransform: "uppercase",
              }}
            >
              Detalhamento
            </Typography>
            <Typography
              component="h2"
              sx={{
                mt: 0.25,
                color: crmPalette.text,
                fontSize: { xs: 20, md: 24 },
                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              Lista detalhada dos CTRCs
            </Typography>
            <Typography sx={{ mt: 1, color: crmPalette.muted, fontSize: 14 }}>
              Total filtrado:{" "}
              {new Intl.NumberFormat("pt-BR").format(totalFiltered)} registros.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
          >
            <Chip
              label={getQuickFilterLabel(activeQuickFilter)}
              sx={{
                bgcolor: "#fff7df",
                color: crmPalette.text,
                fontWeight: 800,
              }}
            />
            {activeQuickFilter !== "all" ? (
              <Button
                variant="outlined"
                onClick={() => onToggleQuickFilter("all")}
              >
                Limpar filtro rapido
              </Button>
            ) : null}
            <Chip
              icon={<Route size={16} />}
              label={`Ordenacao: ${sortField} (${sortDirection === "asc" ? "crescente" : "decrescente"})`}
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          bgcolor: "#f8fafc",
          p: { xs: 1.25, md: 1.5 },
        }}
      >
        {loading ? (
          <Alert
            icon={<CircularProgress size={18} />}
            severity="warning"
            sx={{ borderRadius: "12px" }}
          >
            Carregando entregas...
          </Alert>
        ) : (
          <>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                maxHeight: 680,
                border: `1px solid ${crmPalette.border}`,
                borderRadius: "14px",
                overflow: "auto",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",

                "&::-webkit-scrollbar": {
                  height: 8,
                  width: 8,
                },

                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "#cbd5e1",
                  borderRadius: 999,
                },

                "&::-webkit-scrollbar-track": {
                  bgcolor: "#f8fafc",
                },
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: 1760,
                  tableLayout: "auto",
                }}
              >
                <TableHead>
                  <TableRow>
                    {DELIVERY_TABLE_COLUMNS.map((column) => (
                      <TableCell
                        key={column.field}
                        sx={{
                          minWidth: column.minWidth,
                          bgcolor: crmPalette.text,
                          color: "rgba(255,255,255,0.78)",
                          fontSize: 11,
                          fontWeight: 900,
                          letterSpacing: ".12em",
                          textTransform: "uppercase",
                          borderBottom: "0",
                        }}
                      >
                        {column.sortable ? (
                          <TableSortLabel
                            active={sortField === column.field}
                            direction={
                              sortField === column.field ? sortDirection : "asc"
                            }
                            onClick={() =>
                              onToggleSort(column.field as SortField)
                            }
                            sx={{
                             color: "#fff",
                              fontWeight: 900,

                              "&:hover": {
                                color: crmPalette.orangeDark,
                              },

                              "&.Mui-active": {
                                color: crmPalette.orangeDark,
                              },

                              "& .MuiTableSortLabel-icon": {
                                color: `${crmPalette.orangeDark} !important`,
                              },
                            }}
                          >
                            {column.label}
                          </TableSortLabel>
                        ) : (
                          column.label
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={DELIVERY_TABLE_COLUMNS.length}
                        align="center"
                        sx={{
                          py: 8,
                          bgcolor: "#fff",
                        }}
                      >
                        <Stack spacing={1} sx={{ alignItems: "center" }}>
                          <Route size={32} color={crmPalette.muted} />

                          <Typography
                            sx={{
                              color: crmPalette.text,
                              fontWeight: 800,
                            }}
                          >
                            Nenhuma entrega encontrada
                          </Typography>

                          <Typography
                            sx={{
                              color: crmPalette.muted,
                              fontSize: 13,
                            }}
                          >
                            Ajuste os filtros e tente novamente.
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow
                        key={`${row.seq_ctrc}-${row.nro_ctrc}`}
                        hover
                        sx={{
                          bgcolor: index % 2 === 0 ? "#fff" : "#f8fafc",
                          "&:hover": { bgcolor: "#fff7df!important" },
                        }}
                      >
                        {DELIVERY_TABLE_COLUMNS.map((column) => (
                          <TableCell
                            key={column.field}
                            sx={{
                              py: 1.5,
                              color:
                                column.field === "nome_cli_dest"
                                  ? crmPalette.text
                                  : "#475569",
                              fontWeight:
                                column.field === "nome_cli_dest" ? 800 : 600,
                              verticalAlign: "top",
                              borderBottom: "1px solid #f1f5f9",
                              maxWidth:
                                column.field === "ocorrencia" ? 320 : undefined,
                            }}
                          >
                            {renderCell(row, column.field)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                mt: 1.5,
                p: 1.5,
                border: `1px solid ${crmPalette.border}`,
                borderRadius: "12px",
                bgcolor: "#fff",
              }}
            >
              <Typography
                sx={{
                  color: crmPalette.muted,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Página {page} de {totalPages}
              </Typography>

              <Pagination
                page={page}
                count={totalPages}
                onChange={(_, nextPage) => onPageChange(nextPage)}
                color="primary"
                shape="rounded"
                size="small"
                siblingCount={1}
                boundaryCount={1}
              />
            </Stack>
          </>
        )}
      </Box>
    </CrmSection>
  );
}
