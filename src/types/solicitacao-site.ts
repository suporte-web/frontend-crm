export type TipoSolicitacaoSite =
  | 'COTACAO'
  | 'AGREGADO'
  | 'FALE_CONOSCO';

export type StatusSolicitacaoSite =
  | 'NOVO'
  | 'EM_ATENDIMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'REPROVADO';

export interface SolicitacaoSite {
  etapaCotacao?: EtapaCotacaoSite | null;
  leadId?: string | null;
  cadastroId?: string | null;
  oportunidadeId?: string | null;
  motivoReprovacao?: string | null;
  prospectId?: string | null;
  clientId?: string | null;
  responsavel?: {id:string;name:string} | null;
  lead?: {id:string;timeline?:CotacaoSiteHistorico[]} | null;
  id: string;

  tipo: TipoSolicitacaoSite;
  departamento?: string | null;

  status: StatusSolicitacaoSite;
  origem: string;

  nome: string;
  email: string;
  telefone?: string | null;
  cargo?: string | null;

  empresa?: string | null;
  cnpj?: string | null;

  solucao?: string | null;

  cidade?: string | null;
  categoriaCnh?: string | null;
  possuiMopp?: boolean | null;
  possuiEar?: boolean | null;
  marcaVeiculo?: string | null;
  anoVeiculo?: number | null;

  assunto?: string | null;
  mensagem?: string | null;

  aceitePrivacidade?: boolean;
  aceiteComunicacoes?: boolean;

  responsavelId?: string | null;
  observacaoInterna?: string | null;
  anexos?: AnexoSolicitacaoSite[];

  criadoEm: string;
  atualizadoEm: string;
 
}

export interface AnexoSolicitacaoSite {
  id: string;
  solicitacaoId: string;
  nomeArquivo: string;
  nomeArquivoOriginal: string;
  tipoArquivo?: string | null;
  tamanho?: number | null;
  url: string;
  criadoEm: string;
  anexo?: AnexoSolicitacaoSite[];
}

export interface ListarSolicitacoesSiteResponse {
  sucesso: boolean;
  total: number;
  solicitacoes: SolicitacaoSite[];
}

export interface BuscarSolicitacaoSiteResponse {
  sucesso: boolean;
  solicitacao: SolicitacaoSite;
}

export interface ListarSolicitacoesSiteFiltros {
  tipo?: TipoSolicitacaoSite;
  excluirTipo?: TipoSolicitacaoSite;
  status?: StatusSolicitacaoSite;
  departamento?: string;
  busca?: string;
}

export type EtapaCotacaoSite = 'LEAD' | 'OPORTUNIDADE' | 'REPROVADO' | 'PROSPECT' | 'CLIENTE';
export type CotacaoSiteHistorico = {id:string;title:string;description:string;createdAt:string;createdBy?:{id:string;name:string}|null;metadata?:Record<string,unknown>|null};
export type AtualizarCotacaoSitePayload = {nome?:string;empresa?:string;email?:string;telefone?:string;cnpj?:string;cidade?:string;solucao?:string;observacaoInterna?:string};
