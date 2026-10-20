"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import { alterarModalidade, type ModalidadeCadastro } from "@/services/cadastros.service";

export function ModalidadeCadastro({ id, modalidade, documento, token, podeEditar, aoSalvar }: {
  id: string;
  modalidade: ModalidadeCadastro;
  documento?: string | null;
  token: string;
  podeEditar: boolean;
  aoSalvar: () => Promise<void>;
}) {
  const [tipo, setTipo] = useState(modalidade);
  const [documentoInformado, setDocumento] = useState(documento || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setTipo(modalidade);
    setDocumento(documento || "");
    setErro("");
  }, [id, modalidade, documento]);

  async function salvar() {
    try {
      setSalvando(true);
      setErro("");
      await alterarModalidade(id, tipo, documentoInformado || undefined, token);
      await aoSalvar();
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não foi possível alterar a modalidade.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: "14px", borderColor: "#e2e8f0", boxShadow: "none" }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box sx={{ display: "grid", placeItems: "center", width: 42, height: 42, flexShrink: 0, borderRadius: "10px", bgcolor: "#fff7ed", color: "#ea580c" }}>
              <SwapHorizOutlinedIcon />
            </Box>
            <Box>
              <Typography component="h2" sx={{ fontSize: 18, fontWeight: 800, color: "#1f2937" }}>Modalidade do cadastro</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 13, color: "#64748b" }}>Defina se este cadastro é um Cliente ou um Lead.</Typography>
            </Box>
          </Stack>
          <Chip label={`Modalidade atual: ${modalidade === "CLIENTE" ? "Cliente" : "Lead"}`} size="small" sx={{ alignSelf: { xs: "flex-start", sm: "center" }, bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 700 }} />
        </Stack>
        {erro && <Alert severity="error">{erro}</Alert>}
        {podeEditar ? (
          <Box component="form" onSubmit={evento => { evento.preventDefault(); void salvar(); }} sx={{ p: { xs: 2, md: 2.5 }, border: "1px solid #e2e8f0", borderRadius: "12px", bgcolor: "#f8fafc" }}>
            <Stack spacing={2} sx={{ maxWidth: 560 }}>
              <TextField select label="Modalidade" size="small" fullWidth value={tipo} onChange={evento => setTipo(evento.target.value as ModalidadeCadastro)} disabled={salvando} sx={{ bgcolor: "#fff" }}>
                <MenuItem value="CLIENTE">Cliente</MenuItem>
                <MenuItem value="LEAD">Lead</MenuItem>
              </TextField>
              {tipo === "CLIENTE" && !documento && (
                <TextField label="CPF ou CNPJ (opcional)" size="small" fullWidth value={documentoInformado} onChange={evento => setDocumento(evento.target.value)} disabled={salvando} sx={{ bgcolor: "#fff" }} />
              )}
              <Button type="submit" variant="contained" disabled={salvando || tipo === modalidade} sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, minHeight: 40, borderRadius: "8px", textTransform: "none", fontWeight: 700, bgcolor: "#ff5805", boxShadow: "none", "&:hover": { bgcolor: "#e94f00", boxShadow: "none" } }}>
                {salvando ? "Salvando..." : "Salvar modalidade"}
              </Button>
            </Stack>
          </Box>
        ) : (
          <Typography sx={{ color: "#64748b", fontSize: 13 }}>Seu perfil permite apenas consultar a modalidade deste cadastro.</Typography>
        )}
      </Stack>
    </Paper>
  );
}
