'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { ChevronDown } from 'lucide-react';
import { LeadForm } from '@/components/leads/lead-form';
import { LeadAttachments } from '@/components/attachments/LeadAttachments';
import { LeadTimeline } from '@/components/leads/lead-timeline';
import { atualizarDadosLead, obterDadosLead, registrarObservacaoCadastro } from '@/services/cadastros.service';
import type { Lead, CreateLeadPayload } from '@/types/leads';

export function DadosLeadCadastro({ id, token, podeEditar, aoSalvar }: { id: string; token: string; podeEditar: boolean; aoSalvar: () => Promise<void> }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [observacao, setObservacao] = useState('');
  useEffect(() => {
    let ativo = true;
    obterDadosLead(id, token).then(valor => { if (ativo) setLead(valor); }).catch(e => { if (ativo) setErro(e instanceof Error ? e.message : 'Erro ao carregar dados do lead.'); }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [id, token]);
  const valores = useMemo<Partial<CreateLeadPayload>>(() => {
    if (!lead) return {};
    const extras: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(lead.metadata || {})) if (typeof valor === 'string') extras[chave] = valor;
    return { ...extras, name: lead.name, email: lead.email || '', phone: lead.phone || '', company: lead.company || '', source: lead.source, status: lead.status, notes: lead.notes || '' };
  }, [lead]);
  if (carregando) return <CircularProgress size={22} />;
  if (erro && !lead) return <Alert severity="error">{erro}</Alert>;
  if (!lead) return null;
  async function salvar(payload: CreateLeadPayload) {
    try {
      setSalvando(true); setErro('');
      const atualizado = await atualizarDadosLead(id, payload, token);
      setLead(atualizado); await aoSalvar(); return false;
    } catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao salvar dados do lead.'); return false; }
    finally { setSalvando(false); }
  }
  async function adicionarObservacao() {
    if (!lead || !observacao.trim()) return;
    try {
      setSalvando(true); setErro('');
      await registrarObservacaoCadastro(id, observacao.trim(), token);
      setObservacao(''); setLead(await obterDadosLead(id, token));
    } catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao registrar observação.'); }
    finally { setSalvando(false); }
  }
  return <Accordion sx={{ borderRadius: 3 }}>
    <AccordionSummary expandIcon={<ChevronDown size={20} />}><Typography sx={{ fontWeight: 800 }}>Dados do lead e acompanhamento no funil</Typography></AccordionSummary>
    <AccordionDetails><Stack spacing={3}>
      {erro && <Alert severity="error">{erro}</Alert>}
      {podeEditar ? <LeadForm loading={salvando} onSubmit={salvar} initialValues={valores} submitLabel="Salvar acompanhamento" /> : <Stack spacing={1}>{Object.entries({ name: 'Contato', company: 'Empresa', email: 'E-mail', phone: 'Telefone', source: 'Origem', status: 'Etapa', segment: 'Segmento', transport: 'Transporte', storage: 'Armazenagem', entryDate: 'Data de entrada', lastInteractionDate: 'Última interação', monthlyEstimatedValue: 'Valor mensal estimado', responsible: 'Responsável', currentStatus: 'Situação atual', nextAction: 'Próxima ação', notes: 'Observações' }).map(([chave, rotulo]) => <Typography key={chave}><strong>{rotulo}:</strong> {String((valores as Record<string, unknown>)[chave] || 'Não informado')}</Typography>)}</Stack>}
      <LeadAttachments token={token} leadId={lead.id} />
      {!!lead.observations?.length && <Stack spacing={1}><Typography sx={{ fontWeight: 800 }}>Observações registradas</Typography>{lead.observations.map(obs => <Typography key={obs.id} sx={{ whiteSpace: 'pre-wrap' }}>{obs.content}</Typography>)}</Stack>}
      {podeEditar && <Stack spacing={1}><TextField multiline minRows={2} label="Nova observação" value={observacao} onChange={e => setObservacao(e.target.value)} disabled={salvando} /><Button onClick={adicionarObservacao} disabled={salvando || !observacao.trim()}>Registrar observação</Button></Stack>}
      <LeadTimeline events={lead.timeline || []} />
    </Stack></AccordionDetails>
  </Accordion>;
}
