"use client";

import { useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Stack, Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { baixarAnexo, obterArquivoAnexo } from "@/services/anexos.api";
export type DocumentoVisualizavel = { id: string; nome: string; tipo?: string | null };

export function VisualizadorDocumento({ token, caminho, anexo, onClose }: {
  token: string;
  caminho: string;
  anexo: DocumentoVisualizavel | null;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<{
    id: string; caminho: string; token: string;
    url?: string; tipo?: string; erro?: string;
  } | null>(null);
  const [erroDownload, setErroDownload] = useState("");

  useEffect(() => {
    setPreview(null);
    setErroDownload("");
    if (!anexo) return;
    let ativo = true;
    let url: string | undefined;
    obterArquivoAnexo(token, caminho)
      .then((blob) => {
        if (!ativo) return;
        const tipoRecebido = blob.type.split(";")[0].toLowerCase();
        const tipo = (!tipoRecebido || tipoRecebido === "application/octet-stream") ? (anexo.tipo?.toLowerCase() || "") : tipoRecebido;
        if (!["application/pdf", "image/jpeg", "image/png"].includes(tipo)) {
          setPreview({ id: anexo.id, caminho, token, erro: "Este formato não permite pré-visualização. Use Baixar para abrir o arquivo." });
          return;
        }
        const arquivoVisualizacao = tipoRecebido === tipo ? blob : new Blob([blob], { type: tipo });
        url = URL.createObjectURL(arquivoVisualizacao);
        setPreview({ id: anexo.id, caminho, token, url, tipo });
      })
      .catch((error: unknown) => {
        if (ativo) setPreview({ id: anexo.id, caminho, token, erro: error instanceof Error ? error.message : "Não foi possível visualizar o anexo." });
      });
    return () => {
      ativo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [anexo?.id, anexo?.tipo, caminho, token]);

  const atual = preview?.id === anexo?.id && preview?.caminho === caminho && preview?.token === token ? preview : null;
  return (
    <Dialog open={!!anexo} onClose={onClose} fullWidth maxWidth="lg" aria-labelledby="visualizacao-documento-titulo" slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle id="visualizacao-documento-titulo" sx={{ overflowWrap: "anywhere" }}>{anexo?.nome}</DialogTitle>
      <DialogContent dividers>
        {erroDownload && <Alert severity="error" sx={{ mb: 2 }}>{erroDownload}</Alert>}
        {atual?.erro ? <Alert severity="error">{atual.erro}</Alert> : atual?.url ? (
          atual.tipo === "application/pdf" ? (
            <Box component="iframe" src={atual.url} title={"Pré-visualização: " + anexo?.nome} sx={{ width: "100%", height: "70vh", minHeight: 360, border: 0 }} />
          ) : (
            <Box component="img" src={atual.url} alt={anexo?.nome} sx={{ display: "block", maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", mx: "auto" }} />
          )
        ) : (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", py: 4 }}>
            <CircularProgress size={24} /><Typography>Carregando documento…</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
        <Button startIcon={<DownloadIcon />} disabled={!anexo} onClick={() => {
          if (!anexo) return;
          setErroDownload("");
          baixarAnexo(token, caminho, anexo.nome).catch((error: unknown) => setErroDownload(error instanceof Error ? error.message : "Não foi possível baixar o anexo."));
        }}>Baixar</Button>
      </DialogActions>
    </Dialog>
  );
}
