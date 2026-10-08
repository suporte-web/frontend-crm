"use client";
import { Chip, MenuItem, Stack, TextField } from "@mui/material";
import { UploadAnexos } from "@/components/attachments/UploadAnexos";
import { ListaAnexosSac } from "@/components/atendimento-sac/ComponentesSac";
import { baixarAnexoVisita, enviarAnexoVisita } from "@/services/visitas.api";
import {
  rotulosStatusVisita,
  type EtapaVisita,
  type StatusVisita,
  type Visita,
} from "@/types/visitas";
export const acaoVisitaSx = {
  bgcolor: "#ff5805",
  "&:hover": { bgcolor: "#e94f00" },
  textTransform: "none",
  borderRadius: 2,
};
export function StatusVisitaChip({ status }: { status: StatusVisita }) {
  const cores: Record<StatusVisita, string> = {
    AGENDADA: "#607d8b",
    AGUARDANDO_REALIZACAO: "#1976d2",
    REAGENDAMENTO: "#f57c00",
    AGUARDANDO_VALIDACAO: "#7b1fa2",
    POS_VISITA: "#0288d1",
    ATENDIMENTO_SAC: "#d32f2f",
    CONCLUIDA: "#2e7d32",
  };
  return (
    <Chip
      size="small"
      label={rotulosStatusVisita[status]}
      sx={{
        color: "#fff",
        bgcolor: cores[status],
        fontWeight: 700,
        alignSelf: "flex-start",
      }}
    />
  );
}
export function SimNaoVisita({
  label,
  value,
  onChange,
  disabled = false,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <TextField
      size="small"
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
    >
      <MenuItem value="">Selecione</MenuItem>
      <MenuItem value="true">Sim</MenuItem>
      <MenuItem value="false">Não</MenuItem>
    </TextField>
  );
}
export function AnexosVisita({
  visita,
  token,
  etapa,
  permitido,
  atualizar,
  erro,
}: {
  visita: Visita;
  token: string;
  etapa: EtapaVisita;
  permitido: boolean;
  atualizar: () => Promise<void>;
  erro: (v: string) => void;
}) {
  return (
    <Stack spacing={2}>
      <ListaAnexosSac
        anexos={visita.anexos.filter((a) => a.etapa === etapa)}
        token={token}
        id={visita.id}
        erro={erro}
        baixar={(anexo) =>
          baixarAnexoVisita(token, visita.id, anexo.id, anexo.nome)
        }
      />
      {permitido && (
        <UploadAnexos
          enviarArquivo={(arquivo, comentario) =>
            enviarAnexoVisita(token, visita.id, arquivo, etapa, comentario)
          }
          concluido={atualizar}
          erro={erro}
        />
      )}
    </Stack>
  );
}
