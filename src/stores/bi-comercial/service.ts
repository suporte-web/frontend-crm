import { Api } from '@/utils/Api';
import { normalizarOportunidadesBi, type CadastroBi, type OportunidadeFonteBi } from '@/lib/bi-comercial';
import type { ResponsavelComercial } from '@/stores/cadastros/service';

type RespostaBi = {
  cadastros: CadastroBi[];
  oportunidades: OportunidadeFonteBi[] | null;
  responsaveis: ResponsavelComercial[];
  responsavelFixo: boolean;
  responsavelId: string | null;
  avisos: string[];
};

export async function carregarBiComercial(token: string, responsavelId = '', signal?: AbortSignal) {
  const params = responsavelId === 'sem-responsavel' ? { semResponsavel: 'true' } : responsavelId ? { responsavelId } : {};
  const { data } = await Api.get<RespostaBi>('/bi-comercial', { params, signal, headers: { Authorization: `Bearer ${token}` } });
  return { ...data, oportunidades: data.oportunidades === null ? null : normalizarOportunidadesBi(data.oportunidades) };
}
