export const rotulosStatusSac = {
  NOVO: "Novo",
  ATRIBUIDO: "Atribuído",
  EM_ATENDIMENTO: "Em atendimento",
  CLASSIFICADO: "Classificado",
  AGUARDANDO_ACAO: "Aguardando ação",
  EM_TRATATIVA: "Em tratativa",
  AGUARDANDO_AVALIACAO: "Aguardando avaliação",
  CONCLUIDO: "Concluído",
  REABERTO: "Reaberto",
} as const;
export type StatusSac = keyof typeof rotulosStatusSac;
export type PessoaSac = { id: string; name: string; role: string; roles?: string[] };
export type AnexoSac = {
  id: string;
  nome: string;
  tipo: string;
  tamanho?: number;
  comentario?: string | null;
  etapa: string;
  criadoEm: string;
  usuario?: PessoaSac | null;
  tarefaId?: string | null;
};
export type TarefaSac = {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  responsavel?: PessoaSac | null;
  criador?: PessoaSac | null;
  criadoEm: string;
  prazo?: string | null;
  iniciadoEm?: string | null;
  concluidoEm?: string | null;
  observacao?: string | null;
};
export type EventoSac = {
  id: string;
  tipo: string;
  descricao: string;
  criadoEm: string;
  usuario?: PessoaSac | null;
  statusAnterior?: StatusSac | null;
  statusNovo?: StatusSac | null;
  tarefaId?: string | null;
  dados?: Record<string, unknown> | null;
};
export type AtendimentoSac = {
  visita?: { id: string; protocolo: string } | null;
  id: string;
  protocolo: string;
  tipo: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  empresa?: string | null;
  cidade?: string | null;
  estado?: string | null;
  status: StatusSac;
  atendenteId?: string | null;
  atendente?: PessoaSac | null;
  responsavelAcaoId?: string | null;
  responsavelAcao?: PessoaSac | null;
  area?: string | null;
  tipoReclamacao?: string | null;
  documento?: string | null;
  motivo?: string | null;
  prazo?: string | null;
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm?: string | null;
  concluidoPor?: PessoaSac | null;
  observacoesClassificacao?: string | null;
  relatoOriginal: Record<string, unknown>;
  planoAcao?: Record<string, string> | null;
  rnc?: Record<string, string | boolean> | null;
  anexos: AnexoSac[];
  tarefas: TarefaSac[];
  historico: EventoSac[];
};
export type AcaoSac = Pick<
  AtendimentoSac,
  | "id"
  | "protocolo"
  | "status"
  | "area"
  | "motivo"
  | "documento"
  | "prazo"
  | "planoAcao"
  | "anexos"
>;
export type MinhaTarefaSac = Pick<
  TarefaSac,
  | "id"
  | "titulo"
  | "status"
  | "prazo"
  | "criadoEm"
  | "iniciadoEm"
  | "concluidoEm"
  | "observacao"
> & {
  atendimento: Pick<
    AtendimentoSac,
    "id" | "protocolo" | "status" | "area" | "motivo" | "documento"
  >;
};
