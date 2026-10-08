"use client";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  camposSac,
  dataSac,
  entradaDataSac,
  SecaoSac,
} from "@/components/atendimento-sac/ComponentesSac";
import { montarRealizacao } from "@/lib/visitas-formularios";
import type { Visita } from "@/types/visitas";
import { acaoVisitaSx, AnexosVisita, SimNaoVisita } from "./ComponentesVisitas";
import type { AcaoVisita } from "./PaginaDetalheVisita";
export function RealizacaoVisita({
  visita,
  token,
  permitido,
  ocupado,
  agir,
  atualizar,
  erro,
}: {
  visita: Visita;
  token: string;
  permitido: boolean;
  ocupado: boolean;
  agir: AcaoVisita;
  atualizar: () => Promise<void>;
  erro: (m: string) => void;
}) {
  const [realizada, setRealizada] = useState("");
  const [dados, setDados] = useState({
    dataRealizada: entradaDataSac(
      visita.dataRealizada || new Date().toISOString(),
    ),
    relato: visita.relato || "",
    insights: visita.insights || "",
    pontosPositivos: visita.pontosPositivos || "",
    pontosAtencao: visita.pontosAtencao || "",
    pessoaAtendeu: visita.pessoaAtendeu || "",
    contatoPessoaAtendeu: visita.contatoPessoaAtendeu || "",
    emailPessoaAtendeu: visita.emailPessoaAtendeu || "",
    teveCusto: visita.teveCusto == null ? "" : String(visita.teveCusto),
    custo: visita.custo || "",
  });
  const [reagendar, setReagendar] = useState({
    motivo: "",
    novaData: "",
    observacoes: "",
  });
  const campo = (k: keyof typeof dados, v: string) =>
    setDados((d) => ({ ...d, [k]: v }));
  const bloqueado = !permitido || ocupado;
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (realizada === "false")
        await agir("reagendar", {
          motivo: reagendar.motivo.trim(),
          novaData: new Date(reagendar.novaData).toISOString(),
          ...(reagendar.observacoes.trim()
            ? { observacoes: reagendar.observacoes.trim() }
            : {}),
        });
      else if (realizada === "true")
        await agir("realizar", montarRealizacao(dados));
      else erro("Informe se a visita foi realizada.");
    } catch (e) {
      erro(
        e instanceof Error ? e.message : "Verifique os campos da realização.",
      );
    }
  }
  return (
    <Stack spacing={3}>
      <SecaoSac titulo="Realização / fechamento da visita">
        {!permitido && (
          <Alert severity="info">
            {visita.status === "AGENDADA"
              ? "Clique em Iniciar realização para registrar esta etapa."
              : "Esta etapa está disponível para leitura no status atual."}
          </Alert>
        )}
        <Box component="form" onSubmit={salvar}>
          <Stack spacing={2}>
            <SimNaoVisita
              label="Visita realizada na data proposta?"
              value={realizada}
              onChange={setRealizada}
              disabled={bloqueado}
            />
            {realizada === "false" && (
              <>
                <TextField
                  label="Motivo da não realização"
                  size="small"
                  multiline
                  minRows={3}
                  required
                  disabled={bloqueado}
                  value={reagendar.motivo}
                  onChange={(e) =>
                    setReagendar((d) => ({ ...d, motivo: e.target.value }))
                  }
                  slotProps={{ htmlInput: { minLength: 3, maxLength: 4000 } }}
                />
                <TextField
                  label="Nova data proposta"
                  type="datetime-local"
                  size="small"
                  required
                  disabled={bloqueado}
                  value={reagendar.novaData}
                  onChange={(e) =>
                    setReagendar((d) => ({ ...d, novaData: e.target.value }))
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Observações"
                  size="small"
                  multiline
                  minRows={3}
                  disabled={bloqueado}
                  value={reagendar.observacoes}
                  onChange={(e) =>
                    setReagendar((d) => ({ ...d, observacoes: e.target.value }))
                  }
                  slotProps={{ htmlInput: { maxLength: 4000 } }}
                />
              </>
            )}
            {realizada === "true" && (
              <>
                <TextField
                  label="Data realizada"
                  type="datetime-local"
                  size="small"
                  required
                  disabled={bloqueado}
                  value={dados.dataRealizada}
                  onChange={(e) => campo("dataRealizada", e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                {(
                  [
                    "relato",
                    "insights",
                    "pontosPositivos",
                    "pontosAtencao",
                  ] as const
                ).map((k) => (
                  <TextField
                    key={k}
                    label={
                      {
                        relato: "Relato da visita",
                        insights: "Principais insights e oportunidades",
                        pontosPositivos: "Pontos positivos",
                        pontosAtencao: "Pontos de atenção",
                      }[k]
                    }
                    multiline
                    minRows={3}
                    size="small"
                    required={k === "relato"}
                    disabled={bloqueado}
                    value={dados[k]}
                    onChange={(e) => campo(k, e.target.value)}
                    slotProps={{ htmlInput: { maxLength: 10000 } }}
                  />
                ))}
                <Box sx={camposSac}>
                  <TextField
                    label="Nome da pessoa que atendeu"
                    size="small"
                    required
                    disabled={bloqueado}
                    value={dados.pessoaAtendeu}
                    onChange={(e) => campo("pessoaAtendeu", e.target.value)}
                    slotProps={{ htmlInput: { maxLength: 150 } }}
                  />
                  <TextField
                    label="Contato"
                    size="small"
                    disabled={bloqueado}
                    value={dados.contatoPessoaAtendeu}
                    onChange={(e) =>
                      campo("contatoPessoaAtendeu", e.target.value)
                    }
                    slotProps={{ htmlInput: { maxLength: 40 } }}
                  />
                  <TextField
                    label="E-mail"
                    type="email"
                    size="small"
                    disabled={bloqueado}
                    value={dados.emailPessoaAtendeu}
                    onChange={(e) =>
                      campo("emailPessoaAtendeu", e.target.value)
                    }
                  />
                  <SimNaoVisita
                    label="Teve custo de visita?"
                    value={dados.teveCusto}
                    onChange={(v) => campo("teveCusto", v)}
                    disabled={bloqueado}
                  />
                  {dados.teveCusto === "true" && (
                    <TextField
                      label="Custo da visita (R$)"
                      size="small"
                      required
                      disabled={bloqueado}
                      value={dados.custo}
                      onChange={(e) => campo("custo", e.target.value)}
                      slotProps={{ htmlInput: { inputMode: "decimal" } }}
                    />
                  )}
                </Box>
                <Typography variant="subtitle2">Fotos e evidências</Typography>
                <AnexosVisita
                  visita={visita}
                  token={token}
                  etapa="REALIZACAO"
                  permitido={permitido && !ocupado}
                  atualizar={atualizar}
                  erro={erro}
                />
                <Typography variant="caption" color="text.secondary">
                  Envie os anexos antes de encaminhar a visita para validação.
                </Typography>
              </>
            )}
            {permitido && realizada && (
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={ocupado}
                sx={{ ...acaoVisitaSx, alignSelf: "flex-start" }}
              >
                {realizada === "false"
                  ? "Salvar reagendamento"
                  : "Encaminhar para validação"}
              </Button>
            )}
          </Stack>
        </Box>
      </SecaoSac>
      {!!visita.realizacoes.length && (
        <SecaoSac titulo="Realizações registradas">
          {visita.realizacoes.map((r, i) => (
            <Paper key={r.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>
                Registro {i + 1} · {dataSac(r.dataRealizada)}
              </Typography>
              <Typography variant="caption">
                {r.usuario?.name} · registrado em {dataSac(r.criadoEm)}
              </Typography>
              {Object.entries({
                relato: "Relato",
                insights: "Insights e oportunidades",
                pontosPositivos: "Pontos positivos",
                pontosAtencao: "Pontos de atenção",
                pessoaAtendeu: "Pessoa que atendeu",
                contatoPessoaAtendeu: "Contato",
                emailPessoaAtendeu: "E-mail",
              }).map(([k, nome]) =>
                r.dados[k] ? (
                  <Box key={k} sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">{nome}</Typography>
                    <Typography
                      sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                    >
                      {String(r.dados[k])}
                    </Typography>
                  </Box>
                ) : null,
              )}
              <Typography sx={{ mt: 1 }}>
                Custo:{" "}
                {r.dados.teveCusto
                  ? Number(r.dados.custo).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "Não houve custo"}
              </Typography>
            </Paper>
          ))}
        </SecaoSac>
      )}
    </Stack>
  );
}
