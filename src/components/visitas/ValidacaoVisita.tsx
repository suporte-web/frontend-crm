"use client";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  camposSac,
  dataSac,
  SecaoSac,
} from "@/components/atendimento-sac/ComponentesSac";
import { type Visita } from "@/types/visitas";
import { acaoVisitaSx, AnexosVisita } from "./ComponentesVisitas";
import type { AcaoVisita } from "./PaginaDetalheVisita";
export function ValidacaoVisita({
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
  const [decisao, setDecisao] = useState(""),
    [observacao, setObservacao] = useState(""),
    [novaData, setNovaData] = useState("");
  return (
    <Stack spacing={3}>
      <SecaoSac titulo="Resumo da visita realizada">
        <Box sx={camposSac}>
          <Typography>
            <strong>Cliente:</strong> {visita.clienteNome}
          </Typography>
          <Typography>
            <strong>Responsável:</strong> {visita.responsavel.name}
          </Typography>
          <Typography>
            <strong>Data prevista:</strong> {dataSac(visita.dataPrevista)}
          </Typography>
          <Typography>
            <strong>Data realizada:</strong> {dataSac(visita.dataRealizada)}
          </Typography>
        </Box>
        {Object.entries({
          relato: "Relato",
          insights: "Insights e oportunidades",
          pontosPositivos: "Pontos positivos",
          pontosAtencao: "Pontos de atenção",
        }).map(([k, nome]) => (
          <Box key={k}>
            <Typography variant="subtitle2">{nome}</Typography>
            <Typography
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {visita[
                k as "relato" | "insights" | "pontosPositivos" | "pontosAtencao"
              ] || "Não informado."}
            </Typography>
          </Box>
        ))}
        <Typography variant="subtitle2">
          Fotos e evidências da realização
        </Typography>
        <AnexosVisita
          visita={visita}
          token={token}
          etapa="REALIZAÇÃO"
          permitido={false}
          atualizar={atualizar}
          erro={erro}
        />
      </SecaoSac>
      <SecaoSac titulo="Validação da gestão">
        {!permitido && (
          <Alert severity="info">
            A validação pode ser executada pela liderança e gestão quando a
            visita estiver aguardando validação.
          </Alert>
        )}
        {permitido && (
          <Box
            component="form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const d = {
                  decisao,
                  ...(observacao.trim()
                    ? { observacao: observacao.trim() }
                    : {}),
                  ...(decisao === "REAGENDAR"
                    ? { novaData: new Date(novaData).toISOString() }
                    : {}),
                };
                await agir("validar", d);
              } catch (e) {
                erro(
                  e instanceof Error
                    ? e.message
                    : "Verifique os campos da validação.",
                );
              }
            }}
          >
            <Stack spacing={2}>
              <TextField
                label="A visita está aprovada?"
                select
                size="small"
                value={decisao}
                onChange={(e) => setDecisao(e.target.value)}
                disabled={ocupado}
                required
              >
                <MenuItem value="">Selecione</MenuItem>
                <MenuItem value="APROVAR">Aprovar</MenuItem>
                <MenuItem value="AJUSTAR">
                  Solicitar ajuste na realização
                </MenuItem>
                <MenuItem value="REAGENDAR">Solicitar reagendamento</MenuItem>
              </TextField>
              <TextField
                label={
                  decisao && decisao !== "APROVAR"
                    ? "Descreva o que precisa ajustar"
                    : "Observação da gestão"
                }
                multiline
                minRows={3}
                size="small"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                required={!!decisao && decisao !== "APROVAR"}
                disabled={ocupado}
                slotProps={{
                  htmlInput: {
                    maxLength: 4000,
                    minLength: decisao === "APROVAR" ? 0 : 3,
                  },
                }}
              />
              {decisao === "REAGENDAR" && (
                <TextField
                  label="Nova data da visita"
                  type="datetime-local"
                  size="small"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  required
                  disabled={ocupado}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
              <Typography variant="subtitle2">
                Evidências da validação
              </Typography>
              <AnexosVisita
                visita={visita}
                token={token}
                etapa="VALIDACAO"
                permitido={!ocupado}
                atualizar={atualizar}
                erro={erro}
              />
              <Button
                type="submit"
                variant="contained"
                size="small"
                sx={{ ...acaoVisitaSx, alignSelf: "flex-start" }}
                disabled={ocupado || !decisao}
              >
                Registrar decisão da gestão
              </Button>
            </Stack>
          </Box>
        )}
        {visita.validacoes.map((v) => (
          <Paper key={v.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {
                {
                  APROVAR: "Aprovada",
                  AJUSTAR: "Ajuste solicitado",
                  REAGENDAR: "Reagendamento solicitado",
                }[v.decisao]
              }
            </Typography>
            <Typography variant="caption">
              {v.gestor?.name} · {dataSac(v.criadoEm)}
            </Typography>
            {v.observacao && (
              <Typography sx={{ whiteSpace: "pre-wrap" }}>
                {v.observacao}
              </Typography>
            )}
          </Paper>
        ))}
      </SecaoSac>
    </Stack>
  );
}
