"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import { requisitarSac } from "@/services/atendimento-sac.api";
import type { AcaoSac, MinhaTarefaSac } from "@/types/atendimento-sac.types";
import { dataSac, SecaoSac, StatusSacChip } from "./ComponentesSac";
import { FormularioAcaoSac } from "./FormularioAcaoSac";
export default function PaginaAcoesSac() {
  const { token } = useAuth();
  const [tarefas, setTarefas] = useState<MinhaTarefaSac[]>([]);
  const [acao, setAcao] = useState<AcaoSac | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      setTarefas(await requisitarSac(token, "/minhas-acoes"));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar ações.");
    } finally {
      setCarregando(false);
    }
  }, [token]);
  const abrir = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        setAcao(await requisitarSac(token, `/minhas-acoes/${id}`));
        setErro("");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao abrir ação.");
      }
    },
    [token],
  );
  useEffect(() => {
    void carregar();
    const id = new URLSearchParams(window.location.search).get("atendimento");
    if (id) void abrir(id);
  }, [carregar, abrir]);
  async function atualizar() {
    await carregar();
    if (acao) await abrir(acao.id);
  }
  const pendentes = tarefas.filter((t) =>
    ["PENDENTE", "EM_ANDAMENTO"].includes(t.status),
  );
  const concluidas = tarefas.filter(
    (t) => !["PENDENTE", "EM_ANDAMENTO"].includes(t.status),
  );
  return (
    <AppLayout>
      <Stack spacing={3}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Minhas ações pendentes
        </Typography>
        <Typography color="text.secondary">
          Você acessa somente as tarefas atribuídas diretamente a você.
        </Typography>
        {erro && <Alert severity="error">{erro}</Alert>}
        {carregando ? (
          <CircularProgress />
        ) : (
          <SecaoSac titulo={`${pendentes.length} ação pendente${pendentes.length !== 1 ? "s" : ""}`}>
            {!pendentes.length && (
              <Alert severity="info">
                Nenhuma ação pendente atribuída a você.
              </Alert>
            )}
            {pendentes.map((t) => (
              <Stack
                key={t.id}
                direction={{ xs: "column", sm: "row" }}
                sx={{ justifyContent: "space-between", gap: 1 }}
              >
                <Stack>
                  <Typography sx={{ fontWeight: 700 }}>
                    {t.atendimento.protocolo} · {t.titulo}
                  </Typography>
                  <Typography>
                    {t.atendimento.area || "Área não definida"} · Prazo:{" "}
                    {dataSac(t.prazo)}
                  </Typography>
                  {t.observacao && (
                    <Alert severity="warning">{t.observacao}</Alert>
                  )}
                  <StatusSacChip status={t.atendimento.status} />
                </Stack>
                <Button
                  variant="outlined"
                  onClick={() => abrir(t.atendimento.id)}
                  sx={{
                    color: "#ff5805",
                    borderColor: "#ff5805",
                    fontWeight: 700,
                    textTransform: "none",
                    width: "fit-content",
                    minWidth: 0,
                    px: 1.5,
                    py: 0.5,
                    fontSize: 13,

                    "&:hover": {
                      borderColor: "#e94f00",
                      backgroundColor: "#fff3ee",
                    },
                  }}
                >
                  Abrir ação
                </Button>
              </Stack>
            ))}
          </SecaoSac>
        )}
        {acao && token && (
          <SecaoSac titulo={`Ação corretiva · ${acao.protocolo}`}>
            <FormularioAcaoSac
              acao={acao}
              token={token}
              permitido={true}
              atualizar={atualizar}
              erro={setErro}
              sucesso={setMensagem}
            />
          </SecaoSac>
        )}
        {!!concluidas.length && (
          <SecaoSac titulo="Histórico das minhas tarefas">
            {concluidas.map((t) => (
              <Stack
                key={t.id}
                direction="row"
                sx={{ justifyContent: "space-between" }}
              >
                <Typography>
                  {t.atendimento.protocolo} ·{" "}
                  {t.status === "CANCELADA" ? "Cancelada" : "Concluída"} ·{" "}
                  {dataSac(t.concluidoEm)}
                </Typography>
                <Button disabled={t.status === "CANCELADA"} onClick={() => abrir(t.atendimento.id)}>
                  Consultar
                </Button>
              </Stack>
            ))}
          </SecaoSac>
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
