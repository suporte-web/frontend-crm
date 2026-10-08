"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Pagination,
  Stack,
  Tab,
  Tabs,
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
import { useAuth } from "@/context/auth-context";
import { requisitarSac } from "@/services/atendimento-sac.api";
import {
  rotulosStatusSac,
  type AtendimentoSac,
  type PessoaSac,
} from "@/types/atendimento-sac.types";
import { dataSac, liderSac, SecaoSac, StatusSacChip } from "./ComponentesSac";
export default function PaginaFilaSac() {
  const { token, user } = useAuth();
  const [fila, setFila] = useState(0);
  const [filtros, setFiltros] = useState({
    protocolo: "",
    tipo: "",
    status: "",
    atendenteId: "",
    responsavelAcaoId: "",
    area: "",
    inicio: "",
    fim: "",
  });
  const [aplicados, setAplicados] = useState(filtros);
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<{
    itens: AtendimentoSac[];
    total: number;
  }>({ itens: [], total: 0 });
  const [pessoas, setPessoas] = useState<PessoaSac[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const lider = liderSac(user?.roles?.length ? user.roles : user?.role);
  const carregar = useCallback(async () => {
    if (!token || !user) return;
    setCarregando(true);
    setErro("");
    try {
      const q = new URLSearchParams();
      Object.entries(aplicados).forEach(([k, v]) => {
        if (v) q.set(k, v);
      });
      if (lider && fila === 1) q.set("status", "NOVO");
      if (lider && fila === 2) q.set("atendenteId", user.id);
      q.set("pagina", String(pagina));
      setDados(await requisitarSac(token, `?${q}`));
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao carregar atendimentos.",
      );
    } finally {
      setCarregando(false);
    }
  }, [token, user, aplicados, pagina, lider, fila]);
  useEffect(() => {
    void carregar();
  }, [carregar]);
  useEffect(() => {
    if (token)
      requisitarSac<PessoaSac[]>(token, "/participantes")
        .then(setPessoas)
        .catch(() => undefined);
  }, [token]);
  return (
    <AppLayout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {lider ? "Atendimento SAC" : "Meus atendimentos"}
          </Typography>
          <Typography color="text.secondary">
            Acompanhe as ocorrências recebidas pelo Canal do Cliente,
            responsáveis e prazos.
          </Typography>
        </Box>
        {lider && (
          <Tabs
            value={fila}
            onChange={(_, v) => {
              setFila(v);
              setPagina(1);
            }}
            variant="scrollable"
          >
            <Tab label="Todos os atendimentos" />
            <Tab label="Novos atendimentos" />
            <Tab label="Meus atendimentos" />
          </Tabs>
        )}
        <SecaoSac titulo="Filtros">
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              setPagina(1);
              setAplicados({ ...filtros });
            }}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
              alignItems: "end",
              width: "100%",
            }}
          >
            {Object.entries(filtros).map(([chave, valor]) => {
              const rotulos: Record<string, string> = {
                protocolo: "Protocolo",
                tipo: "Tipo",
                status: "Status",
                atendenteId: "Atendente",
                responsavelAcaoId: "Responsável pela ação",
                area: "Área",
                inicio: "Data inicial",
                fim: "Data final",
              };

              const select = [
                "tipo",
                "status",
                "atendenteId",
                "responsavelAcaoId",
              ].includes(chave);

              return (
                <TextField
                  key={chave}
                  label={rotulos[chave]}
                  value={valor}
                  disabled={chave === "atendenteId" && !lider}
                  size="small"
                  fullWidth
                  select={select}
                  type={["inicio", "fim"].includes(chave) ? "date" : "text"}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      [chave]: e.target.value,
                    })
                  }
                  sx={{
                    width: "100%",

                    "& .MuiInputBase-root": {
                      minHeight: 40,
                      borderRadius: 2,
                      backgroundColor: "#fff",
                    },

                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: "#ff5805",
                      },

                      "&.Mui-focused fieldset": {
                        borderColor: "#ff5805",
                      },
                    },

                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#ff5805",
                    },

                    "& .MuiInputBase-input": {
                      boxSizing: "border-box",
                      fontSize: 14,
                    },
                  }}
                >
                  {select && <MenuItem value="">Todos</MenuItem>}

                  {chave === "tipo" && [
                    <MenuItem key="r" value="RECLAMACAO">
                      Reclamação
                    </MenuItem>,

                    <MenuItem key="e" value="ELOGIO">
                      Elogio
                    </MenuItem>,
                  ]}

                  {chave === "status" &&
                    Object.entries(rotulosStatusSac).map(([k, v]) => (
                      <MenuItem key={k} value={k}>
                        {v}
                      </MenuItem>
                    ))}

                  {["atendenteId", "responsavelAcaoId"].includes(chave) &&
                    pessoas
                      .filter(
                        (p) =>
                          chave !== "atendenteId" ||
                          (p.roles?.length ? p.roles : [p.role]).includes(
                            "ATENDIMENTO",
                          ),
                      )
                      .map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                </TextField>
              );
            })}

            <Box
              sx={{
                gridColumn: {
                  xs: "1 / -1",
                },
                display: "flex",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                gap: 1,
                justifyContent: "flex-end",
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                mt: 0.5,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                size="small"
                sx={{
                  width: {
                    xs: "100%",
                    sm: "fit-content",
                  },
                  minWidth: 0,
                  px: 2.5,
                  py: 0.75,
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "none",
                  backgroundColor: "#ff5805",

                  "&:hover": {
                    backgroundColor: "#e94f00",
                  },
                }}
              >
                Aplicar filtros
              </Button>

              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={() => {
                  const vazios = {
                    protocolo: "",
                    tipo: "",
                    status: "",
                    atendenteId: "",
                    responsavelAcaoId: "",
                    area: "",
                    inicio: "",
                    fim: "",
                  };

                  setFiltros(vazios);
                  setAplicados(vazios);
                  setPagina(1);
                }}
                sx={{
                  width: {
                    xs: "100%",
                    sm: "fit-content",
                  },
                  minWidth: 0,
                  px: 2.5,
                  py: 0.75,
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "none",
                  color: "#ff5805",
                  borderColor: "#ff5805",

                  "&:hover": {
                    borderColor: "#e94f00",
                    backgroundColor: "#fff3ee",
                  },
                }}
              >
                Limpar
              </Button>
            </Box>
          </Box>
        </SecaoSac>
        {erro && (
          <Alert
            severity="error"
            action={<Button onClick={carregar}>Tentar novamente</Button>}
          >
            {erro}
          </Alert>
        )}
        <SecaoSac titulo={`${dados.total} atendimento(s)`}>
          {carregando ? (
            <CircularProgress size={28} />
          ) : !dados.itens.length ? (
            <Alert severity="info">
              Nenhum atendimento encontrado para esta fila e filtros.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 1300 }}>
                <TableHead>
                  <TableRow>
                    {[
                      "Protocolo / tipo",
                      "Solicitante / empresa",
                      "Entrada",
                      "Status",
                      "Atendente",
                      "Área",
                      "Responsável pela ação",
                      "Prazo",
                      "Atualização",
                      "Ações",
                    ].map((h) => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dados.itens.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>
                          {a.protocolo}
                        </Typography>
                        {a.tipo === "ELOGIO" ? "Elogio" : "Reclamação"}
                      </TableCell>
                      <TableCell>
                        {a.nome}
                        <Typography variant="caption" sx={{ display: "block" }}>
                          {a.empresa || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>{dataSac(a.criadoEm)}</TableCell>
                      <TableCell>
                        <StatusSacChip status={a.status} />
                      </TableCell>
                      <TableCell>
                        {a.atendente?.name || "Não atribuído"}
                      </TableCell>
                      <TableCell>{a.area || "—"}</TableCell>
                      <TableCell>{a.responsavelAcao?.name || "—"}</TableCell>
                      <TableCell
                        sx={{
                          color:
                            a.prazo &&
                              new Date(a.prazo) < new Date() &&
                              a.status !== "CONCLUIDO"
                              ? "error.main"
                              : "inherit",
                        }}
                      >
                        {dataSac(a.prazo)}
                      </TableCell>
                      <TableCell>{dataSac(a.atualizadoEm)}</TableCell>
                      <TableCell>
                        <Button
                          component={Link}
                          href={`/atendimento/${a.id}`}
                          variant="contained"
                          sx={{
                            backgroundColor: "#ff5805",
                            color: "#ffffff",
                            fontWeight: 600,
                            textTransform: "none",

                            "&:hover": {
                              backgroundColor: "#e94f00",
                            },
                          }}
                        >
                          Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Pagination
            count={Math.max(1, Math.ceil(dados.total / 30))}
            page={pagina}
            onChange={(_, p) => setPagina(p)}
          />
        </SecaoSac>
      </Stack>
    </AppLayout>
  );
}
