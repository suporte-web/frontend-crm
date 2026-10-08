"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  camposSac,
  entradaDataSac,
} from "@/components/atendimento-sac/ComponentesSac";
import { requisitarVisitas } from "@/services/visitas.api";
import {
  type OpcoesVisitas,
  type ParticipanteVisita,
  type PessoaVisita,
  type Visita,
} from "@/types/visitas";
import { montarClienteVisita } from "@/lib/visitas-formularios";
import { acaoVisitaSx, SimNaoVisita } from "./ComponentesVisitas";
export type DadosFormularioVisita = {
  clienteNome: string;
  cnpj: string;
  localVisita: string;
  dataPrevista?: string;
  responsavelId: string;
  tipoVisita: string;
  observacoes?: string;
  participantes?: ParticipanteVisita[];
};
export function FormularioVisita({
  token,
  visita,
  permitido = true,
  ocupado,
  salvar,
}: {
  token: string;
  visita?: Visita;
  permitido?: boolean;
  ocupado: boolean;
  salvar: (d: DadosFormularioVisita) => Promise<void>;
}) {
  const [opcoes, setOpcoes] = useState<OpcoesVisitas>({
    usuarios: [],
    responsaveis: [],
  });
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState({
    clienteNome: visita?.clienteNome || "",
    cnpj: visita?.cnpj || "",
    localVisita: visita?.localVisita || "",
    dataPrevista: entradaDataSac(visita?.dataPrevista),
    responsavelId: visita?.responsavelId || "",
    tipoVisita: visita?.tipoVisita || "",
    observacoes: visita?.observacoes || "",
  });
  const [incluir, setIncluir] = useState("false");
  const [internos, setInternos] = useState<PessoaVisita[]>([]);
  const [externos, setExternos] = useState<ParticipanteVisita[]>([]);
  const [externo, setExterno] = useState({ nome: "", email: "", telefone: "" });
  useEffect(() => {
    if (!permitido) return;
    let ativo = true;
    const timer = setTimeout(() => {
      requisitarVisitas<OpcoesVisitas>(
        token,
        "/opcoes",
      )
        .then((d) => {
          if (ativo) setOpcoes(d);
        })
        .catch((e) => {
          if (ativo) setErro(e.message);
        });
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [token, permitido]);
  const campo = (k: keyof typeof dados, v: string) =>
    setDados((d) => ({ ...d, [k]: v }));
  const bloqueado = ocupado || !permitido;
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const participantes =
      incluir === "true"
        ? [
          ...internos.map((u) => ({
            nome: u.name,
            email: u.email,
            usuarioId: u.id,
          })),
          ...externos,
        ]
        : [];
    if (incluir === "true" && !participantes.length) {
      setErro("Inclua pelo menos um participante.");
      return;
    }
    if (incluir === "true" && externo.nome.trim()) {
      setErro("Adicione o participante externo antes de salvar.");
      return;
    }
    try {
      await salvar({
        ...montarClienteVisita(dados),
        localVisita: dados.localVisita.trim(),
        responsavelId: dados.responsavelId,
        tipoVisita: dados.tipoVisita.trim(),
        ...(visita
          ? {}
          : { dataPrevista: new Date(dados.dataPrevista).toISOString() }),
        observacoes: dados.observacoes.trim(),
        ...(participantes.length ? { participantes } : {}),
      });
      setIncluir("false");
      setInternos([]);
      setExternos([]);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível salvar a visita.",
      );
    }
  }
  return (
    <Box component="form" onSubmit={enviar}>
      <Stack spacing={2}>
        {erro && <Alert severity="error">{erro}</Alert>}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
            alignItems: "start",

            "& .MuiTextField-root": {
              width: "100%",
              minWidth: 0,
            },

            "& .MuiInputBase-root": {
              minHeight: 40,
              borderRadius: "8px",
              fontSize: "0.875rem",
            },

            "& .MuiInputBase-input": {
              fontSize: "0.875rem",
            },

            "& .MuiInputLabel-root": {
              fontSize: "0.875rem",
            },
          }}
        >
          <TextField
            label="CNPJ"
            size="small"
            disabled={bloqueado}
            value={dados.cnpj}
            onChange={(e) => campo("cnpj", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 40 } }}
          />
          <TextField
            label="Local da visita"
            size="small"
            required
            disabled={bloqueado}
            value={dados.localVisita}
            onChange={(e) => campo("localVisita", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
          <TextField
            label="Data prevista"
            type="datetime-local"
            size="small"
            required
            disabled={bloqueado || !!visita}
            value={dados.dataPrevista}
            onChange={(e) => campo("dataPrevista", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText={
              visita
                ? "Altere a data pela aba Realização para preservar o histórico."
                : ""
            }
          />
          <TextField
            label="Atendente responsável"
            select
            size="small"
            required
            fullWidth
            disabled={bloqueado}
            value={dados.responsavelId}
            onChange={(e) => campo("responsavelId", e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 68,
                borderRadius: "8px",
              },
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                height: "100% !important",
                boxSizing: "border-box",
              },
            }}
          >
            <MenuItem value="">Selecione</MenuItem>

            {opcoes.responsaveis.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}

            {!opcoes.responsaveis.some(
              (p) => p.id === visita?.responsavelId
            ) &&
              visita && (
                <MenuItem value={visita.responsavelId}>
                  {visita.responsavel.name}
                </MenuItem>
              )}
          </TextField>
          <TextField
            label="Tipo de visita"
            size="small"
            required
            fullWidth
            disabled={bloqueado}
            value={dados.tipoVisita}
            onChange={(e) => campo("tipoVisita", e.target.value)}
            slotProps={{
              htmlInput: { maxLength: 150 },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 68,
                borderRadius: "8px",
              },
              "& .MuiOutlinedInput-input": {
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                fontSize: "0.875rem",
              },
            }}
          />
          <Box
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 68,
                borderRadius: "8px",
              },
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                height: "100% !important",
                boxSizing: "border-box",
              },
            }}
          >
            <SimNaoVisita
              label={
                visita ? "Adicionar participantes?" : "Incluir participantes?"
              }
              value={incluir}
              disabled={bloqueado}
              onChange={setIncluir}
            />
          </Box>
        </Box>
        {incluir === "true" && (
          <Stack spacing={2}>
            <Autocomplete
              multiple
              options={opcoes.usuarios}
              value={internos}
              disabled={bloqueado}
              getOptionLabel={(p) => p.name + (p.email ? " · " + p.email : "")}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_, p) => setInternos(p)}
              renderInput={(p) => (
                <TextField
                  {...p}
                  size="small"
                  label="Participantes cadastrados no CRM"
                />
              )}
              noOptionsText="Nenhum usuário encontrado"
            />
            <Typography variant="subtitle2">Participante externo</Typography>
            <Box
              sx={{
                ...camposSac,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(3,minmax(0,1fr))",
                },
              }}
            >
              {(["nome", "email", "telefone"] as const).map((k) => (
                <TextField
                  key={k}
                  label={
                    { nome: "Nome", email: "E-mail", telefone: "Telefone" }[k]
                  }
                  type={k === "email" ? "email" : "text"}
                  size="small"
                  disabled={bloqueado}
                  value={externo[k]}
                  onChange={(e) =>
                    setExterno((d) => ({ ...d, [k]: e.target.value }))
                  }
                />
              ))}
            </Box>
            <Button
              size="small"
              variant="outlined"
              disabled={bloqueado || externo.nome.trim().length < 2}
              onClick={() => {
                if (
                  externo.email &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(externo.email)
                ) {
                  setErro("Informe um e-mail válido.");
                  return;
                }
                setExternos((d) => [
                  ...d,
                  {
                    nome: externo.nome.trim(),
                    ...(externo.email.trim()
                      ? { email: externo.email.trim() }
                      : {}),
                    ...(externo.telefone.trim()
                      ? { telefone: externo.telefone.trim() }
                      : {}),
                  },
                ]);
                setExterno({ nome: "", email: "", telefone: "" });
              }}
              sx={{ alignSelf: "flex-start" }}
            >
              Adicionar participante externo
            </Button>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {externos.map((p, i) => (
                <Chip
                  key={i}
                  label={p.nome + (p.email ? " · " + p.email : "")}
                  onDelete={
                    bloqueado
                      ? undefined
                      : () => setExternos((d) => d.filter((_, j) => i !== j))
                  }
                />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Os participantes serão registrados. A comunicação fica pendente
              até ser enviada por uma integração.
            </Typography>
          </Stack>
        )}
        <TextField
          label="Observações"
          multiline
          minRows={3}
          size="small"
          disabled={bloqueado}
          value={dados.observacoes}
          onChange={(e) => campo("observacoes", e.target.value)}
          slotProps={{ htmlInput: { maxLength: 10000 } }}
        />
        {permitido && (
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={ocupado}
            sx={{
              ...acaoVisitaSx,
              alignSelf: "flex-start",
              height: 44,
              minWidth: 140,
              px: 3,
              fontSize: "0.875rem",
              fontWeight: 600,
              borderRadius: "8px",
            }}
          >
            {ocupado
              ? "Salvando…"
              : visita
                ? "Salvar dados da visita"
                : "Criar visita"}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
