"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { LEAD_FUNNEL_STAGES, normalizeLeadFunnelStage, type LeadFunnelStage } from "@/constants/lead-funnel";
import { atualizarEtapaCadastro, obterDadosLead } from "@/services/cadastros.service";

export function EtapaFunilCadastro({ id, token, podeEditar, aoSalvar }: {
  id: string; token: string; podeEditar: boolean; aoSalvar: () => Promise<void>;
}) {
  const [etapa, setEtapa] = useState<LeadFunnelStage | "">("");
  const [etapaSalva, setEtapaSalva] = useState<LeadFunnelStage | "">("");
  const [dados, setDados] = useState({ proximaAcao: "", responsavel: "", volumeMensalEstimado: "" });
  const [dadosSalvos, setDadosSalvos] = useState({ proximaAcao: "", responsavel: "", volumeMensalEstimado: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setEtapa("");
    setEtapaSalva("");
    setDados({ proximaAcao: "", responsavel: "", volumeMensalEstimado: "" });
    setDadosSalvos({ proximaAcao: "", responsavel: "", volumeMensalEstimado: "" });
    setErro("");
    setSucesso(false);
    obterDadosLead(id, token).then(lead => {
      if (!ativo) return;
      const valor = lead ? normalizeLeadFunnelStage(lead.status) : "";
      setEtapa(valor);
      setEtapaSalva(valor);
      const comerciais = {
        proximaAcao: String(lead?.metadata?.nextAction ?? ""),
        responsavel: String(lead?.metadata?.responsible ?? ""),
        volumeMensalEstimado: String(lead?.metadata?.monthlyEstimatedValue ?? ""),
      };
      setDados(comerciais);
      setDadosSalvos(comerciais);
    }).catch(erro => {
      if (ativo) setErro(erro instanceof Error ? erro.message : "Não foi possível carregar a etapa.");
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [id, token]);

  async function salvar() {
    if (!etapa) return;
    setSalvando(true);
    setErro("");
    setSucesso(false);
    try {
      const lead = await atualizarEtapaCadastro(id, etapa, token, dados);
      setEtapaSalva(normalizeLeadFunnelStage(lead.status));
      setDadosSalvos({ ...dados });
      await aoSalvar();
      setSucesso(true);
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não foi possível salvar a etapa.");
    } finally { setSalvando(false); }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderColor: "#e2e8f0", borderRadius: "14px", boxShadow: "none" }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>Acompanhamento comercial</Typography>
          <Typography sx={{ fontSize: 12.5, color: "#64748b" }}>Etapa e informações usadas no BI Comercial e no Funil de Vendas.</Typography>
        </Stack>
        {erro && <Alert severity="error">{erro}</Alert>}
        {sucesso && <Alert severity="success">Dados salvos. Atualize os painéis abertos para consultar a mudança.</Alert>}
        {carregando ? <CircularProgress size={22} aria-label="Carregando etapa do funil" /> : (
          <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
            <TextField select size="small" fullWidth slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }} label="Etapa comercial" value={etapa} onChange={evento => { setEtapa(evento.target.value as LeadFunnelStage); setSucesso(false); }} disabled={!podeEditar || salvando} sx={{ maxWidth: { sm: 360 }, "& .MuiOutlinedInput-root": { borderRadius: "8px", height: 44 } }}>
              <MenuItem value="" disabled>Sem etapa definida</MenuItem>
              {LEAD_FUNNEL_STAGES.map(item => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
            </TextField>
            {podeEditar && <Button onClick={salvar} disabled={salvando || !etapa || (etapa === etapaSalva && JSON.stringify(dados) === JSON.stringify(dadosSalvos))} variant="contained" sx={{ minHeight: 44, px: 2, borderRadius: "8px", textTransform: "none", fontWeight: 700, whiteSpace: "nowrap", bgcolor: "#ff5805", boxShadow: "none", "&:hover": { bgcolor: "#e94f00", boxShadow: "none" } }}>{salvando ? "Salvando..." : "Salvar acompanhamento"}</Button>}
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
            <TextField size="small" fullWidth label="Próxima ação" placeholder="Ex.: Enviar proposta" value={dados.proximaAcao} onChange={evento => { setDados(atual => ({ ...atual, proximaAcao: evento.target.value })); setSucesso(false); }} disabled={!podeEditar || salvando} />
            <TextField size="small" fullWidth label="Responsável" value={dados.responsavel} onChange={evento => { setDados(atual => ({ ...atual, responsavel: evento.target.value })); setSucesso(false); }} disabled={!podeEditar || salvando} />
            <TextField size="small" fullWidth label="Volume mensal estimado (R$)" placeholder="Ex.: 12.500,00" value={dados.volumeMensalEstimado} onChange={evento => { setDados(atual => ({ ...atual, volumeMensalEstimado: evento.target.value })); setSucesso(false); }} slotProps={{ htmlInput: { inputMode: "decimal" } }} disabled={!podeEditar || salvando} />
          </Box>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
