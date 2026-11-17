import { Api } from '@/utils/Api';

export type ConsultorEmpresa = {
  id: string; name: string; email: string; isActive: boolean;
  role: string; roles: string[]; empresaConsultoraId: string | null;
};
export type EmpresaConsultora = {
  id: string; nome: string; cnpj: string | null; ativa: boolean;
  usuarios: ConsultorEmpresa[]; _count: { cadastros: number };
};
export type CadastroCarteira = {
  id: string; companyName: string | null; modalidadeCadastro: 'CLIENTE' | 'LEAD';
  empresaConsultoraId: string | null; responsavelId: string | null;
  responsavel: { id: string; name: string } | null;
};
const rota = '/empresas-consultoras';
export async function listarEmpresasConsultoras() { return (await Api.get<EmpresaConsultora[]>(rota)).data; }
export async function listarConsultoresEmpresas() { return (await Api.get<ConsultorEmpresa[]>(`${rota}/usuarios`)).data; }
export async function criarEmpresaConsultora(dados: { nome: string; cnpj: string | null }) { return (await Api.post<EmpresaConsultora>(rota, dados)).data; }
export async function atualizarEmpresaConsultora(id: string, dados: { nome?: string; cnpj?: string | null; ativa?: boolean }) { return (await Api.patch<EmpresaConsultora>(`${rota}/${id}`, dados)).data; }
export async function vincularConsultorEmpresa(id: string, usuarioId: string, vincular: boolean) { return (await Api.patch(`${rota}/${id}/usuarios/${usuarioId}`, { vincular })).data; }
export async function listarCarteiraEmpresa(id: string) { return (await Api.get<CadastroCarteira[]>(`${rota}/${id}/carteira`)).data; }
export async function vincularCarteiraEmpresa(id: string, cadastroIds: string[], aplicar = false) {
  return (await Api.post<{ aplicado: boolean; quantidade: number; cadastroIds: string[] }>(`${rota}/${id}/carteira`, { cadastroIds, aplicar })).data;
}
export async function transferirCadastroEmpresa(cadastroId: string, empresaConsultoraId: string | null) {
  return (await Api.patch(`${rota}/cadastros/${cadastroId}/empresa`, { empresaConsultoraId })).data;
}
