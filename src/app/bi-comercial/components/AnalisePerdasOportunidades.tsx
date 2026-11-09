"use client";

import { efeitoCardBiSx } from './estilos-bi';
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { CircleHelp } from "lucide-react";
import { consultarMotivosPerda } from "@/services/motivos-perda.service";
import { analisarPerdas, type MotivoPerda } from "@/lib/perda-oportunidade";
import { numero, type OportunidadeBi } from "@/lib/bi-comercial";

export function AnalisePerdasOportunidades({
  token,
  de,
  ate,
  refresh,
  records,
  carregando,
  erroOportunidades,
}: {
  token: string;
  de: string;
  ate: string;
  refresh: number;
  records: OportunidadeBi[] | null;
  carregando: boolean;
  erroOportunidades: string;
}) {
  const [catalog, setCatalog] = useState<MotivoPerda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setCatalog([]);
    if (carregando || erroOportunidades) { setLoading(false); return; }
    consultarMotivosPerda(token)
      .then((reasons) => { if (active) setCatalog(reasons); })
      .catch((e: unknown) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar a análise de perdas.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, refresh, carregando, erroOportunidades]);
  const result = useMemo(() => {
    try {
      return { data: records === null ? null : analisarPerdas(records, catalog, { de, ate }), error: "" };
    } catch (e) {
      return {
        data: null,
        error: e instanceof Error ? e.message : "Período inválido.",
      };
    }
  }, [records, catalog, de, ate]);
  const bi = result.data;
  const rows = [...(bi?.motivos.filter(row => row.quantidade > 0) || [])]
    .sort((a, b) => b.quantidade - a.quantidade || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  const passoEscala = Math.max(1, Math.ceil(Math.max(0, ...rows.map(row => row.quantidade)) / 4));
  const limiteEscala = passoEscala * 4;
  return (
    <Paper elevation={0} sx={{ ...efeitoCardBiSx, p: { xs: 2, md: 2.5 }, border: '1px solid #e4ebf2', borderRadius: 2.5 }}>
      <Typography component="h2" sx={{ fontWeight: 750, fontSize: 18, color: '#204661', mb: 0.5 }}>Motivos de perda</Typography>
      <Typography sx={{ fontSize: 12, color: '#64748b', mb: 2 }}>Oportunidades criadas no período selecionado.</Typography>
      {loading || carregando ? (
        <LinearProgress aria-label="Carregando análise de perdas" sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#ff5805' } }} />
      ) : erroOportunidades || error || result.error ? (
        <Alert severity="error">{erroOportunidades || error || result.error}</Alert>
      ) : bi && <>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', md: '1fr 1fr 2fr' }, gap: { xs: 2, md: 3 }, bgcolor: '#f8fafc', borderRadius: '10px', p: 2, mb: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>Perdidas</Typography>
            <Typography sx={{ fontSize: 26, fontWeight: 750, color: '#204661', mt: 0.5 }}>{numero(bi.total)}</Typography>
          </Box>
          <Box>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Typography sx={{ fontSize: 12, color: '#64748b' }}>Taxa de perda</Typography>
              <Tooltip title={`Perdidas ÷ (ganhas + perdidas). ${numero(bi.encerradas)} oportunidades encerradas no período.`} describeChild>
                <Box component="button" type="button" aria-label="Como a taxa de perda é calculada" sx={{ display: 'inline-flex', p: 0, border: 0, bgcolor: 'transparent', color: '#94a3b8', cursor: 'help', '&:focus-visible': { outline: '2px solid #ff5805', outlineOffset: '3px', borderRadius: '3px' } }}><CircleHelp size={14} /></Box>
              </Tooltip>
            </Stack>
            <Typography sx={{ fontSize: 26, fontWeight: 750, color: '#204661', mt: 0.5 }}>{numero(bi.taxa)}%</Typography>
          </Box>
          <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>Principal motivo</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 650, color: '#334155', mt: 1, overflowWrap: 'anywhere' }}>{bi.principal}</Typography>
          </Box>
        </Box>
        {bi.total === 0 ? <Alert severity="info">Nenhuma oportunidade perdida no período selecionado.</Alert> : (
          <Box component="figure" aria-label="Gráfico de colunas dos motivos de perda" sx={{ m: 0, minWidth: 0 }}>
            <Typography sx={{ mb: 3, fontSize: 12, color: '#64748b' }}>Quantidade de oportunidades perdidas</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr)', columnGap: 1, minWidth: 0 }}>
              <Box aria-hidden="true" sx={{ position: 'relative', height: { xs: 280, md: 360 } }}>
                {[0, 1, 2, 3, 4].map(tick => <Typography key={tick} sx={{ position: 'absolute', bottom: tick * 25 + '%', right: 0, transform: 'translateY(50%)', fontSize: 11, color: '#94a3b8' }}>{numero(tick * passoEscala)}</Typography>)}
              </Box>
              <Box sx={{ height: { xs: 280, md: 360 }, display: 'grid', gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`, alignItems: 'end', columnGap: { xs: 0.75, md: 2 }, px: { xs: 0.5, md: 2 }, borderBottom: '1px solid #cbd5e1', backgroundImage: 'linear-gradient(to top, #e2e8f0 1px, transparent 1px)', backgroundSize: '100% 25%' }}>
                {rows.map(row => <Box key={row.codigo || 'nao-informado'} sx={{ height: '100%', minWidth: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Tooltip title={`${row.rotulo}: ${numero(row.quantidade)} oportunidades (${numero(row.percentual)}%)`} describeChild>
                    <Box tabIndex={0} role="img" aria-label={`${row.rotulo}: ${numero(row.quantidade)} oportunidades, ${numero(row.percentual)}% das perdas`} sx={{ position: 'relative', height: (row.quantidade / limiteEscala) * 100 + '%', width: '100%', maxWidth: 72, bgcolor: '#ff5805', borderRadius: '8px 8px 0 0', '&:hover, &:focus-visible': { bgcolor: '#e94f00' }, '&:focus-visible': { outline: '2px solid #204661', outlineOffset: 3 } }}>
                      <Typography aria-hidden="true" sx={{ position: 'absolute', bottom: 'calc(100% + 6px)', width: '100%', textAlign: 'center', color: '#204661', fontSize: { xs: 11, md: 16 }, fontWeight: 700 }}>{numero(row.quantidade)}</Typography>
                    </Box>
                  </Tooltip>
                </Box>)}
              </Box>
              <Box />
              <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`, columnGap: { xs: 0.75, md: 2 }, px: { xs: 0.5, md: 2 }, mt: 1.5 }}>
                {rows.map((row, index) => <Typography key={row.codigo || 'nao-informado'} sx={{ fontSize: 11, lineHeight: 1.5, textAlign: 'center', color: '#64748b', overflowWrap: 'anywhere' }}><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{row.rotulo}</Box><Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{index + 1}</Box></Typography>)}
              </Box>
            </Box>
            <Box component="figcaption" sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9' }}>
              <Box component="ul" aria-label="Distribuição das oportunidades perdidas por motivo" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 1.5, listStyle: 'none', m: 0, p: 0 }}>
                {rows.map((row, index) => <Box component="li" key={row.codigo || 'nao-informado'} sx={{ minWidth: 0, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Box component="span" sx={{ flexShrink: 0, width: 22, height: 22, display: 'grid', placeItems: 'center', borderRadius: '6px', bgcolor: '#fff0e8', color: '#c2410c', fontSize: 11, fontWeight: 600 }}>{index + 1}</Box>
                  <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 12, color: '#334155', overflowWrap: 'anywhere' }}>{row.rotulo}</Typography><Typography sx={{ mt: 0.25, fontSize: 12, color: '#64748b' }}><Box component="span" sx={{ color: '#204661', fontWeight: 600 }}>{numero(row.quantidade)}</Box> · {numero(row.percentual)}%</Typography></Box>
                </Box>)}
              </Box>
            </Box>
          </Box>        )}
      </>}
    </Paper>
  );
}
