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
    <Stack spacing={2.5}>
      <Alert severity="info">
        A ação concluída volta ao atendente para avaliação. Anexe as evidências
        antes de concluir.
      </Alert>

      {(acao.motivo || acao.documento) && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
            },
            gap: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: "#f8f9fa",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {acao.motivo && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                }}
              >
                Motivo
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {acao.motivo}
              </Typography>
            </Box>
          )}

          {acao.documento && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                }}
              >
                Documento
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {acao.documento}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: 2,
          alignItems: "start",
          width: "100%",
        }}
      >
        {(
          [
            {
              chave: "oQue",
              label: "O que será feito?",
              multiline: true,
            },
            {
              chave: "executor",
              label: "Quem irá executar?",
            },
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
            {
              chave: "observacoes",
              label: "Observações",
              multiline: true,
            },
            {
              chave: "reporte",
              label: "Conclusão / reporte",
              multiline: true,
            },
          ] as const
        ).map((f) => {
          const campoGrande = [
            "oQue",
            "observacoes",
            "reporte",
          ].includes(f.chave);

          const multiline = "multiline" in f && f.multiline;

          return (
            <TextField
              key={f.chave}
              label={f.label}
              type={"tipo" in f ? f.tipo : "text"}
              multiline={multiline}
              minRows={multiline ? 3 : undefined}
              value={dados[f.chave]}
              disabled={!editavel || ocupado}
              fullWidth
              size="small"
              sx={{
                width: "100%",
                gridColumn: campoGrande ? "1 / -1" : "auto",

                "& .MuiInputBase-root": {
                  minHeight: multiline ? undefined : 40,
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
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                htmlInput: {
                  maxLength:
                    f.chave === "reporte"
                      ? 10000
                      : f.chave === "executor"
                        ? 150
                        : 4000,
                },
              }}
              onChange={(e) =>
                setDados({
                  ...dados,
                  [f.chave]: e.target.value,
                })
              }
            />
          );
        })}
      </Box>

      {editavel && (
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          sx={{
            gap: 1,
            alignItems: {
              xs: "stretch",
              sm: "center",
            },
          }}
        >
          <Button
            variant="contained"
            size="small"
            disabled={ocupado}
            onClick={() => salvar(false)}
            sx={{
              width: {
                xs: "100%",
                sm: "fit-content",
              },
              minWidth: 0,
              px: 2,
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
            {acao.status === "AGUARDANDO_ACAO"
              ? "Iniciar ação"
              : "Salvar plano"}
          </Button>

          <Button
            variant="outlined"
            size="small"
            disabled={ocupado}
            onClick={() => salvar(true)}
            sx={{
              width: {
                xs: "100%",
                sm: "fit-content",
              },
              px: 2,
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
            Concluir ação e enviar para avaliação
          </Button>
        </Stack>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: 520,
        }}
      >
        <ListaAnexosSac
          anexos={acao.anexos.filter(
            (a) => a.etapa === "ACAO_CORRETIVA",
          )}
          token={token}
          id={acao.id}
          erro={erro}
        />
      </Box>

      {permitido && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 520,
          }}
        >
          <UploadAnexosSac
            token={token}
            id={acao.id}
            etapa="ACAO_CORRETIVA"
            concluido={atualizar}
            erro={erro}
          />
        </Box>
      )}
    </Stack>
  );
}
