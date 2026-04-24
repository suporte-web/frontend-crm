export type DeliveryStatus = 'Entregue' | 'Pendente' | 'Em atraso';

export type DeliveryRow = {
  cgc_pag: string;
  data_ref: string;
  seq_ctrc: string;
  ser_ctrc: string;
  nro_ctrc: string;
  seq_manifesto: string | null;
  data_entrega: string | null;
  hora_entrega: string | null;
  data_prev_ent: string | null;
  nome_cli_dest: string;
  data_ult_ocor: string | null;
  ult_ocor: string | null;
  sigla_fil_emit: string;
  ocorrencia: string;
  cidade_origem: string;
  cidade_dest: string;
  uf_dest: string;
  status_entrega: DeliveryStatus;
  em_atraso: 'Sim' | 'Nao';
  sla_entrega: 'DENTRO DO SLA' | 'FORA DO SLA' | '-';
  classificacao_rota: string;
};

export type DeliverySummary = {
  totalPedidos: number;
  entregues: number;
  pendentes: number;
  emAtraso: number;
  entregueDentroDoSla: number;
  entregueForaDoSla: number;
  porcentagemEntrega: number;
};

export type DeliveryFilters = {
  dataRef: string;
  ufDest: string;
  nroCtrc: string;
  statusEntrega: string;
  classificacaoRota: string;
};
