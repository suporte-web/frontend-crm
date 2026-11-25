import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  ListItemButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  ChevronDown,
  Copy,
  LockKeyhole,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { CrmPageShell, CrmSection } from "@/components/mui/crm-primitives";
import { useSidebar } from "@/components/ui/sidebar";
import {
  acaoPrincipalOportunidadeSx,
  acaoSecundariaOportunidadeSx,
  campoOportunidadeSx,
  superficieOportunidadeSx,
} from "@/components/crm/estilos-oportunidades";
import { useUser } from "@/UserContext";
import { hasAnyRole } from "@/lib/user-roles";
import { roleMeta } from "@/lib/user-role-presentation";
import { notificarCrm } from "@/lib/feedback-crm";
import {
  agruparPermissoesPerfil,
  alternarPermissaoPerfil,
  copiarPermissoesPerfil,
  filtrarGruposPermissoes,
  listarPermissoesPerfil,
  permissaoObrigatoriaAdmin,
  permissaoPerfilHabilitada,
  permissoesEfetivasPerfil,
  type PermissaoPerfil,
} from "@/lib/permissoes-perfil";
import { UsersService } from "@/stores/users/service";
import type { RoleScreenPermissionsGroup, UserRole } from "@/types/user";

const rotuloPerfil = (perfil: UserRole) => roleMeta[perfil]?.label ?? perfil;
const vazio: PermissaoPerfil[] = [];
type Situacao = "todas" | "habilitadas" | "desabilitadas" | "alteradas";
const switchSx = {
  flexShrink: 0,
  "& .MuiSwitch-switchBase.Mui-checked": { color: "#ff5805" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    bgcolor: "#ff5805",
  },
};

function BarraAcoes({ children }: { children: ReactNode }) {
  const { isMobile, state } = useSidebar();
  return (
    <Paper
      component="footer"
      variant="outlined"
      aria-label="Ações das permissões"
      sx={{
        ...superficieOportunidadeSx,
        position: "fixed",
        bottom: 12,
        right: 84,
        left: isMobile
          ? 12
          : `calc(var(--sidebar-width${state === "collapsed" ? "-icon" : ""}) + 24px)`,
        maxWidth: 1496,
        mx: "auto",
        zIndex: 40,
        p: "16px !important",
        boxShadow: "0 -4px 24px rgb(15 23 42 / 8%) !important",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        flexWrap: "wrap",
      }}
    >
      {children}
    </Paper>
  );
}

