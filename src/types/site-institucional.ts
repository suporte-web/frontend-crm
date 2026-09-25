// ======================================================
// TIPOS DO CONTEÚDO "QUEM SOMOS"
// ======================================================

export type ConteudoBanner = {
  titulo?: string;
  subtitulo?: string;
  imagemUrl?: string;
};

export type ConteudoTexto = {
  titulo?: string;
  texto?: string;
};

export type ConteudoTextoImagem = {
  titulo?: string;
  texto?: string;
  imagemUrl?: string;
};

export type ValorInstitucional = {
  titulo?: string;
  descricao?: string;
};

export type QuemSomosConteudo = {
  banner?: ConteudoBanner;

  historia?: ConteudoTextoImagem;

  missao?: ConteudoTexto;

  visao?: ConteudoTexto;

  valores?: ValorInstitucional[];

  unidades?: ConteudoTexto;
};


// ======================================================
// TIPO DA PÁGINA ADMINISTRADA PELO CRM
// ======================================================

export type PaginaSite<
  TConteudo = Record<string, unknown>,
> = {
  id: string;

  nome: string;

  slug: string;

  conteudoRascunho: TConteudo;

  conteudoPublicado: TConteudo | null;

  publicado: boolean;

  temAlteracoesNaoPublicadas: boolean;

  publicadoEm: string | null;

  createdAt: string;

  updatedAt: string;
};


// ======================================================
// TIPOS DO NOVO EDITOR GENÉRICO
// ======================================================

export type SiteFieldType =
  | 'text'
  | 'textarea'
  | 'image';

export type SiteFieldConfig = {
  /**
   * Caminho dentro do JSON.
   *
   * Exemplos:
   * banner.titulo
   * historia.texto
   * valores.0.titulo
   */
  path: string;

  label: string;

  type: SiteFieldType;

  placeholder?: string;

  helperText?: string;

  recommendedSize?: string;

  rows?: number;
};

export type SiteSectionConfig = {
  /**
   * Identificador interno da seção.
   */
  key: string;

  /**
   * Nome mostrado no CRM.
   */
  title: string;

  /**
   * Texto auxiliar da seção.
   */
  description?: string;

  fields: SiteFieldConfig[];
};

export type SitePageConfig = {
  slug: string;

  title: string;

  description?: string;

  sections: SiteSectionConfig[];
};
