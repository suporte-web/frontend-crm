export type StatusInformativo = "ATIVO" | "DESCADASTRADO";

export type InformativoAssinante = {
  id: string;
  nome: string;
  email: string;
  status: StatusInformativo;
  origem: string;
  aceitePrivacidade: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type ListagemInformativo = {
  assinantes: InformativoAssinante[];
  totais: { total: number; ativos: number; descadastrados: number };
};
