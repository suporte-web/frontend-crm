import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Alert, Autocomplete, Box, Button, FormControlLabel, Switch, TextField } from '@mui/material';
import type { ClientFormData } from '@/components/clientes/client-form';
import { classificarSegmento, listarSegmentos, type Segmento } from '@/stores/segmentos/service';

export function CampoSegmento({ form, setForm, desabilitado }: { form: ClientFormData; setForm: Dispatch<SetStateAction<ClientFormData>>; desabilitado: boolean }) {
  const [opcoes, setOpcoes] = useState<Segmento[]>([]);
  const [erro, setErro] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const automatico = form.segmentoAutomatico ?? (form.segmentoOrigem === 'CNAE' || !form.segment.trim());
  const codigo = form.cnae.replace(/[./\-\s]/g, '');
  useEffect(() => {
    const controller = new AbortController();
    listarSegmentos(controller.signal).then(setOpcoes).catch(error => { if (!controller.signal.aborted) setErro(error instanceof Error ? error.message : 'Não foi possível carregar os segmentos.'); });
    return () => controller.abort();
  }, [tentativa]);
  useEffect(() => {
    if (!automatico) return;
    const controller = new AbortController();
    if (!/^\d{7}$/.test(codigo)) {
      setBuscando(false);
      setForm(atual => (atual.segmentoAutomatico === false || atual.cnae.replace(/[./\-\s]/g, '') !== codigo || (!atual.segment && atual.segmentoId === null && atual.segmentoAutomatico === true)) ? atual : { ...atual, segment: '', segmentoId: null, segmentoAutomatico: true });
      return;
    }
    const timer = setTimeout(() => {
      setBuscando(true); setErro('');
      classificarSegmento(codigo, controller.signal).then(dados => {
        if (!controller.signal.aborted) setForm(atual => atual.segmentoAutomatico === false || atual.cnae.replace(/[./\-\s]/g, '') !== codigo ? atual : { ...atual, segment: dados.segmento?.nome || '', segmentoId: dados.segmento?.id ?? null, segmentoAutomatico: true });
      }).catch(error => { if (!controller.signal.aborted) setErro(error instanceof Error ? error.message : 'Não foi possível classificar o CNAE.'); })
        .finally(() => { if (!controller.signal.aborted) setBuscando(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [automatico, codigo, setForm, tentativa]);
  const selecionado = opcoes.find(item => item.id === form.segmentoId || item.nome === form.segment) || (form.segment ? { id: 'legado', nome: form.segment } : null);
  return <Box sx={{ minWidth: 0 }}>
    <FormControlLabel sx={{ m: 0 }} label="Classificar pelo CNAE" control={<Switch size="small" checked={automatico} disabled={desabilitado} onChange={(_, checked) => { setErro(''); setBuscando(false); setForm(atual => ({ ...atual, segmentoAutomatico: checked, ...(checked ? { segmentoId: null, segment: '' } : {}) })); }} />} />
    {automatico ? <TextField fullWidth size="small" label="Segmento" value={form.segment} disabled slotProps={{ inputLabel: { shrink: true } }} helperText={buscando ? 'Consultando classificação…' : form.segment ? 'Classificação automática pelo CNAE principal.' : 'Sem classificação. Informe o CNAE ou selecione o segmento manualmente.'} /> : <Autocomplete size="small" options={selecionado?.id === 'legado' ? [selecionado, ...opcoes] : opcoes} value={selecionado} disabled={desabilitado} getOptionLabel={item => item.nome} isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, item) => setForm(atual => ({ ...atual, segmentoId: item?.id === 'legado' ? null : item?.id ?? null, segment: item?.nome || '', segmentoAutomatico: false }))}
      renderInput={params => <TextField {...params} label="Segmento" helperText={selecionado?.id === 'legado' ? 'Valor legado preservado. Selecione um item para padronizar.' : 'Escolha um segmento do catálogo.'} />} />}
    {erro && <Alert severity="warning" sx={{ mt: 1 }} action={<Button size="small" onClick={() => setTentativa(valor => valor + 1)}>Tentar novamente</Button>}>{erro}</Alert>}
  </Box>;
}
