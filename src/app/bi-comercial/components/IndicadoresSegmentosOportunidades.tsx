"use client";

import Link from "next/link";

import { efeitoCardBiSx } from './estilos-bi';
import { Alert, Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { CircleCheck, CircleX, FileText, FolderOpen, Handshake, Layers } from 'lucide-react';
import { montarBiCadastros, montarBiOportunidades, numero } from '@/lib/bi-comercial';

type DadosCadastros = ReturnType<typeof montarBiCadastros>;
type DadosOportunidades = ReturnType<typeof montarBiOportunidades>;
const superficie = { ...efeitoCardBiSx, border: '1px solid #e4ebf2', borderRadius: 2.5, boxShadow: '0 3px 16px rgba(30,60,90,.035)', bgcolor: '#fff', p: 2.2, minWidth: 0 };
const legenda = { fontSize: 11, color: '#71869a', lineHeight: 1.5 };
const percentual = (valor: number, total: number) => total ? `${numero(valor / total * 100)}%` : '0%';

export function IndicadoresSegmentosOportunidades({ cadastros, oportunidades, carregando, erroCadastros, erroOportunidades, exibicao = 'ambos' }: {
  exibicao?: 'ambos' | 'segmentos' | 'oportunidades';
  cadastros: DadosCadastros | null;
  oportunidades: DadosOportunidades | null;
  carregando: boolean;
  erroCadastros: string;
  erroOportunidades: string;
}) {
  const segmentos = [...(cadastros?.segmentos ?? [])].sort((a, b) => b.quantidade - a.quantidade || a.label.localeCompare(b.label, 'pt-BR'));
  const maiorSegmento = Math.max(1, ...segmentos.map(item => item.quantidade));
  const indicadores = oportunidades ? [
    { nome: 'Abertas', href: '/oportunidades?situacao=OPEN', titulo: 'Oportunidades abertas', valor: oportunidades.abertas, cor: '#ff5805', fundo: '#fff4eb', icone: FolderOpen },
    { nome: 'Ganhas', href: '/oportunidades?situacao=WON', titulo: 'Oportunidades ganhas', valor: oportunidades.ganhas, cor: '#24a779', fundo: '#edf9f2', icone: CircleCheck },
    { nome: 'Perdidas', href: '/oportunidades?situacao=LOST', titulo: 'Oportunidades perdidas', valor: oportunidades.perdidas, cor: '#ef5b6b', fundo: '#fff0f2', icone: CircleX },
    { nome: 'Propostas', href: '/oportunidades', titulo: 'Propostas cadastradas', valor: oportunidades.propostas, cor: '#8461df', fundo: '#f4f0ff', icone: FileText },
  ] : [];
  const teto = Math.max(4, Math.ceil(Math.max(0, ...indicadores.map(item => item.valor)) / 4) * 4);
  return <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 2, alignItems: 'stretch' }}>
    {exibicao !== 'oportunidades' && <Paper component="section" aria-label="Cadastros por segmento" elevation={0} sx={{ ...superficie, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2, color: '#204661' }}>
        <Layers size={21} color="#ff5805" /><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Cadastros por segmento</Typography>
      </Stack>
      {carregando ? <LinearProgress aria-label="Carregando segmentos" /> : erroCadastros ? <Alert severity="error">{erroCadastros}</Alert> : !segmentos.length ? <Typography sx={legenda}>Nenhum cadastro no período selecionado.</Typography> : <>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography sx={legenda}>Empresas por segmento cadastrado</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#c94600', bgcolor: '#fff4eb', borderRadius: '6px', px: 1, py: 0.5, whiteSpace: 'nowrap' }}>{numero(cadastros?.total ?? 0)} cadastros</Typography>
        </Stack>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 220 }}>
          <Stack component="ul" spacing={2.5} sx={{ listStyle: 'none', p: 0, m: 0, maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
            {segmentos.map(item => <Box component="li" key={item.segmento === null ? 'sem-segmento' : 'segmento-' + item.segmento}>
              <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 0.9 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', overflowWrap: 'anywhere', minWidth: 0 }}>{item.label}</Typography>
                <Typography sx={{ fontSize: 13, whiteSpace: 'nowrap', fontWeight: 750, color: '#17374e' }}>{numero(item.quantidade)} <Box component="span" sx={{ fontSize: 11, color: '#71869a', fontWeight: 400, ml: 0.5 }}>({numero(item.percentual)}%)</Box></Typography>
              </Stack>
              <Box aria-hidden="true" sx={{ height: 14, bgcolor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(25% - 1px), #e2e8f0 calc(25% - 1px), #e2e8f0 25%)' }}>
                <Box sx={{ height: '100%', width: `${item.quantidade / maiorSegmento * 100}%`, background: 'linear-gradient(90deg, #ff5805, #ff944f)', borderRadius: '5px' }} />
              </Box>
            </Box>)}
          </Stack>
          <Stack direction="row" aria-hidden="true" sx={{ justifyContent: 'space-between', mt: 1.5, pr: 0.5 }}>
            <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>0</Typography>
            <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>Quantidade de empresas</Typography>
            <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>{numero(maiorSegmento)}</Typography>
          </Stack>
        </Box>
        <Typography sx={{ ...legenda, mt: 2, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>Percentuais sobre os cadastros do período. Cada empresa é contada uma vez.</Typography>
      </>}
    </Paper>}
    {exibicao !== 'segmentos' && <Paper component="section" aria-label="Propostas e oportunidades" elevation={0} sx={superficie}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2, color: '#204661' }}>
        <Handshake size={22} color="#ff5805" /><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Propostas e oportunidades</Typography>
      </Stack>
      {carregando ? <LinearProgress aria-label="Carregando propostas e oportunidades" /> : erroOportunidades ? <Alert severity="error">{erroOportunidades}</Alert> : oportunidades && <>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', sm: 'repeat(4,minmax(0,1fr))' }, gap: 1 }}>
          {indicadores.map(item => <Stack component={Link} href={item.href} key={item.nome} direction="row" spacing={1} aria-label={`${item.titulo}: ${numero(item.valor)}`} sx={{ bgcolor: item.fundo, borderRadius: '8px', p: 1.2, alignItems: 'center', minWidth: 0, textDecoration: 'none', cursor: 'pointer', border: '1px solid transparent', '&:hover': { borderColor: item.cor }, '&:focus-visible': { outline: `2px solid ${item.cor}`, outlineOffset: 2 } }}>
            <item.icone size={20} color={item.cor} style={{ flexShrink: 0 }} />
            <Box><Typography sx={{ fontSize: 11, color: '#405568' }}>{item.nome}</Typography><Typography sx={{ fontSize: 21, lineHeight: 1.2, fontWeight: 800, color: '#17374e' }}>{numero(item.valor)}</Typography></Box>
          </Stack>)}
        </Box>
        <Box sx={{ mt: 1.5, minWidth: 0, width: '100%', maxWidth: exibicao === 'oportunidades' ? 560 : '100%', mx: 'auto' }}>
          <svg viewBox="0 0 440 192" role="group" aria-label="Comparação das quantidades de oportunidades abertas, ganhas, perdidas e propostas" style={{ display: 'block', width: '100%', height: 'auto' }}>
            <title>Quantidades no período selecionado</title>
            {[0, 1, 2, 3, 4].map(indice => <g key={indice}>
              <line x1="35" x2="433" y1={150 - indice * 32} y2={150 - indice * 32} stroke="#e4ebf2" />
              <text x="27" y={154 - indice * 32} textAnchor="end" fill="#71869a" fontSize="11">{numero(teto * indice / 4)}</text>
            </g>)}
            {indicadores.map((item, indice) => {
              const altura = item.valor / teto * 128;
              return <a key={item.nome} href={item.href} aria-label={`Ver ${item.nome.toLocaleLowerCase('pt-BR')}: ${numero(item.valor)}`} style={{ cursor: 'pointer' }}>
                <rect x={45 + indice * 98} y="10" width="82" height="172" fill="transparent" />
                <title>{`${item.titulo}: ${numero(item.valor)}`}</title>
                <rect x={55 + indice * 98} y={150 - altura} width="62" height={altura} rx="3" fill={item.cor} />
                <text x={86 + indice * 98} y={141 - altura} textAnchor="middle" fill="#17374e" fontSize="13" fontWeight="700">{numero(item.valor)}</text>
                <text x={86 + indice * 98} y="172" textAnchor="middle" fill="#405568" fontSize="12">{item.nome}</text>
              </a>;
            })}
          </svg>
        </Box>
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 1 }}>
          {indicadores.map(item => <Stack component="li" key={item.nome} direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box aria-hidden="true" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: item.cor, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11, color: '#405568' }}>{item.nome}: <strong>{numero(item.valor)}</strong> ({percentual(item.valor, oportunidades.total)})</Typography>
          </Stack>)}
        </Box>
        <Typography sx={{ ...legenda, mt: 1.5 }}>Clique nos cards ou nas barras para abrir as propostas. Percentuais sobre {numero(oportunidades.total)} oportunidades do período, pela data de criação. Propostas cadastradas podem estar abertas, ganhas ou perdidas; não são somadas aos status.</Typography>
      </>}
    </Paper>}
  </Box>;
}

