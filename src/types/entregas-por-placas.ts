export type EntregaPorPlaca = {
  cgc_pag: string | null;
  data_ref: string | null;
  seq_ctrc: string | number | null;
  ser_ctrc: string | number | null;
  nro_ctrc: string | number | null;
  seq_manifesto: string | number | null;
  data_entrega: string | null;
  hora_entrega: string | null;
  data_prev_ent: string | null;
  nome_cli_dest: string | null;
  data_ult_ocor: string | null;
  ult_ocor: string | number | null;
  sigla_fil_emit: string | null;
  ocorrencia: string | null;
  cidade_origem: string | null;
  cidade_dest: string | null;
  uf_dest: string | null;
  placa_cavalo: string | null;
  placa_carreta: string | null;
  placa_carreta2: string | null;
  nome_motorista: string | null;
};

export type EntregasPorPlacaResponse = {
  success: boolean;
  placa: string;
  total: number;
  data: EntregaPorPlaca[];
};

export type StatusEntrega =
  | "Entregue"
  | "Em atraso"
  | "Pendente";

export type MonitoramentoEntregasPorPlacasRow = {
  romaneio: string | null;
  seq_manifesto: string | number | null;
  ser_manifesto: string | null;
  nro_manifesto: string | number | null;
  data_inclusao: string | null;
  hora_inclusao: string | null;
  placa_cavalo: string | null;
  placa_carreta: string | null;
  placa_carreta2: string | null;
  marca: string | null;
  modelo: string | null;
  nome_motorista: string | null;
  data_monitoramento: string | null;
  qtd_ctrcs: number;
  entregues: number;
  faltam: number;
  em_atraso: number;
  rotas: string | null;
  ultima_ocorrencia: string | null;
  data_ultima_ocorrencia: string | null;
  percentual_entregue: number | string;
  status_rota: "Finalizada" | "Em andamento" | "Aguardando ocorrencia";
};

export type MonitoramentoEntregasPorPlacasResumo = {
  qtdRotas: number;
  qtdCtrcs: number;
  entregues: number;
  faltam: number;
  emAtraso: number;
  percentualEntregue: number;
};

export type MonitoramentoEntregasPorPlacasResponse = {
  success: boolean;
  data?: string;
  filtros: {
    placa?: string;
    motorista?: string;
  };
  resumo: MonitoramentoEntregasPorPlacasResumo;
  dataRows: MonitoramentoEntregasPorPlacasRow[];
};

export type MonitoramentoEntregasPorPlacasFilters = {
  data?: string;
  placa?: string;
  motorista?: string;
};

export type StatusRotaManifestoSsw =
  | "FINALIZADA"
  | "EM_ANDAMENTO"
  | "SEM_DADOS";

export type StatusEntregaManifestoSsw =
  | "FINALIZADO"
  | "PENDENTE"
  | "NAO_ENCONTRADO";

export type EntregaManifestoSsw = {
  ctrc_ssw: string;
  seq_ctrc: number | null;

  remetente: string | null;
  destinatario: string | null;

  uf_dest: string | null;
  cidade_dest: string | null;

  codigo_ocorrencia: number | null;
  ocorrencia: string | null;

  data_ult_ocor: string | null;
  hora_ult_ocor: string | null;

  tp_entrega: string | null;

  status: StatusEntregaManifestoSsw;
};

export type ManifestoMonitoramentoSsw = {
  manifesto: string;

  placa: string;
  placaCarreta: string | null;

  motorista: string | null;

  dataEmissao: string | null;

  total: number;
  encontrados: number;
  entregues: number;
  pendentes: number;
  naoEncontrados: number;

  percentualEntregue: number;

  statusRota: StatusRotaManifestoSsw;
};

export type ListaManifestosSswResponse = {
  sucesso: boolean;
  data: string | null;
  total: number;
  manifestos: ManifestoMonitoramentoSsw[];
};

export type DetalheManifestoSsw =
  ManifestoMonitoramentoSsw & {
    entregas: EntregaManifestoSsw[];
  };

export type DetalheManifestoSswResponse = {
  sucesso: boolean;
  manifesto: DetalheManifestoSsw;
};