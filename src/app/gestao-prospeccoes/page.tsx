"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Pagination,
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
import {
  UserSearch,
  Users,
  Building2,
  History,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  CrmKpiCard,
} from "@/components/mui/crm-primitives";
import { IdentificacaoProspeccao } from "@/components/crm/prospeccao-consultora";
import { useAuth } from "@/context/auth-context";
import { getUserRoles } from "@/lib/user-roles";
import { apiFetch } from "@/services/api";

type Tipo = "LEAD" | "PROSPECT" | "CLIENTE";
type Filtros = {
  consultoraId?: string;
  status?: string;
  criadoDe?: string;
  criadoAte?: string;
  tipo?: string;
};
type Registro = {
  id: string;
  tipo: Tipo;
  nome: string;
  status: string | null;
  createdAt: string;
  prospectedByName: string | null;
  href: string | null;
};
type Resultado = {
  registros: Registro[];
  total: number;
  pagina: number;
  tamanho: number;
  indicadores: { leads: number; prospects: number; clientes: number };
};
type Historico = {
  consultora: string;
  observacoes: string | null;
  eventos: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
    createdBy?: { name: string } | null;
  }>;
  evolucao: Array<{ tipo: Tipo; id: string; data: string }>;
};
const rotulos: Record<string, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospect",
  CLIENTE: "Cliente",
  new: "Novo",
  converted: "Convertido em cliente",
  converted_to_prospect: "Convertido em prospect",
  entrada_leads: "Entrada de leads",
  qualificacao: "Qualificação",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
  ATIVO: "Ativo",
  PENDENTE: "Pendente",
  INATIVO: "Inativo",
  AGUARDANDO_CADASTRO: "Aguardando cadastro",
  EM_VALIDACAO: "Em validação",
  REPROVADO: "Reprovado",
};
const rotulo = (value: string | null) =>
  value ? (rotulos[value] ?? value.replaceAll("_", " ")) : "Não informado";
const data = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
const vazio: Resultado = {
  registros: [],
  total: 0,
  pagina: 1,
  tamanho: 20,
  indicadores: { leads: 0, prospects: 0, clientes: 0 },
};

