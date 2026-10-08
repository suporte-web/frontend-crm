import type { AnexoSac, PessoaSac } from "./atendimento-sac.types";
export const rotulosStatusVisita = {
  AGENDADA: "Agendada",
  AGUARDANDO_REALIZACAO: "Aguardando realização",
  REAGENDAMENTO: "Reagendamento",
  AGUARDANDO_VALIDACAO: "Aguardando validação",
  POS_VISITA: "Pós-visita",
  ATENDIMENTO_SAC: "Atendimento SAC",
  CONCLUIDA: "Concluída",
} as const;
export type StatusVisita = keyof typeof rotulosStatusVisita;
export type EtapaVisita = "VISITA" | "REALIZAÇÃO" | "VALIDACAO" | "POS_VISITA";
export const rotulosEtapaVisita: Record<EtapaVisita, string> = {
  VISITA: "Visita",
  REALIZAÇÃO: "Realização",
  VALIDACAO: "Validação",
  POS_VISITA: "Pós-visita",
};
export const classificacoesVisita = {
  EXCELENTE: "Excelente",
  BOA: "Boa",
  REGULAR: "Regular",
  RUIM: "Ruim",
} as const;
export type ClassificacaoVisita = keyof typeof classificacoesVisita;
export type PessoaVisita = PessoaSac & { email?: string };
export type ParticipanteVisita = {
  id?: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  usuarioId?: string | null;
  comunicacaoStatus?: string;
};
export type EventoVisita = {
  id: string;
  tipo: string;
  descricao: string;
  observacao?: string | null;
  criadoEm: string;
  usuario?: PessoaVisita | null;
  statusAnterior?: StatusVisita | null;
  statusNovo?: StatusVisita | null;
  dados?: Record<string, unknown> | null;
};
export type Visita = {
  id: string;
  protocolo: string;
  clienteNome: string;
  cnpj?: string | null;
  localVisita: string;
  dataPrevista: string;
  dataRealizada?: string | null;
  responsavelId: string;
  responsavel: PessoaVisita;
  tipoVisita: string;
  observacoes?: string | null;
  status: StatusVisita;
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm?: string | null;
  relato?: string | null;
  insights?: string | null;
  pontosPositivos?: string | null;
  pontosAtencao?: string | null;
  pessoaAtendeu?: string | null;
  contatoPessoaAtendeu?: string | null;
  emailPessoaAtendeu?: string | null;
  teveCusto?: boolean | null;
  custo?: string | null;
  novaDataAceita?: boolean | null;
  atingiuObjetivo?: boolean | null;
  sentimentoCliente?: string | null;
  possuiMelhoria?: boolean | null;
  melhoriaIdentificada?: string | null;
  classificacao?: ClassificacaoVisita | null;
  avaliacaoRegistradaEm?: string | null;
  sacId?: string | null;
  sac?: { id: string; protocolo: string; status: string } | null;
  participantes: ParticipanteVisita[];
  anexos: AnexoSac[];
  historico: EventoVisita[];
  realizacoes: Array<{
    id: string;
    dataRealizada: string;
    criadoEm: string;
    usuario?: PessoaVisita;
    dados: Record<string, unknown>;
  }>;
  validacoes: Array<{
    id: string;
    decisao: "APROVAR" | "AJUSTAR" | "REAGENDAR";
    observacao?: string | null;
    criadoEm: string;
    gestor?: PessoaVisita;
  }>;
  reagendamentos: Array<{
    id: string;
    dataAnterior: string;
    novaData: string;
    motivo: string;
    observacoes?: string | null;
    criadoEm: string;
    usuario?: PessoaVisita;
  }>;
};
export type ListaVisitas = {
  itens: Visita[];
  total: number;
  pagina: number;
  porPagina: number;
  contagens: Partial<Record<StatusVisita, number>>;
};
export type OpcoesVisitas = {
  usuarios: PessoaVisita[];
  responsaveis: PessoaVisita[];
};
