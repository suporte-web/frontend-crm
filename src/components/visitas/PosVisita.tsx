"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  camposSac,
  dataSac,
  SecaoSac,
} from "@/components/atendimento-sac/ComponentesSac";
import { montarPosVisita } from "@/lib/visitas-formularios";
import { classificacoesVisita, type Visita } from "@/types/visitas";
import { acaoVisitaSx, AnexosVisita, SimNaoVisita } from "./ComponentesVisitas";
import type { AcaoVisita } from "./PaginaDetalheVisita";
const simNao = (v?: boolean | null) => (v == null ? "" : String(v));
export function PosVisita({
  visita,
  token,
  permitido,
  podeExecutar,
  ocupado,
  agir,
  atualizar,
  erro,
}: {
  visita: Visita;
  token: string;
  permitido: boolean;
  podeExecutar: boolean;
  ocupado: boolean;
  agir: AcaoVisita;
  atualizar: () => Promise<void>;
  erro: (m: string) => void;
}) {
  const [dados, setDados] = useState({
    novaDataAceita: simNao(visita.novaDataAceita),
    ajustesNecessarios: "",
    atingiuObjetivo: simNao(visita.atingiuObjetivo),
    sentimentoCliente: visita.sentimentoCliente || "",
    possuiMelhoria: simNao(visita.possuiMelhoria),
    melhoriaIdentificada: visita.melhoriaIdentificada || "",
    classificacao: visita.classificacao || "",
    gerarSac: visita.sacId
      ? "true"
      : visita.avaliacaoRegistradaEm
        ? "false"
        : "",
    tipoReclamacao: "",
    relatoSac: visita.pontosAtencao || "",
    email: visita.emailPessoaAtendeu || "",
    telefone: visita.contatoPessoaAtendeu || "",
    cidade: "",
    estado: "",
  });
  const campo = (k: keyof typeof dados, v: string) =>
    setDados((d) => ({ ...d, [k]: v }));
  const bloqueado = !permitido || ocupado;
  const validacao = visita.validacoes[visita.validacoes.length - 1];
  const novaDataRecusada =
    visita.reagendamentos.length > 0 && dados.novaDataAceita === "false";
  return (
    <SecaoSac titulo="Pós-visita / avaliação final">
      <Box sx={camposSac}>
        <TextField
          label="Aprovação do gestor"
          size="small"
          value={
            validacao?.decisao === "APROVAR"
              ? "Aprovada por " + (validacao.gestor?.name || "Gestão")
              : "Aguardando aprovação"
          }
          slotProps={{ input: { readOnly: true } }}
        />
        <TextField
          label="Data da decisão"
          size="small"
          value={dataSac(validacao?.criadoEm)}
          slotProps={{ input: { readOnly: true } }}
        />
      </Box>
      {validacao?.observacao && (
        <TextField
          label="Observação / ajustes da gestão"
          multiline
          minRows={2}
          size="small"
          value={validacao.observacao}
          slotProps={{ input: { readOnly: true } }}
        />
      )}
      {!permitido && (
        <Alert severity="info">
          {visita.status === "CONCLUIDA"
            ? "Visita concluída. A avaliação final permanece disponível para consulta."
            : visita.status === "ATENDIMENTO_SAC"
              ? "A avaliação gerou um atendimento SAC. Acompanhe a tratativa pelo atendimento relacionado."
              : "A avaliação final fica disponível após a aprovação da gestão."}
        </Alert>
      )}
      <Box
        component="form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await agir(
              "pos-visita",
              montarPosVisita(dados, visita.reagendamentos.length > 0),
            );
          } catch (e) {
            erro(
              e instanceof Error
                ? e.message
                : "Verifique os campos da avaliação.",
            );
          }
        }}
      >
        <Stack spacing={2}>
          {visita.reagendamentos.length > 0 && (
            <SimNaoVisita
              label="Nova data proposta aceita?"
              value={dados.novaDataAceita}
              onChange={(v) => campo("novaDataAceita", v)}
              disabled={bloqueado}
            />
          )}
          {novaDataRecusada && (
            <>
              <TextField
                label="Descreva o que precisa ajustar"
                multiline
                minRows={3}
                size="small"
                value={dados.ajustesNecessarios}
                onChange={(e) => campo("ajustesNecessarios", e.target.value)}
                disabled={bloqueado}
                required
                slotProps={{ htmlInput: { maxLength: 4000 } }}
              />
              <Alert severity="warning">
                A avaliação será devolvida à gestão para ajustar ou reagendar a
                visita.
              </Alert>
            </>
          )}
          <SimNaoVisita
            label="Atingiu o objetivo?"
            value={dados.atingiuObjetivo}
            onChange={(v) => campo("atingiuObjetivo", v)}
            disabled={bloqueado}
          />
          <TextField
            label="Descreva o sentimento do cliente em relação à visita"
            multiline
            minRows={3}
            size="small"
            value={dados.sentimentoCliente}
            onChange={(e) => campo("sentimentoCliente", e.target.value)}
            disabled={bloqueado}
            required
            slotProps={{ htmlInput: { maxLength: 10000 } }}
          />
          <SimNaoVisita
            label="Oportunidades de melhoria identificadas?"
            value={dados.possuiMelhoria}
            onChange={(v) => campo("possuiMelhoria", v)}
            disabled={bloqueado}
          />
          {dados.possuiMelhoria === "true" && (
            <TextField
              label="Informe a melhoria identificada"
              multiline
              minRows={3}
              size="small"
              value={dados.melhoriaIdentificada}
              onChange={(e) => campo("melhoriaIdentificada", e.target.value)}
              disabled={bloqueado}
              required
              slotProps={{ htmlInput: { maxLength: 10000 } }}
            />
          )}
          <TextField
            label="Classificação"
            select
            size="small"
            value={dados.classificacao}
            onChange={(e) => campo("classificacao", e.target.value)}
            disabled={bloqueado}
            required
          >
            <MenuItem value="">Selecione</MenuItem>
            {Object.entries(classificacoesVisita).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </TextField>
          {!novaDataRecusada && (
            <SimNaoVisita
              label="Gerar atendimento SAC?"
              value={dados.gerarSac}
              onChange={(v) => campo("gerarSac", v)}
              disabled={bloqueado}
            />
          )}
          {!novaDataRecusada && dados.gerarSac === "true" && !visita.sacId && (
            <Stack spacing={2}>
              <Alert severity="info">
                Será criado um atendimento no SAC existente, vinculado a esta
                visita e atribuído ao seu responsável.
              </Alert>
              <TextField
                label="Tipo da reclamação"
                size="small"
                value={dados.tipoReclamacao}
                onChange={(e) => campo("tipoReclamacao", e.target.value)}
                disabled={bloqueado}
                required
                slotProps={{ htmlInput: { maxLength: 150 } }}
              />
              <TextField
                label="Relato para o atendimento SAC"
                size="small"
                multiline
                minRows={3}
                value={dados.relatoSac}
                onChange={(e) => campo("relatoSac", e.target.value)}
                disabled={bloqueado}
                required
                slotProps={{ htmlInput: { maxLength: 10000 } }}
              />
              <Box sx={camposSac}>
                <TextField
                  label="Telefone"
                  size="small"
                  value={dados.telefone}
                  onChange={(e) => campo("telefone", e.target.value)}
                  disabled={bloqueado}
                />
                <TextField
                  label="E-mail"
                  type="email"
                  size="small"
                  value={dados.email}
                  onChange={(e) => campo("email", e.target.value)}
                  disabled={bloqueado}
                />
                <TextField
                  label="Cidade"
                  size="small"
                  value={dados.cidade}
                  onChange={(e) => campo("cidade", e.target.value)}
                  disabled={bloqueado}
                />
                <TextField
                  label="Estado (UF)"
                  size="small"
                  value={dados.estado}
                  onChange={(e) =>
                    campo("estado", e.target.value.toUpperCase())
                  }
                  disabled={bloqueado}
                  slotProps={{ htmlInput: { maxLength: 2 } }}
                />
              </Box>
            </Stack>
          )}
          <Typography variant="subtitle2">Evidências da avaliação</Typography>
          <AnexosVisita
            visita={visita}
            token={token}
            etapa="POS_VISITA"
            permitido={permitido && !ocupado}
            atualizar={atualizar}
            erro={erro}
          />
          {permitido && (
            <Button
              type="submit"
              variant="contained"
              size="small"
              sx={{ ...acaoVisitaSx, alignSelf: "flex-start" }}
              disabled={ocupado}
            >
              {novaDataRecusada
                ? "Devolver à gestão"
                : dados.gerarSac === "true"
                  ? "Salvar avaliação e gerar SAC"
                  : "Salvar avaliação e concluir visita"}
            </Button>
          )}
        </Stack>
      </Box>
      {visita.sac && (
        <Stack spacing={2}>
          <Button
            component={Link}
            href={"/atendimento/" + visita.sac.id}
            variant="outlined"
            size="small"
            sx={{ alignSelf: "flex-start" }}
          >
            Abrir atendimento SAC · {visita.sac.protocolo}
          </Button>
          {visita.status === "ATENDIMENTO_SAC" && podeExecutar && (
            <Button
              variant="contained"
              size="small"
              sx={{ ...acaoVisitaSx, alignSelf: "flex-start" }}
              disabled={ocupado || visita.sac.status !== "CONCLUIDO"}
              onClick={() => agir("concluir")}
            >
              Concluir visita após o SAC
            </Button>
          )}
          {visita.status === "ATENDIMENTO_SAC" &&
            visita.sac.status !== "CONCLUIDO" && (
              <Typography variant="caption" color="text.secondary">
                A visita poderá ser concluída quando o atendimento SAC estiver
                concluído.
              </Typography>
            )}
        </Stack>
      )}
    </SecaoSac>
  );
}