export default function GestaoProspeccoesPage() {
  const { token, user } = useAuth();
  const perfis = getUserRoles(user);
  const autorizado =
    !perfis.includes("CONSULTORA") &&
    perfis.some((p) => ["ADMIN", "GESTAO", "COMERCIAL"].includes(p));
  const [rascunho, setRascunho] = useState<Filtros>({});
  const [filtros, setFiltros] = useState<Filtros>({});
  const [pagina, setPagina] = useState(1);
  const [revisao, setRevisao] = useState(0);
  const [resultado, setResultado] = useState<Resultado>(vazio);
  const [opcoes, setOpcoes] = useState<{
    consultoras: Array<{ id: string; nome: string }>;
    status: string[];
  }>({ consultoras: [], status: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroOpcoes, setErroOpcoes] = useState("");
  const [selecionado, setSelecionado] = useState<Registro | null>(null);
  const [historico, setHistorico] = useState<Historico | null>(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState("");
  useEffect(() => {
    if (!token || !autorizado) return;
    let ativo = true;
    apiFetch<typeof opcoes>("/gestao-prospeccoes/opcoes", {}, token)
      .then((r) => {
        if (ativo) {
          setOpcoes(r);
          setErroOpcoes("");
        }
      })
      .catch(() => {
        if (ativo)
          setErroOpcoes(
            "Não foi possível carregar as opções de filtros. Tente atualizar.",
          );
      });
    return () => {
      ativo = false;
    };
  }, [token, autorizado, revisao]);
  useEffect(() => {
    if (!token || !autorizado) return;
    let ativo = true;
    setCarregando(true);
    setErro("");
    const params = new URLSearchParams({
      pagina: String(pagina),
      tamanho: "20",
    });
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    apiFetch<Resultado>(`/gestao-prospeccoes?${params}`, {}, token)
      .then((r) => {
        if (ativo) setResultado(r);
      })
      .catch((e) => {
        if (ativo) {
          setResultado(vazio);
          setErro(
            e instanceof Error ? e.message : "Erro ao carregar as prospecções.",
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [token, autorizado, pagina, filtros, revisao]);
  useEffect(() => {
    if (!token || !selecionado) return;
    let ativo = true;
    setHistorico(null);
    setErroHistorico("");
    setCarregandoHistorico(true);
    apiFetch<Historico>(
      `/gestao-prospeccoes/${selecionado.tipo}/${selecionado.id}/historico`,
      {},
      token,
    )
      .then((r) => {
        if (ativo) setHistorico(r);
      })
      .catch((e) => {
        if (ativo)
          setErroHistorico(
            e instanceof Error ? e.message : "Erro ao carregar o histórico.",
          );
      })
      .finally(() => {
        if (ativo) setCarregandoHistorico(false);
      });
    return () => {
      ativo = false;
    };
  }, [token, selecionado]);
  const mudar = (campo: keyof Filtros, v: string) =>
    setRascunho((old) => ({ ...old, [campo]: v }));
  function aplicar(event: FormEvent) {
    event.preventDefault();
    setPagina(1);
    setFiltros({ ...rascunho });
  }
  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          title="Gestão de Prospecções"
          description="Acompanhe a prospecção das consultoras e a evolução dos cadastros comerciais."
          icon={<UserSearch size={30} />}
          aside={
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshCw size={15} />}
              onClick={() => setRevisao((r) => r + 1)}
              sx={{
                height: 38,
                px: 2,
                minWidth: 110,
                borderRadius: "10px",
                borderColor: "#dce3eb",
                bgcolor: "#ffffff",
                color: "#334155",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "none",
                boxShadow: "none",
                whiteSpace: "nowrap",

                "&:hover": {
                  bgcolor: "#fff7ed",
                  borderColor: "#ff5805",
                  color: "#ff5805",
                },

                "& .MuiButton-startIcon": {
                  marginRight: "6px",
                },
              }}
            >
              Atualizar
            </Button>
          }
        />
        {!autorizado ? (
          <Alert severity="warning">
            Esta tela está disponível para Admin, Gestão e Comercial.
          </Alert>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,1fr)",
                  lg: "repeat(4,1fr)",
                },
                gap: 2,
              }}
            >
              <CrmKpiCard
                title="Total de prospecções"
                value={carregando ? "—" : resultado.total}
                caption="Cadastros na etapa atual"
                icon={<UserSearch size={22} />}
              />
              <CrmKpiCard
                title="Leads"
                value={carregando ? "—" : resultado.indicadores.leads}
                icon={<Users size={22} />}
                accent="#1976d2"
              />
              <CrmKpiCard
                title="Prospects"
                value={carregando ? "—" : resultado.indicadores.prospects}
                icon={<UserSearch size={22} />}
                accent="#f57c00"
              />
              <CrmKpiCard
                title="Clientes"
                value={carregando ? "—" : resultado.indicadores.clientes}
                icon={<Building2 size={22} />}
                accent="#2e7d32"
              />
            </Box>
            <CrmSection sx={{ p: 2.5 }}>
              <Box component="form" onSubmit={aplicar}>
                <Stack spacing={2}>
                  <Typography component="h2" sx={{ fontWeight: 800 }}>
                    Filtrar prospecções
                  </Typography>
                  {erroOpcoes && <Alert severity="warning">{erroOpcoes}</Alert>}
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.5,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(3, minmax(0, 1fr))",
                      },
                      alignItems: "start",

                      "& .MuiTextField-root": {
                        width: "100%",
                        minWidth: 0,
                      },

                      "& .MuiOutlinedInput-root": {
                        height: "42px",
                        borderRadius: "10px",
                        backgroundColor: "#fff",
                      },

                      "& .MuiInputBase-input": {
                        fontSize: "13px",
                      },

                      "& .MuiInputLabel-root": {
                        fontSize: "13px",
                      },
                    }}
                  >
                    <TextField
                      select
                      size="small"
                      label="Consultora responsável pela prospecção"
                      value={rascunho.consultoraId || ""}
                      onChange={(e) => mudar("consultoraId", e.target.value)}
                    >
                      <MenuItem value="">Todas as consultoras</MenuItem>
                      {opcoes.consultoras.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      size="small"
                      label="Tipo de cadastro"
                      value={rascunho.tipo || ""}
                      onChange={(e) =>
                        setRascunho((old) => ({
                          ...old,
                          tipo: e.target.value,
                          status: "",
                        }))
                      }
                    >
                      <MenuItem value="">Todos os tipos</MenuItem>
                      {(["LEAD", "PROSPECT", "CLIENTE"] as const).map((t) => (
                        <MenuItem key={t} value={t}>
                          {rotulo(t)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      size="small"
                      label="Status"
                      value={rascunho.status || ""}
                      onChange={(e) => mudar("status", e.target.value)}
                    >
                      <MenuItem value="">Todos os status</MenuItem>
                      {opcoes.status.map((s) => (
                        <MenuItem key={s} value={s}>
                          {rotulo(s)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      type="date"
                      label="Cadastro a partir de"
                      value={rascunho.criadoDe || ""}
                      onChange={(e) => mudar("criadoDe", e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      size="small"
                      type="date"
                      label="Cadastro até"
                      value={rascunho.criadoAte || ""}
                      onChange={(e) => mudar("criadoAte", e.target.value)}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { min: rascunho.criadoDe },
                      }}
                    />
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        height: 42,
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gridColumn: {
                          xs: "1 / -1",
                          lg: "3 / 4",
                        },
                        "& .MuiButton-root": {
                          height: 38,
                          fontSize: 12,
                          textTransform: "none",
                          borderRadius: "10px",
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <Button
                        type="submit"
                        variant="contained"
                        sx={{
                          bgcolor: "#ff5805",
                          "&:hover": { bgcolor: "#e94f00" },
                        }}
                      >
                        Aplicar filtros
                      </Button>
                      <Button
                        onClick={() => {
                          setRascunho({});
                          setFiltros({});
                          setPagina(1);
                        }}
                      >
                        Limpar filtros
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </CrmSection>
            {erro && <Alert severity="error">{erro}</Alert>}
            <CrmSection>
              <Box sx={{ p: 2.5 }}>
                <Typography component="h2" sx={{ fontWeight: 800 }}>
                  Prospecções das consultoras
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {resultado.total} cadastro(s) encontrado(s)
                </Typography>
              </Box>
              {carregando ? (
                <Stack sx={{ p: 5, alignItems: "center" }}>
                  <CircularProgress aria-label="Carregando prospecções" />
                </Stack>
              ) : (
                <TableContainer>
                  <Table aria-label="Prospecções das consultoras">
                    <TableHead>
                      <TableRow>
                        {[
                          "Cadastro",
                          "Tipo",
                          "Consultora",
                          "Status",
                          "Cadastrado em",
                          "Ações",
                        ].map((label) => (
                          <TableCell key={label}>{label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resultado.registros.map((r) => (
                        <TableRow key={`${r.tipo}-${r.id}`} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700 }}>{r.nome}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={rotulo(r.tipo)}
                            />
                          </TableCell>
                          <TableCell>
                            <IdentificacaoProspeccao registro={r} />
                          </TableCell>
                          <TableCell>{rotulo(r.status)}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {data(r.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button
                                startIcon={<History size={16} />}
                                onClick={() => setSelecionado(r)}
                              >
                                Histórico
                              </Button>
                              {r.href && (
                                <Button
                                  component={Link}
                                  href={r.href}
                                  endIcon={<ArrowUpRight size={16} />}
                                >
                                  Abrir detalhes
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!resultado.registros.length && !erro && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                            Nenhuma prospecção encontrada com os filtros
                            selecionados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Stack sx={{ p: 2, alignItems: "center" }}>
                <Pagination
                  page={pagina}
                  count={Math.max(1, Math.ceil(resultado.total / 20))}
                  onChange={(_, value) => setPagina(value)}
                  disabled={carregando}
                  color="primary"
                  shape="rounded"
                />
              </Stack>
            </CrmSection>
          </>
        )}
        <Dialog
          open={Boolean(selecionado)}
          onClose={() => setSelecionado(null)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Histórico da prospecção{selecionado ? ` — ${selecionado.nome}` : ""}
          </DialogTitle>
          <DialogContent dividers>
            {carregandoHistorico ? (
              <CircularProgress aria-label="Carregando histórico" />
            ) : erroHistorico ? (
              <Alert severity="error">{erroHistorico}</Alert>
            ) : (
              historico && (
                <Stack spacing={2}>
                  <Typography>
                    Consultora prospectora:{" "}
                    <strong>{historico.consultora}</strong>
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                    {historico.evolucao.map((e) => (
                      <Chip
                        key={`${e.tipo}-${e.id}`}
                        variant="outlined"
                        label={`${rotulo(e.tipo)} · ${data(e.data)}`}
                      />
                    ))}
                  </Stack>
                  {historico.observacoes && (
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>
                        Observações do cadastro
                      </Typography>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>
                        {historico.observacoes}
                      </Typography>
                    </Box>
                  )}
                  <Typography sx={{ fontWeight: 800 }}>
                    Histórico de interações
                  </Typography>
                  {historico.eventos.length ? (
                    historico.eventos.map((e) => (
                      <Box
                        key={e.id}
                        sx={{ borderLeft: "3px solid #ff5805", pl: 2, py: 0.5 }}
                      >
                        <Typography sx={{ fontWeight: 700 }}>{e.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {data(e.createdAt)}
                          {e.createdBy?.name ? ` · ${e.createdBy.name}` : ""}
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>
                          {e.description}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      Nenhuma interação registrada.
                    </Typography>
                  )}
                </Stack>
              )
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelecionado(null)}>Fechar</Button>
          </DialogActions>
        </Dialog>
      </CrmPageShell>
    </AppLayout>
  );
}
