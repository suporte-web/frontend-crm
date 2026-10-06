"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import { requisitarSac } from "@/services/atendimento-sac.api";
import {
  rotulosStatusSac,
  type AtendimentoSac,
  type PessoaSac,
} from "@/types/atendimento-sac.types";
import {
  camposSac,
  dataSac,
  entradaDataSac,
  liderSac,
  ListaAnexosSac,
  SecaoSac,
  StatusSacChip,
  UploadAnexosSac,
} from "./ComponentesSac";
import { FormularioAcaoSac } from "./FormularioAcaoSac";
export default function PaginaDetalheSac() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [a, setA] = useState<AtendimentoSac | null>(null);
  const [pessoas, setPessoas] = useState<PessoaSac[]>([]);
  const [aba, setAba] = useState(0);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [direcionar, setDirecionar] = useState(false);
  const [atendente, setAtendente] = useState("");
  const [observacaoDirecionar, setObservacaoDirecionar] = useState("");
  const [observacao, setObservacao] = useState("");
  const [avaliacao, setAvaliacao] = useState<
    "aprovar" | "devolver" | "reabrir" | null
  >(null);
  const [motivo, setMotivo] = useState("");
  const [classificacao, setClassificacao] = useState({
    tipoReclamacao: "",
    documento: "",
    motivo: "",
    area: "",
    responsavelAcaoId: "",
    prazo: "",
    observacoesClassificacao: "",
  });
  const [rnc, setRnc] = useState({
    gerou: "",
    numero: "",
    data: "",
    hora: "",
    local: "",
    setor: "",
    motivo: "",
    descricao: "",
  });
  const lider = liderSac(user?.roles?.length ? user.roles : user?.role);
  const dadosCarregados = useRef("");
  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const d = await requisitarSac<AtendimentoSac>(token, `/${id}`);
      setA(d);
      setErro("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar atendimento.");
    }
  }, [token, id]);
  useEffect(() => {
    void carregar();
    if (token)
      requisitarSac<PessoaSac[]>(token, "/participantes")
        .then(setPessoas)
        .catch(() => undefined);
  }, [token, carregar]);
  useEffect(() => {
    if (!a) return;
    const chave = JSON.stringify([
      a.id,
      a.atendenteId,
      a.tipoReclamacao,
      a.documento,
      a.motivo,
      a.area,
      a.responsavelAcaoId,
      a.prazo,
      a.observacoesClassificacao,
      a.rnc,
    ]);
    if (dadosCarregados.current === chave) return;
    dadosCarregados.current = chave;
    setAtendente(a.atendenteId || "");
    setClassificacao({
      tipoReclamacao:
        a.tipoReclamacao || String(a.relatoOriginal.tipoReclamacao || ""),
      documento: a.documento || String(a.relatoOriginal.documento || ""),
      motivo: a.motivo || "",
      area: a.area || "",
      responsavelAcaoId: a.responsavelAcaoId || "",
      prazo: entradaDataSac(a.prazo),
      observacoesClassificacao: a.observacoesClassificacao || "",
    });
    setRnc({
      gerou: a.rnc ? String(a.rnc.gerou) : "",
      numero: String(a.rnc?.numero || ""),
      data: String(a.rnc?.data || "").slice(0, 10),
      hora: String(a.rnc?.hora || ""),
      local: String(a.rnc?.local || ""),
      setor: String(a.rnc?.setor || ""),
      motivo: String(a.rnc?.motivo || ""),
      descricao: String(a.rnc?.descricao || ""),
    });
  }, [a]);
  async function agir(caminho: string, dados?: unknown) {
    if (!token || ocupado) return false;
    setOcupado(true);
    setErro("");
    try {
      await requisitarSac(token, `/${id}/${caminho}`, "POST", dados);
      await carregar();
      setMensagem("Atendimento atualizado.");
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível atualizar.");
      return false;
    } finally {
      setOcupado(false);
    }
  }
  const classificavel =
    !!a &&
    ["EM_ATENDIMENTO", "CLASSIFICADO", "AGUARDANDO_ACAO"].includes(a.status);
  const avaliavel = a?.status === "AGUARDANDO_AVALIACAO";
  async function salvarClassificacao() {
    if (!classificacao.prazo) {
      setErro("Informe o prazo.");
      return;
    }
    await agir("classificar", {
      ...classificacao,
      prazo: new Date(classificacao.prazo).toISOString(),
    });
  }
  async function salvarRnc() {
    if (!rnc.gerou) {
      setErro("Informe se houve RNC.");
      return;
    }
    await agir(
      "rnc",
      rnc.gerou === "true"
        ? { ...rnc, gerou: true, data: rnc.data || undefined }
        : { gerou: false },
    );
  }
  async function confirmarAvaliacao() {
    const ok = await agir(
      avaliacao === "reabrir" ? "reabrir" : "avaliar",
      avaliacao === "reabrir"
        ? { observacao: motivo }
        : { aprovado: avaliacao === "aprovar", motivo },
    );
    if (ok) {
      setAvaliacao(null);
      setMotivo("");
    }
  }
  const abas = [
    "Relato",
    "Classificação",
    "Ação corretiva",
    "RNC",
    "Anexos",
    "Histórico / Tarefas",
  ];
  return (
    <AppLayout>
      <Stack spacing={3}>
        <Button
          component={Link}
          href="/atendimento"
          sx={{ alignSelf: "flex-start" }}
        >
          ← Voltar aos atendimentos
        </Button>
        {erro && (
          <Alert
            severity="error"
            action={<Button onClick={carregar}>Atualizar</Button>}
          >
            {erro}
          </Alert>
        )}
        {!a && !erro && <CircularProgress />}
        {a && token && (
          <>
            <SecaoSac
              titulo={`${a.protocolo} · ${a.tipo === "ELOGIO" ? "Elogio" : "Reclamação"}`}
            >
              <StatusSacChip status={a.status} />
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
                {[
                  ["Solicitante", a.nome],
                  ["Empresa", a.empresa],
                  ["Entrada", dataSac(a.criadoEm)],
                  ["Atendente", a.atendente?.name],
                  ["Área responsável", a.area],
                  ["Responsável pela ação", a.responsavelAcao?.name],
                  ["Prazo", dataSac(a.prazo)],
                  ["Última atualização", dataSac(a.atualizadoEm)],
                ].map(([r, v]) => (
                  <Box key={r}>
                    <Typography variant="caption" color="text.secondary">
                      {r}
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{v || "—"}</Typography>
                  </Box>
                ))}
              </Box>
              {a.concluidoEm && (
                <Alert severity="success">
                  Concluído por {a.concluidoPor?.name || "—"} em{" "}
                  {dataSac(a.concluidoEm)}.
                </Alert>
              )}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{ gap: 1, flexWrap: "wrap" }}
              >
                {lider && a.status !== "CONCLUIDO" && (
                  <Button
                    variant="contained"
                    onClick={() => setDirecionar(true)}
                  >
                    {a.atendenteId
                      ? "Reatribuir atendimento"
                      : "Direcionar atendimento"}
                  </Button>
                )}
                {["ATRIBUIDO", "REABERTO"].includes(a.status) &&
                  a.atendenteId && (
                    <Button
                      disabled={ocupado}
                      variant="contained"
                      onClick={() => agir("iniciar")}
                    >
                      Iniciar atendimento
                    </Button>
                  )}
                {avaliavel && (
                  <>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setMotivo("");
                        setAvaliacao("aprovar");
                      }}
                    >
                      Aprovar solução
                    </Button>
                    <Button
                      color="warning"
                      variant="outlined"
                      onClick={() => {
                        setMotivo("");
                        setAvaliacao("devolver");
                      }}
                    >
                      Devolver para correção
                    </Button>
                  </>
                )}
                {lider && a.status === "CONCLUIDO" && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setMotivo("");
                      setAvaliacao("reabrir");
                    }}
                    sx={{
                      color: "#ff5805",
                      borderColor: "#ff5805",
                      fontWeight: 700,
                      textTransform: "none",

                      "&:hover": {
                        borderColor: "#e94f00",
                        backgroundColor: "#fff3ee",
                      },
                    }}
                  >
                    Reabrir atendimento
                  </Button>
                )}
              </Stack>
            </SecaoSac>
            <Tabs
              value={aba}
              onChange={(_, v) => setAba(v)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Etapas do atendimento"
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "#ff5805",
                  height: 3,
                  borderRadius: 2,
                },

                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 48,
                },

                "& .MuiTab-root.Mui-selected": {
                  color: "#ff5805",
                  fontWeight: 700,
                },
              }}
            >
              {abas.map((nome) => (
                <Tab key={nome} label={nome} />
              ))}
            </Tabs>
            {aba === 0 && (
              <SecaoSac titulo="Relato original recebido pelo site">
                <Alert severity="info">
                  Este relato é preservado. A classificação e as observações
                  internas são registradas separadamente.
                </Alert>
                <Box sx={camposSac}>
                  {[
                    ["Nome", a.nome],
                    ["Telefone", a.telefone],
                    ["E-mail", a.email],
                    ["Empresa", a.empresa],
                    ["Cidade", a.cidade],
                    ["Estado", a.estado],
                    ["Documento original", a.relatoOriginal.documento],
                    [
                      "Data do envio",
                      dataSac(String(a.relatoOriginal.enviadoEm || a.criadoEm)),
                    ],
                  ].map(([r, v]) => (
                    <Box key={String(r)}>
                      <Typography variant="caption" color="text.secondary">
                        {String(r)}
                      </Typography>
                      <Typography>{String(v || "—")}</Typography>
                    </Box>
                  ))}
                </Box>
                <Typography
                  sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {String(a.relatoOriginal.relato || "")}
                </Typography>
                <ListaAnexosSac
                  anexos={a.anexos.filter((x) => x.etapa === "SITE")}
                  token={token}
                  id={id}
                  erro={setErro}
                />
              </SecaoSac>
            )}
            {aba === 1 && (
              <SecaoSac titulo="Classificação da ocorrência">
                {!classificavel && (
                  <Alert severity="info">
                    A classificação pode ser preenchida após iniciar o
                    atendimento e antes de iniciar a ação.
                  </Alert>
                )}
                <Box sx={camposSac}>
                  {(
                    [
                      {
                        k: "tipoReclamacao",
                        r: "Tipo da reclamação / ocorrência",
                        max: 150,
                      },
                      { k: "documento", r: "ID / CT-e / NF", max: 150 },
                      { k: "motivo", r: "Motivo consolidado", max: 4000 },
                      { k: "area", r: "Área responsável", max: 150 },
                      {
                        k: "responsavelAcaoId",
                        r: "Responsável pela ação corretiva",
                        max: 150,
                      },
                      { k: "prazo", r: "Prazo", max: 150 },
                      {
                        k: "observacoesClassificacao",
                        r: "Observações da classificação",
                        max: 4000,
                      },
                    ] as const
                  ).map((f) => (

                    <TextField
                      key={f.k}
                      label={f.r}
                      value={classificacao[f.k]}
                      disabled={!classificavel || ocupado}
                      type={f.k === "prazo" ? "datetime-local" : "text"}
                      select={f.k === "responsavelAcaoId"}
                      multiline={[
                        "motivo",
                        "observacoesClassificacao",
                      ].includes(f.k)}
                      minRows={
                        ["motivo", "observacoesClassificacao"].includes(f.k)
                          ? 3
                          : undefined
                      }
                      fullWidth
                      sx={{
                        gridColumn: [
                          "motivo",
                          "observacoesClassificacao",
                        ].includes(f.k)
                          ? "1 / -1"
                          : "auto",
                      }}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { maxLength: f.max },
                      }}
                      onChange={(e) =>
                        setClassificacao({
                          ...classificacao,
                          [f.k]: e.target.value,
                        })
                      }
                    >
                      {f.k === "responsavelAcaoId" &&
                        pessoas.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} · {p.role.replaceAll("_", " ")}
                          </MenuItem>
                        ))}
                    </TextField>
                  ))}
                </Box>
                {classificavel && (
                  <Button
                    disabled={ocupado}
                    variant="contained"
                    onClick={salvarClassificacao}
                    sx={{
                      backgroundColor: "#ff5805",
                      color: "#ffffff",

                      width: "fit-content",
                      minWidth: 0,

                      px: 2,
                      py: 0.75,

                      fontSize: 13,
                      fontWeight: 700,

                      textTransform: "none",

                      "&:hover": {
                        backgroundColor: "#e94f00",
                      },
                    }}
                  >
                    Salvar classificação e direcionar ação
                  </Button>
                )}
                <ListaAnexosSac
                  anexos={a.anexos.filter((x) => x.etapa === "CLASSIFICACAO")}
                  token={token}
                  id={id}
                  erro={setErro}
                />
                {classificavel && (
                  <UploadAnexosSac
                    token={token}
                    id={id}
                    etapa="CLASSIFICACAO"
                    concluido={carregar}
                    erro={setErro}
                  />
                )}
              </SecaoSac>
            )}
            {aba === 2 && (
              <SecaoSac titulo="Ação corretiva">
                <FormularioAcaoSac
                  acao={a}
                  token={token}
                  permitido={lider || a.responsavelAcaoId === user?.id}
                  atualizar={carregar}
                  erro={setErro}
                  sucesso={setMensagem}
                />
              </SecaoSac>
            )}
            {aba === 3 && (
              <SecaoSac titulo="Registro de não conformidade (RNC)">
                <TextField
                  select
                  label="Gerou RNC?"
                  value={rnc.gerou}
                  disabled={!avaliavel || ocupado}
                  onChange={(e) => setRnc({ ...rnc, gerou: e.target.value })}
                >
                  <MenuItem value="">Selecione</MenuItem>
                  <MenuItem value="true">Sim</MenuItem>
                  <MenuItem value="false">Não</MenuItem>
                </TextField>
                {rnc.gerou === "true" && (
                  <Box sx={camposSac}>
                    {(
                      [
                        { k: "numero", r: "Número da RNC", tipo: "text" },
                        { k: "data", r: "Data do desvio", tipo: "date" },
                        { k: "hora", r: "Hora do desvio", tipo: "time" },
                        { k: "local", r: "Local do desvio", tipo: "text" },
                        {
                          k: "setor",
                          r: "Setor responsável pela análise",
                          tipo: "text",
                        },
                        { k: "motivo", r: "Motivo consolidado", tipo: "text" },
                        { k: "descricao", r: "Descrição", tipo: "text" },
                      ] as const
                    ).map((f) => (
                      <TextField
                        key={f.k}
                        label={f.r}
                        type={f.tipo}
                        value={rnc[f.k]}
                        disabled={!avaliavel || ocupado}
                        multiline={["motivo", "descricao"].includes(f.k)}
                        minRows={
                          ["motivo", "descricao"].includes(f.k) ? 3 : undefined
                        }
                        slotProps={{
                          inputLabel: { shrink: true },
                          htmlInput: {
                            maxLength:
                              f.k === "descricao"
                                ? 10000
                                : f.k === "motivo"
                                  ? 4000
                                  : 150,
                          },
                        }}
                        onChange={(e) =>
                          setRnc({ ...rnc, [f.k]: e.target.value })
                        }
                      />
                    ))}
                  </Box>
                )}
                {avaliavel && (
                  <Button
                    variant="contained"
                    disabled={ocupado}
                    onClick={salvarRnc}
                  >
                    Registrar decisão sobre RNC
                  </Button>
                )}
                <ListaAnexosSac
                  anexos={a.anexos.filter((x) => x.etapa === "RNC")}
                  token={token}
                  id={id}
                  erro={setErro}
                />
                {avaliavel && rnc.gerou === "true" && (
                  <UploadAnexosSac
                    token={token}
                    id={id}
                    etapa="RNC"
                    concluido={carregar}
                    erro={setErro}
                  />
                )}
              </SecaoSac>
            )}
            {aba === 4 && (
              <SecaoSac titulo="Anexos e evidências">
                <ListaAnexosSac
                  anexos={a.anexos}
                  token={token}
                  id={id}
                  erro={setErro}
                />
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#ff5805",
                    fontSize: 14,
                  }}
                >
                  Adicionar anexos
                </Typography>

                <UploadAnexosSac
                  token={token}
                  id={id}
                  etapa="ANEXOS"
                  concluido={carregar}
                  erro={setErro}
                />
              </SecaoSac>
            )}
            {aba === 5 && (
              <Stack spacing={3}>
                <SecaoSac titulo="Histórico do atendimento">
                  <Box
                    sx={{
                      borderLeft: "2px solid",
                      borderColor: "divider",
                      pl: 3,
                    }}
                  >
                    {a.historico.map((h) => (
                      <Box
                        key={h.id}
                        sx={{
                          position: "relative",
                          pb: 3,
                          "&:before": {
                            content: '""',
                            position: "absolute",
                            left: -31,
                            top: 6,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {h.descricao}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dataSac(h.criadoEm)} ·{" "}
                          {h.usuario?.name || "Site / sistema"}
                          {h.tarefaId
                            ? ` · Tarefa ${h.tarefaId.slice(0, 8)}`
                            : ""}
                        </Typography>
                        {h.statusAnterior &&
                          h.statusNovo &&
                          h.statusAnterior !== h.statusNovo && (
                            <Typography variant="body2">
                              {rotulosStatusSac[h.statusAnterior]} →{" "}
                              {rotulosStatusSac[h.statusNovo]}
                            </Typography>
                          )}
                      </Box>
                    ))}
                  </Box>
                  <TextField
                    label="Adicionar observação interna"
                    value={observacao}
                    multiline
                    minRows={3}
                    slotProps={{ htmlInput: { maxLength: 4000 } }}
                    onChange={(e) => setObservacao(e.target.value)}
                  />
                  <Button
                    disabled={ocupado || observacao.trim().length < 3}
                    variant="outlined"
                    onClick={async () => {
                      if (await agir("observacoes", { observacao }))
                        setObservacao("");
                    }}
                  >
                    Registrar observação
                  </Button>
                </SecaoSac>
                <SecaoSac titulo="Tarefas e prazos">
                  {a.tarefas.map((t) => (
                    <Box
                      key={t.id}
                      sx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        pb: 2,
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {t.titulo} · {t.status.replaceAll("_", " ")}
                      </Typography>
                      <Typography variant="body2">
                        Responsável:{" "}
                        {t.responsavel?.name ||
                          (t.tipo === "TRIAGEM" ? "Fila do líder" : "—")}{" "}
                        · Criador: {t.criador?.name || "Sistema"}
                      </Typography>
                      <Typography variant="body2">
                        Criada: {dataSac(t.criadoEm)} · Prazo:{" "}
                        {dataSac(t.prazo)}
                      </Typography>
                      <Typography variant="body2">
                        Início: {dataSac(t.iniciadoEm)} · Conclusão:{" "}
                        {dataSac(t.concluidoEm)}
                      </Typography>
                      {t.observacao && (
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>
                          {t.observacao}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </SecaoSac>
              </Stack>
            )}
            <Dialog
              open={direcionar}
              onClose={() => !ocupado && setDirecionar(false)}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>
                {a.atendenteId
                  ? "Reatribuir atendimento"
                  : "Direcionar atendimento"}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <TextField
                    label="Atendente responsável"
                    select
                    value={atendente}
                    onChange={(e) => setAtendente(e.target.value)}
                  >
                    {pessoas
                      .filter((p) => (p.roles?.length ? p.roles : [p.role]).includes("ATENDIMENTO"))
                      .map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                  </TextField>
                  {!pessoas.some((p) => (p.roles?.length ? p.roles : [p.role]).includes("ATENDIMENTO")) && (
                    <Alert severity="info">
                      Cadastre um usuário com perfil Atendimento na área de
                      Usuários.
                    </Alert>
                  )}
                  <TextField
                    label="Observação (opcional)"
                    value={observacaoDirecionar}
                    multiline
                    minRows={3}
                    slotProps={{ htmlInput: { maxLength: 4000 } }}
                    onChange={(e) => setObservacaoDirecionar(e.target.value)}
                  />
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button disabled={ocupado} onClick={() => setDirecionar(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  disabled={ocupado || !atendente}
                  onClick={async () => {
                    if (
                      await agir("direcionar", {
                        atendenteId: atendente,
                        observacao: observacaoDirecionar,
                      })
                    ) {
                      setDirecionar(false);
                      setObservacaoDirecionar("");
                    }
                  }}
                >
                  Confirmar direcionamento
                </Button>
              </DialogActions>
            </Dialog>
            <Dialog
              open={!!avaliacao}
              onClose={() => !ocupado && setAvaliacao(null)}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>
                {avaliacao === "aprovar"
                  ? "Aprovar solução e concluir"
                  : avaliacao === "devolver"
                    ? "Devolver para correção"
                    : "Reabrir atendimento"}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  {avaliacao === "aprovar" && (
                    <Alert severity="info">
                      Registre a decisão sobre RNC e envie as evidências de
                      conclusão antes de aprovar.
                    </Alert>
                  )}
                  <TextField
                    label={
                      avaliacao === "aprovar"
                        ? "Observação (opcional)"
                        : "Motivo obrigatório"
                    }
                    value={motivo}
                    multiline
                    minRows={3}
                    slotProps={{ htmlInput: { maxLength: 4000 } }}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button disabled={ocupado} onClick={() => setAvaliacao(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  disabled={
                    ocupado ||
                    (avaliacao !== "aprovar" && motivo.trim().length < 3)
                  }
                  onClick={confirmarAvaliacao}
                >
                  Confirmar
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
        <FeedbackToast
          open={!!mensagem}
          title="Atendimento SAC"
          message={mensagem}
          onClose={() => setMensagem("")}
        />
      </Stack>
    </AppLayout>
  );
}
