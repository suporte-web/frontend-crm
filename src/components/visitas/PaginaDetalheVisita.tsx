"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import {
  camposSac,
  dataSac,
  liderSac,
  SecaoSac,
} from "@/components/atendimento-sac/ComponentesSac";
import { HistoricoAtendimento } from "@/components/atendimento/HistoricoAtendimento";
import { useAuth } from "@/context/auth-context";
import { requisitarVisitas } from "@/services/visitas.api";
import {
  rotulosEtapaVisita,
  rotulosStatusVisita,
  type EtapaVisita,
  type Visita,
} from "@/types/visitas";
import {
  acaoVisitaSx,
  AnexosVisita,
  StatusVisitaChip,
} from "./ComponentesVisitas";
import { PosVisita } from "./PosVisita";
import { ValidacaoVisita } from "./ValidacaoVisita";
import { RealizacaoVisita } from "./RealizacaoVisita";
import { FormularioVisita } from "./FormularioVisita";
export type AcaoVisita = (acao: string, dados?: unknown) => Promise<boolean>;
export default function PaginaDetalheVisita() {
  const { id } = useParams<{ id: string }>(),
    { token, user } = useAuth();
  const [visita, setVisita] = useState<Visita | null>(null),
    [aba, setAba] = useState(0),
    [erro, setErro] = useState(""),
    [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false),
    [etapaAnexo, setEtapaAnexo] = useState<EtapaVisita>("VISITA");
  const enviando = useRef(false);
  const lider = liderSac(user?.roles?.length ? user.roles : user?.role);
  const carregar = useCallback(async () => {
    if (!token) return;
    const v = await requisitarVisitas<Visita>(token, "/" + id);
    setVisita(v);
  }, [token, id]);
  useEffect(() => {
    let ativo = true;
    if (token)
      requisitarVisitas<Visita>(token, "/" + id)
        .then((v) => {
          if (ativo) {
            setVisita(v);
            setErro("");
          }
        })
        .catch((e) => {
          if (ativo) setErro(e.message);
        });
    return () => {
      ativo = false;
    };
  }, [token, id]);
  const agir: AcaoVisita = async (acao, dados) => {
    if (!token || enviando.current) return false;
    enviando.current = true;
    setOcupado(true);
    setErro("");
    try {
      await requisitarVisitas(token, "/" + id + "/" + acao, "POST", dados);
      await carregar();
      setMensagem("Visita atualizada.");
      return true;
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível atualizar a visita.",
      );
      return false;
    } finally {
      enviando.current = false;
      setOcupado(false);
    }
  };
  const podeExecutar = !!visita && (lider || visita.responsavelId === user?.id);
  const agendamento =
    !!visita &&
    ["AGENDADA", "AGUARDANDO_REALIZACAO", "REAGENDAMENTO"].includes(
      visita.status,
    );
  const podeAnexar =
    !!visita &&
    podeExecutar &&
    !ocupado &&
    ((etapaAnexo === "VISITA" && agendamento) ||
      (etapaAnexo === "REALIZACAO" &&
        ["AGUARDANDO_REALIZACAO", "REAGENDAMENTO"].includes(visita.status)) ||
      (etapaAnexo === "VALIDACAO" &&
        lider &&
        visita.status === "AGUARDANDO_VALIDACAO") ||
      (etapaAnexo === "POS_VISITA" && visita.status === "POS_VISITA"));
  const passo = visita
    ? {
        AGENDADA: 0,
        AGUARDANDO_REALIZACAO: 1,
        REAGENDAMENTO: 1,
        AGUARDANDO_VALIDACAO: 2,
        POS_VISITA: 3,
        ATENDIMENTO_SAC: 3,
        CONCLUIDA: 4,
      }[visita.status]
    : 0;
  return (
    <AppLayout>
      <Stack spacing={3}>
        <Button
          component={Link}
          href="/atendimento/visitas"
          size="small"
          sx={{ alignSelf: "flex-start" }}
        >
          Voltar para visitas
        </Button>
        {erro && (
          <Alert
            severity="error"
            action={
              <Button
                size="small"
                onClick={() =>
                  carregar()
                    .then(() => setErro(""))
                    .catch((e) => setErro(e.message))
                }
              >
                Atualizar
              </Button>
            }
          >
            {erro}
          </Alert>
        )}
        {!visita ? (
          !erro && <CircularProgress size={28} />
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {visita.protocolo} · {visita.clienteNome}
                </Typography>
                <StatusVisitaChip status={visita.status} />
                <Box
                  sx={{
                    ...camposSac,
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(3,minmax(0,1fr))",
                    },
                  }}
                >
                  <Typography>
                    <strong>Responsável:</strong> {visita.responsavel.name}
                  </Typography>
                  <Typography>
                    <strong>Data prevista:</strong>{" "}
                    {dataSac(visita.dataPrevista)}
                  </Typography>
                  <Typography>
                    <strong>Última atualização:</strong>{" "}
                    {dataSac(visita.atualizadoEm)}
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Stepper
                    activeStep={passo}
                    alternativeLabel
                    sx={{
                      minWidth: 520,
                      "& .MuiStepIcon-root.Mui-active": { color: "#ff5805" },
                      "& .MuiStepIcon-root.Mui-completed": { color: "#ff5805" },
                    }}
                  >
                    {[
                      "Agendamento",
                      "Realização",
                      "Validação",
                      "Pós-visita",
                      "Concluído",
                    ].map((p, i) => (
                      <Step
                        key={p}
                        completed={
                          i < passo ||
                          (i === 1 && visita.realizacoes.length > 0) ||
                          (i === 2 &&
                            visita.validacoes.some(
                              (v) => v.decisao === "APROVAR",
                            )) ||
                          (i === 3 && !!visita.avaliacaoRegistradaEm) ||
                          (i === 4 && visita.status === "CONCLUIDA")
                        }
                      >
                        <StepLabel>{p}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>
                {visita.status === "REAGENDAMENTO" && (
                  <Alert severity="warning">
                    Visita em reagendamento. As datas e etapas anteriores
                    continuam disponíveis no histórico.
                  </Alert>
                )}
                {visita.validacoes.length > 0 &&
                  visita.validacoes[visita.validacoes.length - 1].decisao !==
                    "APROVAR" &&
                  agendamento && (
                    <Alert severity="warning">
                      Ajuste solicitado:{" "}
                      {
                        visita.validacoes[visita.validacoes.length - 1]
                          .observacao
                      }
                    </Alert>
                  )}
                {visita.sac && (
                  <Alert
                    severity="info"
                    action={
                      <Button
                        component={Link}
                        href={"/atendimento/" + visita.sac.id}
                        size="small"
                      >
                        Abrir atendimento SAC
                      </Button>
                    }
                  >
                    Atendimento relacionado: {visita.sac.protocolo}
                  </Alert>
                )}
                {podeExecutar &&
                  ["AGENDADA", "REAGENDAMENTO"].includes(visita.status) && (
                    <Button
                      variant="contained"
                      size="small"
                      disabled={ocupado}
                      sx={{ ...acaoVisitaSx, alignSelf: "flex-start" }}
                      onClick={async () => {
                        if (await agir("iniciar")) setAba(1);
                      }}
                    >
                      Iniciar realização
                    </Button>
                  )}
              </Stack>
            </Paper>
            <Tabs
              value={aba}
              onChange={(_, v) => setAba(v)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Etapas da visita"
            >
              {[
                "Dados da visita",
                "Realização",
                "Validação",
                "Pós-visita",
                "Anexos",
                "Histórico",
              ].map((p) => (
                <Tab key={p} label={p} />
              ))}
            </Tabs>
            {aba === 0 && (
              <SecaoSac titulo="Dados da visita">
                {token && (
                  <FormularioVisita
                    key={visita.id}
                    visita={visita}
                    token={token}
                    permitido={lider && agendamento}
                    ocupado={ocupado}
                    salvar={async (dados) => {
                      if (enviando.current) return;
                      enviando.current = true;
                      setOcupado(true);
                      try {
                        await requisitarVisitas(token, "/" + id, "PUT", dados);
                        await carregar();
                        setMensagem("Dados da visita atualizados.");
                      } finally {
                        enviando.current = false;
                        setOcupado(false);
                      }
                    }}
                  />
                )}
                <Typography variant="subtitle2">
                  Participantes registrados
                </Typography>
                {!visita.participantes.length && (
                  <Typography color="text.secondary">
                    Nenhum participante registrado.
                  </Typography>
                )}
                {visita.participantes.map((p, i) => (
                  <Typography key={p.id || i}>
                    {p.nome}
                    {p.email ? " · " + p.email : ""}
                    {p.telefone ? " · " + p.telefone : ""}
                  </Typography>
                ))}
              </SecaoSac>
            )}
            {aba === 1 && token && (
              <RealizacaoVisita
                key={visita.status}
                visita={visita}
                token={token}
                permitido={
                  podeExecutar &&
                  ["AGUARDANDO_REALIZACAO", "REAGENDAMENTO"].includes(
                    visita.status,
                  )
                }
                ocupado={ocupado}
                agir={agir}
                atualizar={carregar}
                erro={setErro}
              />
            )}
            {aba === 2 && token && (
              <ValidacaoVisita
                key={visita.status}
                visita={visita}
                token={token}
                permitido={lider && visita.status === "AGUARDANDO_VALIDACAO"}
                ocupado={ocupado}
                agir={agir}
                atualizar={carregar}
                erro={setErro}
              />
            )}
            {aba === 3 && token && (
              <PosVisita
                key={visita.status}
                visita={visita}
                token={token}
                permitido={podeExecutar && visita.status === "POS_VISITA"}
                podeExecutar={podeExecutar}
                ocupado={ocupado}
                agir={agir}
                atualizar={carregar}
                erro={setErro}
              />
            )}
            {aba === 4 && token && (
              <SecaoSac titulo="Anexos">
                <TextField
                  label="Etapa"
                  select
                  size="small"
                  value={etapaAnexo}
                  onChange={(e) => setEtapaAnexo(e.target.value as EtapaVisita)}
                >
                  {Object.entries(rotulosEtapaVisita).map(([k, v]) => (
                    <MenuItem key={k} value={k}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
                <AnexosVisita
                  key={etapaAnexo}
                  visita={visita}
                  token={token}
                  etapa={etapaAnexo}
                  permitido={podeAnexar}
                  atualizar={carregar}
                  erro={setErro}
                />
              </SecaoSac>
            )}
            {aba === 5 && (
              <SecaoSac titulo="Histórico da visita">
                <HistoricoAtendimento
                  eventos={visita.historico}
                  rotulos={rotulosStatusVisita}
                />
                {visita.reagendamentos.length > 0 && (
                  <>
                    <Typography variant="h6">
                      Reagendamentos anteriores
                    </Typography>
                    {visita.reagendamentos.map((r) => (
                      <Paper
                        key={r.id}
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2 }}
                      >
                        <Typography>
                          {dataSac(r.dataAnterior)} → {dataSac(r.novaData)}
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>
                          {r.motivo}
                        </Typography>
                        <Typography variant="caption">
                          {dataSac(r.criadoEm)} · {r.usuario?.name}
                        </Typography>
                        {r.observacoes && (
                          <Typography>{r.observacoes}</Typography>
                        )}
                      </Paper>
                    ))}
                  </>
                )}
              </SecaoSac>
            )}
          </>
        )}
        <FeedbackToast
          title="Gestão de visitas"
          open={!!mensagem}
          message={mensagem}
          onClose={() => setMensagem("")}
        />
      </Stack>
    </AppLayout>
  );
}
