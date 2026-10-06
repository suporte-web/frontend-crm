'use client';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { API_BASE_URL } from '@/services/api';

type AtendimentoRelato = {
  id: string; protocolo?: string | null; nomeSolicitante?: string | null;
  emailSolicitante?: string | null; telefoneSolicitante?: string | null; formPayload?: Record<string, unknown> | null;
};
export function DadosRelatoSite({ atendimento }: { atendimento: AtendimentoRelato }) {
  const { token } = useAuth();
  const [baixando, definirBaixando] = useState('');
  const [erro, definirErro] = useState('');
  const payload = atendimento.formPayload;
  if (payload?.canal !== 'RECLAMACOES_ELOGIOS') return null;
  const anexos = Array.isArray(payload.anexos) ? payload.anexos.filter((item): item is { id: string; nome: string; comentario?: string | null } =>
    !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.nome === 'string') : [];
  async function baixar(anexo: { id: string; nome: string }) {
    if (!token || baixando) return;
    definirBaixando(anexo.id); definirErro('');
    try {
      const resposta = await fetch(`${API_BASE_URL}/atendimentos/site/relatos/${atendimento.id}/anexos/${anexo.id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!resposta.ok) throw new Error('Não foi possível baixar o anexo.');
      const url = URL.createObjectURL(await resposta.blob());
      const link = document.createElement('a'); link.href = url; link.download = anexo.nome;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { definirErro('Não foi possível baixar o anexo. Tente novamente.'); }
    finally { definirBaixando(''); }
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-lg font-semibold text-slate-950">Registro do Canal do Cliente</h3>
    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
      {[
        ['Protocolo', atendimento.protocolo], ['Tipo', payload.tipoRegistro === 'ELOGIO' ? 'Elogio' : 'Reclamação'],
        ['Nome completo', atendimento.nomeSolicitante], ['Telefone', atendimento.telefoneSolicitante],
        ['E-mail', atendimento.emailSolicitante], ['Estado', typeof payload.estado === 'string' ? payload.estado : null],
      ].map(([titulo, valor]) => <div key={titulo}><p className="font-semibold text-slate-700">{titulo}</p><p className="mt-1 wrap-break-word text-slate-600">{valor ?? '-'}</p></div>)}
    </div>
    <p className="mt-4 font-semibold text-slate-700">Relato</p>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{typeof payload.relato === 'string' ? payload.relato : '-'}</p>
    <p className="mt-4 font-semibold text-slate-700">Anexos</p>
    {!anexos.length ? <p className="mt-1 text-sm text-slate-500">Nenhum anexo enviado.</p> : <ul className="mt-2 space-y-2">{anexos.map(anexo => <li key={anexo.id}><button type="button" disabled={!!baixando} onClick={() => baixar(anexo)} className="break-all rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-slate-50 disabled:opacity-50">{baixando === anexo.id ? 'Baixando…' : `Baixar ${anexo.nome}`}</button>{typeof anexo.comentario === 'string' && anexo.comentario.trim() && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600"><span className="font-semibold text-slate-700">Comentário: </span>{anexo.comentario}</p>}</li>)}</ul>}
    <div aria-live="polite">{erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}</div>
  </section>;
}