export default function PermissionsPage() {
  const { user: currentUser, refreshUser } = useUser();
  const [perfis, setPerfis] = useState<RoleScreenPermissionsGroup[]>([]);
  const [perfilSelecionado, setPerfilSelecionado] = useState<UserRole>("ADMIN");
  const [rascunhos, setRascunhos] = useState<
    Partial<Record<UserRole, PermissaoPerfil[]>>
  >({});
  const [busca, setBusca] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [situacao, setSituacao] = useState<Situacao>("todas");
  const [recolhidos, setRecolhidos] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const [perfilOrigem, setPerfilOrigem] = useState<UserRole | "">("");
  const emGravacao = useRef(false);
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    const atual = ++requisicao.current;
    setCarregando(true);
    setErroCarregamento("");
    try {
      const dados = await UsersService.getScreenPermissions();
      if (atual !== requisicao.current) return;
      setPerfis(dados);
      setPerfilSelecionado((anterior) =>
        dados.some((item) => item.role === anterior)
          ? anterior
          : (dados[0]?.role ?? "ADMIN"),
      );
    } catch (erro) {
      if (atual === requisicao.current)
        setErroCarregamento(
          erro instanceof Error
            ? erro.message
            : "Não foi possível carregar as permissões.",
        );
    } finally {
      if (atual === requisicao.current) setCarregando(false);
    }
  }, []);
  useEffect(() => {
    void carregar();
    return () => {
      requisicao.current++;
    };
  }, [carregar]);

  const catalogo = useMemo(() => listarPermissoesPerfil(perfis), [perfis]);
  const grupos = useMemo(() => agruparPermissoesPerfil(catalogo), [catalogo]);
  const base =
    perfis.find((item) => item.role === perfilSelecionado)?.screens ?? vazio;
  const rascunho = rascunhos[perfilSelecionado] ?? vazio;
  const efetivas = useMemo(
    () => permissoesEfetivasPerfil(base, rascunho),
    [base, rascunho],
  );
  const habilitada = (item: { key: string; label: string }) =>
    permissaoPerfilHabilitada(item, perfilSelecionado, efetivas);
  const alteradas = new Set(rascunho.map((item) => item.screenKey));
  const gruposVisiveis = filtrarGruposPermissoes(grupos, busca, grupoFiltro)
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter(
        (item) =>
          situacao === "todas" ||
          (situacao === "alteradas"
            ? alteradas.has(item.key)
            : habilitada(item) === (situacao === "habilitadas")),
      ),
    }))
    .filter((grupo) => grupo.itens.length);
  const totalHabilitadas = catalogo.filter(habilitada).length;
  const perfisPendentes = Object.values(rascunhos).filter(
    (itens) => itens?.length,
  ).length;
  const cadastroHabilitado = catalogo.some(
    (item) => item.key === "cadastros" && habilitada(item),
  );
  const temPerfil = perfis.some((item) => item.role === perfilSelecionado);
  const revisao = rascunho.map((item) => {
    const permissao = catalogo.find((valor) => valor.key === item.screenKey)!;
    return {
      ...item,
      label: permissao.label,
      anterior:
        base.find((valor) => valor.screenKey === item.screenKey)?.isEnabled ??
        permissaoPerfilHabilitada(permissao, perfilSelecionado, base),
    };
  });
  const liberadas = revisao.filter((item) => item.isEnabled).length;

  useEffect(() => {
    if (!perfisPendentes) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [perfisPendentes]);

  function alternar(chave: string) {
    if (emGravacao.current || carregando || !temPerfil) return;
    setRascunhos((anteriores) => ({
      ...anteriores,
      [perfilSelecionado]: alternarPermissaoPerfil(
        perfilSelecionado,
        base,
        anteriores[perfilSelecionado] ?? vazio,
        chave,
        catalogo,
      ),
    }));
  }

  function copiar() {
    const origem = perfis.find((item) => item.role === perfilOrigem);
    if (!origem || origem.role === perfilSelecionado || salvando) return;
    const novo = copiarPermissoesPerfil(
      perfilSelecionado,
      base,
      origem.role,
      origem.screens,
      catalogo,
    );
    setRascunhos((anteriores) => ({
      ...anteriores,
      [perfilSelecionado]: novo,
    }));
    setCopiando(false);
    notificarCrm(
      novo.length
        ? "Cópia preparada. Revise as alterações antes de salvar."
        : "Nenhuma alteração necessária para este perfil.",
      "info",
    );
  }

  async function salvar() {
    if (emGravacao.current || !rascunho.length || !temPerfil || !revisando)
      return;
    emGravacao.current = true;
    setSalvando(true);
    const perfil = perfilSelecionado;
    try {
      const atualizado = await UsersService.updateRoleScreenPermissions(perfil, {
        screens: rascunho.map((item) => ({
          ...item,
          screenLabel: item.screenLabel ?? undefined,
        })),
      });
      setPerfis((anteriores) =>
        anteriores.map((item) => (item.role === perfil ? atualizado : item)),
      );
      setRascunhos((anteriores) => ({ ...anteriores, [perfil]: [] }));
      setRevisando(false);
      notificarCrm(`Permissões de ${rotuloPerfil(perfil)} salvas com sucesso.`);
      if (hasAnyRole(currentUser, [perfil])) {
        try {
          await refreshUser();
        } catch {
          notificarCrm(
            "Permissões salvas. Não foi possível atualizar sua sessão; atualize a página para sincronizar o acesso.",
            "warning",
          );
        }
      }
    } catch (erro) {
      notificarCrm(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar as permissões. Suas alterações foram mantidas.",
        "error",
      );
    } finally {
      emGravacao.current = false;
      setSalvando(false);
    }
  }

  const filtrando = Boolean(busca || grupoFiltro || situacao !== "todas");
  function limparFiltros() {
    setBusca("");
    setGrupoFiltro("");
    setSituacao("todas");
  }

  return (
    <AppLayout>
      <CrmPageShell
        sx={{
          gap: 2,
          pb: { xs: 30, sm: 20, lg: 14 },
          containerType: "inline-size",
          containerName: "permissoes",
        }}
      >
        <CrmSection sx={superficieOportunidadeSx}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "flex-start" }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                bgcolor: "#fff4eb",
                color: "#c94600",
                borderRadius: "10px",
              }}
            >
              <ShieldCheck size={22} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 22, md: 25 },
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
                Permissões por perfil
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: 13, color: "#64748b" }}>
                Escolha um perfil, ajuste os acessos e revise antes de salvar.
              </Typography>
            </Box>
          </Stack>
        </CrmSection>

        {carregando ? (
          <Box
            role="status"
            aria-label="Carregando permissões"
            sx={{ py: 5, textAlign: "center" }}
          >
            <CircularProgress size={28} sx={{ color: "#ff5805" }} />
          </Box>
        ) : erroCarregamento ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void carregar()}
              >
                Tentar novamente
              </Button>
            }
          >
            {erroCarregamento}
          </Alert>
        ) : !perfis.length ? (
          <Alert severity="info">
            Nenhum perfil disponível para configurar.
          </Alert>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "240px minmax(0,1fr)",
                alignItems: "start",
                gap: 2,
                "@container permissoes (max-width: 800px)": {
                  gridTemplateColumns: "minmax(0,1fr)",
                },
              }}
            >
              <Paper
                component="nav"
                aria-label="Perfis de acesso"
                variant="outlined"
                sx={{ ...superficieOportunidadeSx, p: "12px !important" }}
              >
                <Typography
                  component="h2"
                  sx={{ px: 1, py: 0.75, fontSize: 13, fontWeight: 600 }}
                >
                  Perfis de acesso
                </Typography>
                <Typography
                  sx={{ px: 1, mb: 1.5, fontSize: 12, color: "#64748b" }}
                >
                  {perfis.length} perfis disponíveis
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 0.5,
                    "@container permissoes (max-width: 800px)": {
                      gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                    },
                    "@container permissoes (max-width: 420px)": {
                      gridTemplateColumns: "minmax(0,1fr)",
                    },
                  }}
                >
                  {perfis.map((perfil) => (
                    <ListItemButton
                      component="button"
                      type="button"
                      key={perfil.role}
                      selected={perfil.role === perfilSelecionado}
                      aria-pressed={perfil.role === perfilSelecionado}
                      disabled={salvando}
                      onClick={() => setPerfilSelecionado(perfil.role)}
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        borderRadius: "8px",
                        px: 1.25,
                        py: 1.25,
                        gap: 1,
                        alignItems: "flex-start",
                        "&.Mui-selected": {
                          bgcolor: "#fff4eb",
                          color: "#c94600",
                        },
                        "&.Mui-selected:hover": { bgcolor: "#ffeddc" },
                      }}
                    >
                      <Box sx={{ minWidth: 0, textAlign: "left" }}>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight:
                              perfil.role === perfilSelecionado ? 600 : 400,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {rotuloPerfil(perfil.role)}
                        </Typography>
                        {!!rascunhos[perfil.role]?.length && (
                          <Typography
                            sx={{ fontSize: 11, color: "#a16207", mt: 0.25 }}
                          >
                            {rascunhos[perfil.role]!.length} alterações
                            pendentes
                          </Typography>
                        )}
                      </Box>
                    </ListItemButton>
                  ))}
                </Box>
              </Paper>

              <Stack spacing={2} sx={{ minWidth: 0 }}>
                <Paper variant="outlined" sx={superficieOportunidadeSx}>
                  <Stack
                    direction="row"
                    useFlexGap
                    spacing={1.5}
                    sx={{
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        component="h2"
                        sx={{ fontSize: 19, fontWeight: 600 }}
                      >
                        {rotuloPerfil(perfilSelecionado)}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 12, color: "#64748b", mt: 0.5 }}
                      >
                        {totalHabilitadas} de {catalogo.length} funcionalidades
                        habilitadas
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={salvando || perfis.length < 2}
                      startIcon={<Copy size={15} />}
                      sx={acaoSecundariaOportunidadeSx}
                      onClick={() => {
                        setPerfilOrigem("");
                        setCopiando(true);
                      }}
                    >
                      Copiar de outro perfil
                    </Button>
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)",
                      gap: 1.5,
                      "@container permissoes (max-width: 1100px)": {
                        gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                        "& > :first-child": { gridColumn: "1 / -1" },
                      },
                      "@container permissoes (max-width: 440px)": {
                        gridTemplateColumns: "minmax(0,1fr)",
                      },
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="Buscar funcionalidade"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      sx={campoOportunidadeSx}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search size={16} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Grupo"
                      value={grupoFiltro}
                      onChange={(e) => setGrupoFiltro(e.target.value)}
                      sx={campoOportunidadeSx}
                      slotProps={{
                        inputLabel: { shrink: true },
                        select: { displayEmpty: true },
                      }}
                    >
                      <MenuItem value="">Todos os grupos</MenuItem>
                      {grupos.map((grupo) => (
                        <MenuItem key={grupo.id} value={grupo.id}>
                          {grupo.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Situação"
                      value={situacao}
                      onChange={(e) => setSituacao(e.target.value as Situacao)}
                      sx={campoOportunidadeSx}
                    >
                      <MenuItem value="todas">Todas</MenuItem>
                      <MenuItem value="habilitadas">Habilitadas</MenuItem>
                      <MenuItem value="desabilitadas">Desabilitadas</MenuItem>
                      <MenuItem value="alteradas">Alteradas</MenuItem>
                    </TextField>
                  </Box>
                  {filtrando && (
                    <Button
                      size="small"
                      onClick={limparFiltros}
                      sx={{ mt: 1, fontSize: 12, textTransform: "none" }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </Paper>

                {gruposVisiveis.map((grupo) => {
                  const todosItens = grupos.find(
                    (item) => item.id === grupo.id,
                  )!.itens;
                  const totalAlteradas = todosItens.filter((item) =>
                    alteradas.has(item.key),
                  ).length;
                  const chaveExpansao = JSON.stringify([
                    busca,
                    grupoFiltro,
                    situacao,
                    grupo.id,
                  ]);
                  return (
                    <Accordion
                      key={grupo.id}
                      disableGutters
                      elevation={0}
                      expanded={!recolhidos[chaveExpansao]}
                      onChange={(_, expanded) =>
                        setRecolhidos((anteriores) => ({
                          ...anteriores,
                          [chaveExpansao]: !expanded,
                        }))
                      }
                      sx={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px !important",
                        minWidth: 0,
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ChevronDown size={18} />}
                        id={`grupo-${grupo.id}-cabecalho`}
                        aria-controls={`grupo-${grupo.id}-conteudo`}
                        sx={{ px: 2, minHeight: 64 }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          sx={{
                            width: "100%",
                            alignItems: "center",
                            flexWrap: "wrap",
                            pr: 1,
                          }}
                        >
                          <Typography
                            component="h3"
                            sx={{ fontSize: 14, fontWeight: 600 }}
                          >
                            {grupo.nome}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                            {todosItens.filter(habilitada).length}/
                            {todosItens.length} habilitadas
                          </Typography>
                          {!!totalAlteradas && (
                            <Chip
                              size="small"
                              label={`${totalAlteradas} alteradas`}
                              sx={{
                                height: 22,
                                fontSize: 11,
                                bgcolor: "#fffbeb",
                                color: "#a16207",
                              }}
                            />
                          )}
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 2, pt: 0, pb: 1 }}>
                        {grupo.itens.map((item) => {
                          const obrigatoria = permissaoObrigatoriaAdmin(
                            perfilSelecionado,
                            item.key,
                          );
                          const modalidade = ["clients", "leads"].includes(
                            item.key,
                          );
                          const bloqueada =
                            obrigatoria || (modalidade && !cadastroHabilitado);
                          const ajuda = obrigatoria
                            ? "Obrigatória para Administrador"
                            : modalidade
                              ? cadastroHabilitado
                                ? "Modalidade de Cadastros"
                                : "Ative Cadastros para alterar este acesso"
                              : perfilSelecionado === "CONSULTORA" &&
                                  item.key === "opportunities"
                                ? "Somente cadastros sob sua responsabilidade"
                                : "";
                          return (
                            <Box
                              component="label"
                              key={item.key}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                minHeight: 62,
                                gap: 1,
                                py: 1,
                                borderTop: "1px solid #f1f5f9",
                                cursor:
                                  bloqueada || salvando ? "default" : "pointer",
                                ...(modalidade
                                  ? {
                                      pl: 2,
                                      ml: 1,
                                      borderLeft: "2px solid #e2e8f0",
                                    }
                                  : {}),
                              }}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  useFlexGap
                                  sx={{
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: 13,
                                      fontWeight:
                                        item.key === "cadastros" ? 600 : 400,
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {item.label}
                                  </Typography>
                                  {alteradas.has(item.key) && (
                                    <Chip
                                      size="small"
                                      label="Alterada"
                                      sx={{
                                        height: 20,
                                        fontSize: 10,
                                        bgcolor: "#fffbeb",
                                        color: "#a16207",
                                      }}
                                    />
                                  )}
                                </Stack>
                                {ajuda && (
                                  <Typography
                                    sx={{
                                      fontSize: 11,
                                      color: "#64748b",
                                      mt: 0.5,
                                    }}
                                  >
                                    {obrigatoria && (
                                      <LockKeyhole
                                        size={11}
                                        style={{
                                          verticalAlign: "middle",
                                          marginRight: 4,
                                        }}
                                      />
                                    )}
                                    {ajuda}
                                  </Typography>
                                )}
                              </Box>
                              <Switch
                                size="small"
                                checked={habilitada(item)}
                                disabled={salvando || bloqueada}
                                onChange={() => alternar(item.key)}
                                slotProps={{
                                  input: {
                                    "aria-label": `${item.label} — perfil ${rotuloPerfil(perfilSelecionado)}`,
                                  },
                                }}
                                sx={switchSx}
                              />
                            </Box>
                          );
                        })}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
                {!gruposVisiveis.length && (
                  <Alert
                    severity="info"
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={limparFiltros}
                      >
                        Limpar filtros
                      </Button>
                    }
                  >
                    Nenhuma funcionalidade encontrada para os filtros
                    selecionados.
                  </Alert>
                )}
              </Stack>
            </Box>
          </>
        )}

        <Dialog
          open={revisando}
          onClose={() => {
            if (!salvando) setRevisando(false);
          }}
          fullWidth
          maxWidth="sm"
          aria-labelledby="revisao-permissoes-titulo"
        >
          <DialogTitle id="revisao-permissoes-titulo">
            Revisar alterações
          </DialogTitle>
          <DialogContent dividers>
            <DialogContentText sx={{ mb: 2 }}>
              Confira os acessos de{" "}
              <strong>{rotuloPerfil(perfilSelecionado)}</strong> antes de
              aplicar.
            </DialogContentText>
            <Stack
              direction="row"
              useFlexGap
              spacing={1}
              sx={{ mb: 2, flexWrap: "wrap" }}
            >
              <Chip
                size="small"
                label={`${liberadas} para liberar`}
                color="success"
                variant="outlined"
              />
              <Chip
                size="small"
                label={`${revisao.length - liberadas} para bloquear`}
                color="error"
                variant="outlined"
              />
            </Stack>
            {revisao.map((item) => (
              <Box
                key={item.screenKey}
                sx={{ py: 1.5, borderTop: "1px solid #e2e8f0" }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                  {item.label}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: 13,
                    color: item.isEnabled ? "#15803d" : "#b91c1c",
                  }}
                >
                  {item.anterior ? "Habilitada" : "Desabilitada"} →{" "}
                  {item.isEnabled ? "Habilitada" : "Desabilitada"}
                </Typography>
              </Box>
            ))}
            <Alert severity="info" sx={{ mt: 2 }}>
              As alterações afetam todos os usuários deste perfil.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2, flexWrap: "wrap", gap: 1 }}>
            <Button
              disabled={salvando}
              onClick={() => setRevisando(false)}
              sx={acaoSecundariaOportunidadeSx}
            >
              Voltar à edição
            </Button>
            <Button
              variant="contained"
              disabled={salvando || !rascunho.length}
              onClick={() => void salvar()}
              startIcon={
                salvando ? (
                  <CircularProgress size={15} color="inherit" />
                ) : (
                  <Save size={16} />
                )
              }
              sx={acaoPrincipalOportunidadeSx}
            >
              {salvando ? "Salvando..." : "Confirmar e salvar"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={copiando}
          onClose={() => setCopiando(false)}
          fullWidth
          maxWidth="xs"
          aria-labelledby="copiar-permissoes-titulo"
        >
          <DialogTitle id="copiar-permissoes-titulo">
            Copiar de outro perfil
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Use os acessos salvos de outro perfil como ponto de partida para{" "}
              <strong>{rotuloPerfil(perfilSelecionado)}</strong>.
            </DialogContentText>
            <TextField
              select
              fullWidth
              size="small"
              label="Perfil de origem"
              value={perfilOrigem}
              onChange={(e) => setPerfilOrigem(e.target.value as UserRole)}
              sx={{ ...campoOportunidadeSx, mt: 1 }}
            >
              {perfis
                .filter((perfil) => perfil.role !== perfilSelecionado)
                .map((perfil) => (
                  <MenuItem key={perfil.role} value={perfil.role}>
                    {rotuloPerfil(perfil.role)}
                  </MenuItem>
                ))}
            </TextField>
            <Alert
              severity={rascunho.length ? "warning" : "info"}
              sx={{ mt: 2 }}
            >
              {rascunho.length
                ? "Esta cópia substituirá o rascunho atual deste perfil. "
                : ""}
              Permissões obrigatórias e vínculos do destino serão preservados.
              Nada será salvo automaticamente.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setCopiando(false)}
              sx={acaoSecundariaOportunidadeSx}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              disabled={!perfilOrigem}
              onClick={copiar}
              sx={acaoPrincipalOportunidadeSx}
            >
              Preparar cópia
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={confirmarDescarte}
          onClose={() => setConfirmarDescarte(false)}
          fullWidth
          maxWidth="xs"
          aria-labelledby="descartar-permissoes-titulo"
        >
          <DialogTitle id="descartar-permissoes-titulo">
            Descartar alterações?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              As alterações não salvas de {rotuloPerfil(perfilSelecionado)}{" "}
              serão descartadas. Os outros perfis serão preservados.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setConfirmarDescarte(false)}
              sx={acaoSecundariaOportunidadeSx}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setRascunhos((anteriores) => ({
                  ...anteriores,
                  [perfilSelecionado]: [],
                }));
                setConfirmarDescarte(false);
              }}
              sx={acaoPrincipalOportunidadeSx}
            >
              Descartar alterações
            </Button>
          </DialogActions>
        </Dialog>
      </CrmPageShell>
      {!carregando && !erroCarregamento && perfis.length > 0 && (
        <>
          <BarraAcoes>
            <Box sx={{ minWidth: 0, flex: "1 1 180px" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                {rotuloPerfil(perfilSelecionado)}
              </Typography>
              <Typography
                role="status"
                aria-live="polite"
                sx={{
                  fontSize: 12,
                  mt: 0.5,
                  color: rascunho.length ? "#a16207" : "#64748b",
                }}
              >
                {rascunho.length
                  ? `${rascunho.length} alterações não salvas`
                  : "Nenhuma alteração pendente"}
              </Typography>
              {perfisPendentes > 0 && (
                <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.5 }}>
                  Rascunhos em {perfisPendentes} perfil(is). Salve antes de
                  sair.
                </Typography>
              )}
            </Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              useFlexGap
              spacing={1}
              sx={{
                flexWrap: "wrap",
                width: { xs: "100%", sm: "auto" },
                "& > button": { width: { xs: "100%", sm: "auto" } },
              }}
            >
              <Button
                variant="outlined"
                disabled={salvando || !rascunho.length}
                onClick={() => setConfirmarDescarte(true)}
                sx={acaoSecundariaOportunidadeSx}
              >
                Descartar
              </Button>
              <Button
                variant="contained"
                disabled={salvando || !rascunho.length}
                onClick={() => setRevisando(true)}
                startIcon={<Save size={16} />}
                sx={acaoPrincipalOportunidadeSx}
              >
                Revisar e salvar
              </Button>
            </Stack>
          </BarraAcoes>
        </>
      )}
    </AppLayout>
  );
}
