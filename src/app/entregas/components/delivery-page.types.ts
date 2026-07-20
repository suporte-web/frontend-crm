import type { DeliveryRow } from "@/types/deliveries";

export type SortField =
  | "nro_ctrc"
  | "cgc_pag"
  | "nome_cli_dest"
  | "cidade_origem"
  | "cidade_dest"
  | "uf_dest"
  | "data_prev_ent"
  | "data_entrega"
  | "status_entrega"
  | "sla_entrega"
  | "classificacao_rota";

export type QuickFilter =
  | "all"
  | "entregues"
  | "pendentes"
  | "atraso"
  | "slaDentro"
  | "slaFora"
  | "abertas";

export type DeliveryTableColumn = {
  field: keyof DeliveryRow | "em_atraso";
  label: string;
  sortable?: boolean;
  minWidth?: number;
};

export const DELIVERY_TABLE_COLUMNS: DeliveryTableColumn[] = [
  { field: "nro_ctrc", label: "No. CTRC", sortable: true, minWidth: 110 },
  { field: "ser_ctrc", label: "Serie", minWidth: 86 },
  { field: "cgc_pag", label: "CNPJ pagador", sortable: true, minWidth: 170 },
  { field: "nome_cli_dest", label: "Cliente destino", sortable: true, minWidth: 230 },
  { field: "cidade_origem", label: "Origem", sortable: true, minWidth: 140 },
  { field: "cidade_dest", label: "Destino", sortable: true, minWidth: 140 },
  { field: "uf_dest", label: "UF", sortable: true, minWidth: 72 },
  { field: "data_prev_ent", label: "Prev. entrega", sortable: true, minWidth: 140 },
  { field: "data_entrega", label: "Data entrega", sortable: true, minWidth: 140 },
  { field: "hora_entrega", label: "Hora entrega", minWidth: 130 },
  { field: "ult_ocor", label: "Ult. ocorrencia", minWidth: 140 },
  { field: "ocorrencia", label: "Descricao ocorrencia", minWidth: 280 },
  { field: "classificacao_rota", label: "Classificacao", sortable: true, minWidth: 150 },
  { field: "status_entrega", label: "Status", sortable: true, minWidth: 135 },
  { field: "em_atraso", label: "Em atraso", minWidth: 120 },
  { field: "sla_entrega", label: "SLA", sortable: true, minWidth: 150 },
];
