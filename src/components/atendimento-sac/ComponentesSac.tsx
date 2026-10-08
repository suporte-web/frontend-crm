"use client";
import { UploadAnexos } from "@/components/attachments/UploadAnexos";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { enviarAnexoSac, baixarAnexoSac } from "@/services/atendimento-sac.api";
import {
  rotulosStatusSac,
  type AnexoSac,
  type StatusSac,
} from "@/types/atendimento-sac.types";
export const liderSac = (perfil?: string | string[]) =>
  (Array.isArray(perfil) ? perfil : [perfil || ""]).some((role) => ["ADMIN", "GESTAO", "LIDER_ATENDIMENTO"].includes(role));
export const dataSac = (data?: string | null) =>
  data ? new Date(data).toLocaleString("pt-BR") : "—";
export const entradaDataSac = (data?: string | null) =>
  data
    ? new Date(
      new Date(data).getTime() - new Date(data).getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16)
    : "";
export const camposSac = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" },
  gap: 2,
};


export function StatusSacChip({
  status,
}: {
  status: StatusSac;
}) {
  const cores: Record<
    StatusSac,
    {
      fundo: string;
      texto: string;
    }
  > = {
    NOVO: {
      fundo: "#ff9800",
      texto: "#ffffff",
    },

    ATRIBUIDO: {
      fundo: "#2196f3",
      texto: "#ffffff",
    },

    EM_ATENDIMENTO: {
      fundo: "#1976d2",
      texto: "#ffffff",
    },

    CLASSIFICADO: {
      fundo: "#7b1fa2",
      texto: "#ffffff",
    },

    AGUARDANDO_ACAO: {
      fundo: "#f57c00",
      texto: "#ffffff",
    },

    EM_TRATATIVA: {
      fundo: "#0097a7",
      texto: "#ffffff",
    },

    AGUARDANDO_AVALIACAO: {
      fundo: "#0288d1",
      texto: "#ffffff",
    },

    CONCLUIDO: {
      fundo: "#2e7d32",
      texto: "#ffffff",
    },

    REABERTO: {
      fundo: "#d32f2f",
      texto: "#ffffff",
    },
  };

  const cor = cores[status];

  return (
    <Chip
      size="small"
      label={rotulosStatusSac[status]}
      sx={{
        bgcolor: cor.fundo,
        color: cor.texto,
        fontWeight: 700,
        border: "none",

        width: "fit-content",
        alignSelf: "flex-start",

        height: 26,

        "& .MuiChip-label": {
          px: 1.5,
          fontSize: 12,
        },
      }}
    />
  );
}
export function SecaoSac({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {titulo}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
}
export function ListaAnexosSac({
  anexos,
  token,
  id,
  erro,
  baixar,
}: {
  anexos: AnexoSac[];
  baixar?: (anexo: AnexoSac) => Promise<void>;
  token: string;
  id: string;
  erro: (m: string) => void;
}) {
  return (
    <Stack spacing={1}>
      {!anexos.length && (
        <Typography color="text.secondary">
          Nenhum anexo nesta etapa.
        </Typography>
      )}
      {anexos.map((a) => (
        <Paper key={a.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{ justifyContent: "space-between", gap: 1 }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600 }}>{a.nome}</Typography>
              <Typography variant="caption" color="text.secondary">
                {a.etapa.replaceAll("_", " ")} · {dataSac(a.criadoEm)} ·{" "}
                {a.usuario?.name || "Enviado pelo site"}
              </Typography>
              {a.comentario && (
                <Typography
                  sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {a.comentario}
                </Typography>
              )}
            </Box>
            <Button
              onClick={() =>
                (baixar ? baixar(a) : baixarAnexoSac(token, id, a.id, a.nome)).catch((e) =>
                  erro(e.message),
                )
              }
            >
              Baixar
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
export function UploadAnexosSac({ token, id, etapa, concluido, erro }: {
  token: string; id: string; etapa: string;
  concluido: () => Promise<void>; erro: (m: string) => void;
}) {
  return <UploadAnexos enviarArquivo={(arquivo, comentario) => enviarAnexoSac(token, id, arquivo, etapa, comentario)} concluido={concluido} erro={erro} />;
}
