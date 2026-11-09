"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "@/context/auth-context";
import { consultarMotivosPerda } from "@/services/motivos-perda.service";
import {
  rotuloPerda,
  type MotivoPerda,
  type PerdaOportunidade,
} from "@/lib/perda-oportunidade";

export function CamposPerdaOportunidade({
  codigo,
  notes,
  onChange,
  disabled = false,
}: {
  codigo: string;
  notes: string;
  onChange: (codigo: string, notes: string) => void;
  disabled?: boolean;
}) {
  const { token } = useAuth();
  const [catalog, setCatalog] = useState<MotivoPerda[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setCatalog([]);
    setError("");
    if (token)
      consultarMotivosPerda(token)
        .then((value) => {
          if (active) setCatalog(value);
        })
        .catch((e: unknown) => {
          if (active)
            setError(
              e instanceof Error
                ? e.message
                : "Não foi possível carregar os motivos. Tente novamente.",
            );
        });
    return () => {
      active = false;
    };
  }, [token]);
  const observacaoRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const outroMotivo = catalog.find((item) => item.codigo === "OUTRO");
  const selected = catalog.find((item) => item.codigo === codigo);
  return (
    <Stack
      spacing={1.5}
      sx={{
        minWidth: 0,
        "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "#ff5805",
        },
        "& .MuiInputLabel-root.Mui-focused": { color: "#ff5805" },
      }}
    >
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        select
        required
        fullWidth
        size="small"
        label="Motivo da perda"
        value={selected ? codigo : ""}
        onChange={(event) => onChange(event.target.value, notes)}
        disabled={disabled}
        helperText={
          catalog.length
            ? "Selecione um motivo ou informe outro que não esteja na lista."
            : error
              ? "Não é possível salvar a perda sem carregar o catálogo."
              : "Carregando motivos..."
        }
      >
        <MenuItem value="" disabled>
          Selecione um motivo
        </MenuItem>
        {catalog.map((reason) => (
          <MenuItem
            key={reason.codigo}
            value={reason.codigo}
            sx={{ whiteSpace: "normal" }}
          >
            {reason.codigo === "OUTRO" ? "Outro motivo (informar)" : reason.rotulo}
          </MenuItem>
        ))}
      </TextField>
      {outroMotivo && codigo !== "OUTRO" && <Button
        type="button"
        size="small"
        variant="text"
        disabled={disabled}
        onClick={() => { onChange("OUTRO", notes); observacaoRef.current?.focus(); }}
        sx={{ alignSelf: "flex-start", color: "#c94600", textTransform: "none", fontSize: 12.5, px: 0.5, "&:hover": { bgcolor: "#fff4eb" } }}
      >Informar outro motivo</Button>}
      <TextField
        fullWidth
        size="small"
        multiline
        minRows={3}
        label={codigo === "OUTRO" ? "Descreva o motivo da perda" : "Observações"}
        inputRef={observacaoRef}
        placeholder={codigo === "OUTRO" ? "Digite o motivo que não encontrou na lista" : undefined}
        value={notes}
        onChange={(event) => onChange(codigo, event.target.value)}
        required={selected?.exigeObservacao ?? false}
        disabled={disabled}
        slotProps={{ htmlInput: { maxLength: 2000 } }}
        helperText={
          selected?.exigeObservacao
            ? codigo === "LIMITACAO_OPERACIONAL"
              ? "Descreva a capacidade, veículos, prazo, armazenagem ou outra limitação identificada."
              : "Informe o motivo não listado. Obrigatório, até 2000 caracteres."
            : "Opcional. Máximo de 2000 caracteres."
        }
      />
    </Stack>
  );
}

export function DetalhesPerdaOportunidade({
  opportunity,
}: {
  opportunity: PerdaOportunidade & { status: string };
}) {
  if (opportunity.status !== "LOST") return null;
  return (
    <Stack spacing={0.75} sx={{ mt: 1.5, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        Motivo da perda: {rotuloPerda(opportunity)}
      </Typography>
      {opportunity.observacaoPerda && opportunity.motivoPerda !== "OUTRO" && (
        <Typography
          sx={{
            fontSize: 13,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          Observações: {opportunity.observacaoPerda}
        </Typography>
      )}
      {!opportunity.motivoPerda && opportunity.lostReason && (
        <Typography
          sx={{
            fontSize: 13,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          Registro anterior: {opportunity.lostReason}
        </Typography>
      )}
    </Stack>
  );
}
