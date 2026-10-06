"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { CrmSection } from "@/components/mui/crm-primitives";
import {
  getManualReport,
  importManualReport,
  listManualReports,
  type ManualReport,
  type ManualReportSummary,
} from "@/services/marketing-manual-reports.service";

const dateLabel = (value: string) => value.split("-").reverse().join("/");

export function ManualAnalyticsReports({ token }: { token: string | null }) {
  const [reports, setReports] = useState<ManualReportSummary[]>([]);
  const [selected, setSelected] = useState("");
  const [report, setReport] = useState<ManualReport | null>(null);
  const [title, setTitle] = useState("");
  const [propertyId, setPropertyId] = useState("283055240");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listManualReports(token, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setReports(items);
        setSelected((current) =>
          items.some((item) => item.id === current)
            ? current
            : (items[0]?.id ?? ""),
        );
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os relatórios.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, reload]);

  useEffect(() => {
    if (!token || !selected) return;
    const controller = new AbortController();
    setReport(null);
    setPage(0);
    getManualReport(token, selected, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setReport(data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível abrir o relatório.",
          );
      });
    return () => controller.abort();
  }, [token, selected, reload]);

  async function importFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !file || importing || loading) return;
    setError("");
    setMessage("");
    if (!/\.csv$/i.test(file.name) || file.size > 2 * 1024 * 1024) {
      setError("Selecione um CSV de até 2 MB exportado do GA4.");
      return;
    }
    setImporting(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("title", title.trim());
      form.set("propertyId", propertyId);
      form.set("inicio", inicio);
      form.set("fim", fim);
      const imported = await importManualReport(token, form);
      setReports((current) => [imported, ...current].slice(0, 100));
      setSelected(imported.id);
      setReport(imported);
      setPage(0);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setMessage("Relatório importado e salvo para consulta pelo time.");
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Não foi possível importar.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        Sem Google Cloud: exporte um relatório detalhado no GA4 em Compartilhar
        relatório &gt; Fazer download &gt; CSV. Importe novamente quando quiser
        atualizar os dados. As tags do site continuam coletando no Analytics.
      </Alert>
      <CrmSection sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Importar relatório do GA4
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Informe a propriedade e o mesmo período escolhido no GA4. Aceitamos
          uma tabela por arquivo, até 2 MB e 5.000 linhas.
        </Typography>
        <Box component="form" onSubmit={importFile}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                required
                fullWidth
                label="Nome do relatório"
                placeholder="Ex.: Aquisição de tráfego"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                slotProps={{ htmlInput: { maxLength: 120 } }}
              />
              <TextField
                required
                label="ID da propriedade GA4"
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
                slotProps={{
                  htmlInput: { pattern: "[0-9]{1,20}", maxLength: 20 },
                }}
                sx={{ minWidth: 230 }}
              />
              <TextField
                required
                type="date"
                label="Início"
                value={inicio}
                onChange={(event) => setInicio(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                required
                type="date"
                label="Fim"
                value={fim}
                onChange={(event) => setFim(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { sm: "center" } }}
            >
              <Button component="label" variant="outlined" disabled={importing}>
                Selecionar CSV
                <input
                  ref={fileInput}
                  hidden
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </Button>
              <Typography color="text.secondary">
                {file?.name ?? "Nenhum arquivo selecionado"}
              </Typography>
              <Button
                type="submit"
                variant="contained"
                disabled={
                  importing ||
                  loading ||
                  !token ||
                  !file ||
                  !title.trim() ||
                  !inicio ||
                  !fim ||
                  inicio > fim
                }
              >
                {importing ? "Importando..." : "Importar e salvar"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CrmSection>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {message ? <Alert severity="success">{message}</Alert> : null}
      <CrmSection sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", mb: 2 }}
        >
          <Typography variant="h6">Relatórios importados</Typography>
          <Button
            disabled={loading || importing}
            onClick={() => setReload((value) => value + 1)}
          >
            Atualizar lista
          </Button>
        </Stack>
        {loading ? (
          <CircularProgress aria-label="Carregando relatórios" />
        ) : !reports.length ? (
          <Typography color="text.secondary">
            Nenhum relatório importado. Exporte um CSV do GA4 para começar.
          </Typography>
        ) : (
          <>
            <TextField
              select
              fullWidth
              label="Relatório (100 importações mais recentes)"
              value={selected}
              disabled={importing}
              onChange={(event) => {
                setError("");
                setSelected(event.target.value);
              }}
            >
              {reports.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.title} · {dateLabel(item.startDate)} a{" "}
                  {dateLabel(item.endDate)} ·{" "}
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </MenuItem>
              ))}
            </TextField>
            {report ? (
              <>
                <Typography color="text.secondary" sx={{ my: 2 }}>
                  Origem: CSV importado manualmente · Propriedade{" "}
                  {report.propertyId} · {dateLabel(report.startDate)} a{" "}
                  {dateLabel(report.endDate)} · {report.rowCount} linhas ·
                  Importado em{" "}
                  {new Date(report.createdAt).toLocaleString("pt-BR")}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Valores conforme o arquivo exportado. O período é informado na
                  importação; estes dados não são atualizados automaticamente.
                </Typography>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader size="small" aria-label={report.title}>
                    <TableHead>
                      <TableRow>
                        {report.data.columns.map((column) => (
                          <TableCell key={column}>{column}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.data.rows
                        .slice(page * 25, page * 25 + 25)
                        .map((row, index) => (
                          <TableRow key={page * 25 + index}>
                            {row.map((value, cell) => (
                              <TableCell
                                key={cell}
                                sx={{
                                  maxWidth: 400,
                                  overflowWrap: "anywhere",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {value}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={report.rowCount}
                  rowsPerPage={25}
                  rowsPerPageOptions={[25]}
                  page={page}
                  onPageChange={(_, value) => setPage(value)}
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}–${to} de ${count}`
                  }
                  getItemAriaLabel={(type) =>
                    type === "next" ? "Próxima página" : "Página anterior"
                  }
                />
              </>
            ) : !error ? (
              <CircularProgress sx={{ mt: 2 }} aria-label="Abrindo relatório" />
            ) : null}
          </>
        )}
      </CrmSection>
    </Stack>
  );
}
