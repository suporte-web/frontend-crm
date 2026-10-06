"use client";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { requisitarSac } from "@/services/atendimento-sac.api";
import type { AcaoSac } from "@/types/atendimento-sac.types";
import {
  camposSac,
  entradaDataSac,
  ListaAnexosSac,
  UploadAnexosSac,
} from "./ComponentesSac";
export function FormularioAcaoSac({
  acao,
  token,
  permitido,
  atualizar,
  erro,
  sucesso,
}: {
  acao: AcaoSac;
  token: string;
  permitido: boolean;
  atualizar: () => Promise<void>;
  erro: (m: string) => void;
  sucesso: (m: string) => void;
}) {
  const [dados, setDados] = useState({
    oQue: "",
    executor: "",
    prazo: "",
    dataExecucao: "",
    observacoes: "",
    reporte: "",
  });
  const [ocupado, setOcupado] = useState(false);
  const dadosCarregados = useRef("");
  useEffect(() => {
    const chave = JSON.stringify([acao.id, acao.planoAcao, acao.prazo]);
    if (dadosCarregados.current === chave) return;
    dadosCarregados.current = chave;
    const p = acao.planoAcao;
    setDados({
      oQue: p?.oQue || "",
      executor: p?.executor || "",
      prazo: entradaDataSac(p?.prazo || acao.prazo),
      dataExecucao: entradaDataSac(p?.dataExecucao),
      observacoes: p?.observacoes || "",
      reporte: p?.reporte || "",
    });
  }, [acao]);
  const editavel =
    permitido && ["AGUARDANDO_ACAO", "EM_TRATATIVA"].includes(acao.status);
  async function salvar(concluir: boolean) {
    if (ocupado) return;
    setOcupado(true);
    try {
      if (!dados.oQue.trim() || !dados.executor.trim() || !dados.prazo)
        throw new Error("Preencha o plano, o executor e o prazo.");
      if (concluir && (!dados.dataExecucao || !dados.reporte.trim()))
        throw new Error("Informe a execução e o reporte antes de concluir.");
      await requisitarSac(
        token,
        `/${acao.id}/acao${concluir ? "/concluir" : acao.status === "AGUARDANDO_ACAO" ? "/iniciar" : ""}`,
        concluir || acao.status === "AGUARDANDO_ACAO" ? "POST" : "PUT",
        {
          ...dados,
          prazo: new Date(dados.prazo).toISOString(),
          dataExecucao: dados.dataExecucao
            ? new Date(dados.dataExecucao).toISOString()
            : undefined,
        },
      );
      await atualizar();
      sucesso(
        concluir ? "Ação enviada para avaliação." : "Plano da ação salvo.",
      );
    } catch (e) {
      erro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Alert severity="info">
        A ação concluída volta ao atendente para avaliação. Anexe as evidências
        antes de concluir.
      </Alert>
      {acao.motivo && (
        <Typography>
          <b>Motivo:</b> {acao.motivo}
        </Typography>
      )}
      {acao.documento && (
        <Typography>
          <b>Documento:</b> {acao.documento}
        </Typography>
      )}
      <Box sx={camposSac}>
        {(
          [
            { chave: "oQue", label: "O que será feito?", multiline: true },
            { chave: "executor", label: "Quem irá executar?" },
            {
              chave: "prazo",
              label: "Prazo para solução",
              tipo: "datetime-local",
            },
            {
              chave: "dataExecucao",
              label: "Data da execução",
              tipo: "datetime-local",
            },
            { chave: "observacoes", label: "Observações", multiline: true },
            { chave: "reporte", label: "Conclusão / reporte", multiline: true },
          ] as const
        ).map((f) => (
          <TextField
            key={f.chave}
            label={f.label}
            type={"tipo" in f ? f.tipo : "text"}
            multiline={"multiline" in f}
            minRows={"multiline" in f ? 3 : undefined}
            value={dados[f.chave]}
            disabled={!editavel || ocupado}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: {
                maxLength:
                  f.chave === "reporte"
                    ? 10000
                    : f.chave === "executor"
                      ? 150
                      : 4000,
              },
            }}
            onChange={(e) => setDados({ ...dados, [f.chave]: e.target.value })}
          />
        ))}
      </Box>
      {editavel && (
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1 }}>
          <Button
            variant="contained"
            disabled={ocupado}
            onClick={() => salvar(false)}
          >
            {acao.status === "AGUARDANDO_ACAO"
              ? "Iniciar ação"
              : "Salvar plano"}
          </Button>
          <Button
            variant="outlined"
            disabled={ocupado}
            onClick={() => salvar(true)}
          >
            Concluir ação e enviar para avaliação
          </Button>
        </Stack>
      )}
      <ListaAnexosSac
        anexos={acao.anexos.filter((a) => a.etapa === "ACAO_CORRETIVA")}
        token={token}
        id={acao.id}
        erro={erro}
      />
      {permitido && (
        <UploadAnexosSac
          token={token}
          id={acao.id}
          etapa="ACAO_CORRETIVA"
          concluido={atualizar}
          erro={erro}
        />
      )}
    </Stack>
  );
}
