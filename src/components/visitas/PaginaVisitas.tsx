"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AppLayout } from "@/components/layout/app-layout";
import {
  camposSac,
  dataSac,
  liderSac,
  SecaoSac,
} from "@/components/atendimento-sac/ComponentesSac";
import { useAuth } from "@/context/auth-context";
import { requisitarVisitas } from "@/services/visitas.api";
import {
  rotulosStatusVisita,
  type ListaVisitas,
  type OpcoesVisitas,
} from "@/types/visitas";
import { acaoVisitaSx, StatusVisitaChip } from "./ComponentesVisitas";
const vazio = {
  protocolo: "",
  cliente: "",
  status: "",
  responsavelId: "",
  tipoVisita: "",
  inicio: "",
  fim: "",
};
const cards = [
  { status: "AGENDADA", titulo: "Agendadas" },
  { status: "AGUARDANDO_REALIZACAO", titulo: "Aguardando realização" },
  { status: "AGUARDANDO_VALIDACAO", titulo: "Em validação" },
  { status: "REAGENDAMENTO", titulo: "Reagendadas" },
  { status: "CONCLUIDA", titulo: "Concluídas" },
] as const;
export default function PaginaVisitas() {
  const { token, user } = useAuth();
  const lider = liderSac(user?.roles?.length ? user.roles : user?.role);
  const [filtros, setFiltros] = useState(vazio),
    [aplicados, setAplicados] = useState(vazio),
    [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<ListaVisitas>({
    itens: [],
    total: 0,
    pagina: 1,
    porPagina: 30,
    contagens: {},
  });
  const [opcoes, setOpcoes] = useState<OpcoesVisitas>({
    usuarios: [],
    responsaveis: [],
  });
  const [erro, setErro] = useState(""),
    [carregando, setCarregando] = useState(true);
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    setCarregando(true);
    setErro("");
    const q = new URLSearchParams({ pagina: String(pagina) });
    Object.entries(aplicados).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    requisitarVisitas<ListaVisitas>(token, "?" + q)
      .then((d) => {
        if (ativo) setDados(d);
      })
      .catch((e) => {
        if (ativo) setErro(e.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [token, aplicados, pagina]);
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    requisitarVisitas<OpcoesVisitas>(token, "/opcoes")
      .then((d) => {
        if (ativo) setOpcoes(d);
      })
      .catch((e) => {
        if (ativo) setErro(e.message);
      });
    return () => {
      ativo = false;
    };
  }, [token]);
  const campo = (k: keyof typeof vazio, v: string) =>
    setFiltros((f) => ({ ...f, [k]: v }));
  return (
    <AppLayout>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            gap: 2,
            alignItems: { sm: "center" },
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Visitas
            </Typography>
            <Typography color="text.secondary">
              {lider
                ? "Planeje e acompanhe as visitas aos clientes."
                : "Acompanhe e execute as visitas atribuídas a você."}
            </Typography>
          </Box>
          {lider && (
            <Button
              component={Link}
              href="/atendimento/visitas/nova"
              variant="contained"
              size="small"
              sx={acaoVisitaSx}
            >
              Nova visita
            </Button>
          )}
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2,minmax(0,1fr))",
              md: "repeat(5,minmax(0,1fr))",
            },
            gap: 2,
          }}
        >
          {cards.map((c) => (
            <Paper
              key={c.status}
              component="button"
              type="button"
              variant="outlined"
              onClick={() => {
                const f = { ...filtros, status: c.status };
                setFiltros(f);
                setAplicados(f);
                setPagina(1);
              }}
              sx={{
                p: 2,
                borderRadius: 3,
                textAlign: "left",
                cursor: "pointer",
                borderColor:
                  aplicados.status === c.status ? "#ff5805" : "divider",
                bgcolor: "background.paper",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Typography
                variant="h4"
                sx={{ color: "#ff5805", fontWeight: 800 }}
              >
                {dados.contagens[c.status] || 0}
              </Typography>
              <Typography variant="body2">{c.titulo}</Typography>
            </Paper>
          ))}
        </Box>
        <SecaoSac titulo="Filtros">
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              setPagina(1);
              setAplicados({ ...filtros });
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
                alignItems: "start",

                "& .MuiFormControl-root": {
                  width: "100%",
                  minWidth: 0,
                  margin: 0,
                },

                "& .MuiInputBase-root": {
                  height: 40,
                  minHeight: 40,
                  borderRadius: "8px",
                  boxSizing: "border-box",
                },

                "& .MuiInputBase-input": {
                  height: "100%",
                  boxSizing: "border-box",
                  fontSize: "0.875rem",
                },

                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  height: "40px !important",
                  boxSizing: "border-box",
                  fontSize: "0.875rem",
                },

                "& .MuiInputLabel-root": {
                  fontSize: "0.875rem",
                },

                "& .MuiInputLabel-shrink": {
                  transform: "translate(14px, -9px) scale(0.75)",
                },
              }}
            >
              <TextField
                label="Protocolo"
                size="small"
                value={filtros.protocolo}
                onChange={(e) => campo("protocolo", e.target.value)}
              />
              <TextField
                label="Cliente ou CNPJ"
                size="small"
                value={filtros.cliente}
                onChange={(e) => campo("cliente", e.target.value)}
              />
              <TextField
                label="Status"
                select
                size="small"
                value={filtros.status}
                onChange={(e) => campo("status", e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(rotulosStatusVisita).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
              {lider && (
                <TextField
                  label="Responsável"
                  select
                  size="small"
                  value={filtros.responsavelId}
                  onChange={(e) => campo("responsavelId", e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {opcoes.responsaveis.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <TextField
                label="Tipo de visita"
                size="small"
                value={filtros.tipoVisita}
                onChange={(e) => campo("tipoVisita", e.target.value)}
              />
              <TextField
                label="Data inicial"
                type="date"
                size="small"
                value={filtros.inicio}
                onChange={(e) => campo("inicio", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Data final"
                type="date"
                size="small"
                value={filtros.fim}
                onChange={(e) => campo("fim", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="small"
                sx={acaoVisitaSx}
              >
                Aplicar filtros
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setFiltros(vazio);
                  setAplicados(vazio);
                  setPagina(1);
                }}
              >
                Limpar
              </Button>
            </Stack>
          </Box>
        </SecaoSac>
        {erro && <Alert severity="error">{erro}</Alert>}
        {carregando ? (
          <CircularProgress size={28} aria-label="Carregando visitas" />
        ) : (
          !erro && (
            <SecaoSac titulo={dados.total + " visita(s)"}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {[
                        "Protocolo",
                        "Cliente",
                        "Status",
                        "Responsável",
                        "Data prevista",
                        "Tipo",
                        "",
                      ].map((h, i) => (
                        <TableCell key={i}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dados.itens.map((v) => (
                      <TableRow key={v.id} hover>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {v.protocolo}
                        </TableCell>
                        <TableCell>{v.clienteNome}</TableCell>
                        <TableCell>
                          <StatusVisitaChip status={v.status} />
                        </TableCell>
                        <TableCell>{v.responsavel.name}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {dataSac(v.dataPrevista)}
                        </TableCell>
                        <TableCell>{v.tipoVisita}</TableCell>
                        <TableCell>
                          <Button
                            component={Link}
                            href={"/atendimento/visitas/" + v.id}
                            size="small"
                            aria-label={"Abrir visita " + v.protocolo}
                          >
                            Abrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!dados.itens.length && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          Nenhuma visita encontrada para os filtros
                          selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {dados.total > dados.porPagina && (
                <Pagination
                  count={Math.ceil(dados.total / dados.porPagina)}
                  page={pagina}
                  onChange={(_, p) => setPagina(p)}
                  size="small"
                />
              )}
            </SecaoSac>
          )
        )}
      </Stack>
    </AppLayout>
  );
}
