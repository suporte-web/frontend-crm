"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import { UploadAnexos } from "./UploadAnexos";
import {
  baixarAnexoLead,
  enviarAnexoLead,
  listarAnexosLead,
  type LeadAnexo,
} from "@/services/lead-anexos.service";

export function LeadAttachments({
  token,
  leadId,
}: {
  token: string;
  leadId: string;
}) {
  const [anexos, setAnexos] = useState<LeadAnexo[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const carregar = useCallback(async () => {
    const lista = await listarAnexosLead(token, leadId);
    setAnexos(lista);
  }, [token, leadId]);
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");
    setAnexos([]);
    listarAnexosLead(token, leadId)
      .then((lista) => {
        if (ativo) setAnexos(lista);
      })
      .catch((e) => {
        if (ativo)
          setErro(e instanceof Error ? e.message : "Erro ao carregar anexos.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [token, leadId]);
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <AttachFileIcon color="action" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Anexos
        </Typography>
        <Chip size="small" label={anexos.length} />
      </Stack>
      {erro && (
        <Alert severity="error" onClose={() => setErro("")}>
          {erro}
        </Alert>
      )}
      {carregando ? (
        <CircularProgress size={22} />
      ) : anexos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum anexo adicionado.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {anexos.map((anexo) => (
            <Box
              key={anexo.id}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { sm: "center" },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
                  >
                    {anexo.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(anexo.criadoEm).toLocaleString("pt-BR")}
                    {anexo.usuario ? ` • ${anexo.usuario.name}` : ""}
                  </Typography>
                  {anexo.comentario && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, overflowWrap: "anywhere" }}
                    >
                      {anexo.comentario}
                    </Typography>
                  )}
                </Box>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() =>
                    baixarAnexoLead(token, leadId, anexo).catch((e) =>
                      setErro(
                        e instanceof Error ? e.message : "Erro ao baixar.",
                      ),
                    )
                  }
                >
                  Baixar
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      <UploadAnexos
        enviarArquivo={(arquivo, comentario) =>
          enviarAnexoLead(token, leadId, arquivo, comentario)
        }
        concluido={async () => {
          await carregar();
          setErro("");
        }}
        erro={setErro}
      />
    </Stack>
  );
}
