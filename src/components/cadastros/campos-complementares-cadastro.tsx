"use client";
import type { Dispatch, SetStateAction } from "react";
import { Box, MenuItem, Stack, TextField } from "@mui/material";
import { campoCadastroSx } from "@/components/clientes/client-form";
import { FotoCadastro } from "./foto-cadastro";
import { LEAD_FUNNEL_STAGES, type LeadFunnelStage } from "@/constants/lead-funnel";
import type { ModalidadeCadastro } from "@/services/cadastros.service";

export type CamposComerciaisCadastro = { proximaAcao: string; responsavel: string; volumeMensalEstimado: string };
export function CamposComplementaresCadastro({ modalidade, setModalidade, etapa, setEtapa, comerciais, setComerciais, foto, setFoto, desabilitado }: {
  modalidade: ModalidadeCadastro; setModalidade: (valor: ModalidadeCadastro) => void;
  etapa: LeadFunnelStage; setEtapa: (valor: LeadFunnelStage) => void;
  comerciais: CamposComerciaisCadastro; setComerciais: Dispatch<SetStateAction<CamposComerciaisCadastro>>;
  foto: string; setFoto: (valor: string) => void; desabilitado: boolean;
}) {
  return <Stack spacing={2}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
      <TextField select size="small" fullWidth label="Modalidade do cadastro" value={modalidade} onChange={evento => setModalidade(evento.target.value as ModalidadeCadastro)} disabled={desabilitado} sx={campoCadastroSx}><MenuItem value="CLIENTE">Cliente</MenuItem><MenuItem value="LEAD">Lead</MenuItem></TextField>
      <TextField select size="small" fullWidth label="Etapa do funil comercial" value={etapa} onChange={evento => setEtapa(evento.target.value as LeadFunnelStage)} disabled={desabilitado} sx={campoCadastroSx}>{LEAD_FUNNEL_STAGES.map(item => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField>
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
      <TextField size="small" fullWidth label="Próxima ação" placeholder="Ex.: Enviar proposta" value={comerciais.proximaAcao} onChange={evento => setComerciais(atual => ({ ...atual, proximaAcao: evento.target.value }))} disabled={desabilitado} sx={campoCadastroSx} />
      <TextField size="small" fullWidth label="Responsável" value={comerciais.responsavel} onChange={evento => setComerciais(atual => ({ ...atual, responsavel: evento.target.value }))} disabled={desabilitado} sx={campoCadastroSx} />
      <TextField size="small" fullWidth label="Volume mensal estimado (R$)" placeholder="Ex.: 12.500,00" value={comerciais.volumeMensalEstimado} onChange={evento => setComerciais(atual => ({ ...atual, volumeMensalEstimado: evento.target.value }))} slotProps={{ htmlInput: { inputMode: "decimal" } }} disabled={desabilitado} sx={campoCadastroSx} />
    </Box>
    <Box sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: "12px", bgcolor: "#fff" }}><FotoCadastro valor={foto} aoAlterar={setFoto} desabilitado={desabilitado} /></Box>
  </Stack>;
}
