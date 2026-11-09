"use client";

import { FeedbackToast } from '@/components/ui/feedback-toast';

import { notificarCrm } from '@/lib/feedback-crm';

import { useEffect, useState } from "react";
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
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
      notificarCrm('Modalidade do cadastro atualizada com sucesso.');
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não foi possível alterar a modalidade.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: '12px', borderColor: '#e2e8f0', bgcolor: '#fff', boxShadow: 'none', '&& .MuiOutlinedInput-root': { borderRadius: '8px' }, '&& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': { height: 40 }, '&& .MuiInputLabel-root': { fontSize: 13, fontWeight: 400 }, '&& .MuiInputBase-input, && .MuiSelect-select': { fontSize: 13.5, fontWeight: 400 } }}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography component="h2" sx={{ fontSize: 17, fontWeight: 600, color: '#1f2937' }}>Modalidade</Typography>
          <Chip label={'Atual: '+(modalidade === 'CLIENTE' ? 'Cliente' : 'Lead')} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 500, borderRadius: '6px' }} />
        </Stack>
        <FeedbackToast open={Boolean(erro)} title="Não foi possível salvar" message={erro} variant="error" onClose={() => setErro('')} />
        {podeEditar ? <Box component="form" onSubmit={evento => { evento.preventDefault(); void salvar(); }} sx={{ borderTop: '2px solid #ff5805', pt: 2.5 }}>
          <Stack spacing={2} sx={{ maxWidth: 560 }}>
            <TextField select label="Modalidade" size="small" fullWidth value={tipo} onChange={evento => setTipo(evento.target.value as ModalidadeCadastro)} disabled={salvando}><MenuItem value="CLIENTE">Cliente</MenuItem><MenuItem value="LEAD">Lead</MenuItem></TextField>
            {tipo === 'CLIENTE' && !documento && <TextField label="CPF ou CNPJ (opcional)" size="small" fullWidth value={documentoInformado} onChange={evento => setDocumento(evento.target.value)} disabled={salvando} />}
            <Button type="submit" variant="contained" disabled={salvando || tipo === modalidade} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minHeight: 40, borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: '#ff5805', boxShadow: 'none', '&:hover': { bgcolor: '#e94f00', boxShadow: 'none' } }}>{salvando ? 'Salvando...' : 'Salvar modalidade'}</Button>
          </Stack>
        </Box> : <Typography sx={{ color: '#64748b', fontSize: 13 }}>Somente leitura para o seu perfil.</Typography>}
      </Stack>
    </Paper>
  );
}
