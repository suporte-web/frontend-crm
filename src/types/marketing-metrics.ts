export type MetricsFilter = {
  periodo: "7" | "30" | "90" | "personalizado";
  inicio?: string;
  fim?: string;
};
export type MarketingSummary = {
  periodo: { inicio: string; fim: string };
  totais: {
    usuarios: number;
    sessoes: number;
    visualizacoes: number;
    novosUsuarios: number;
    conversoes: number;
    eventos: number;
  };
  acessos: {
    data: string;
    usuarios: number;
    sessoes: number;
    visualizacoes: number;
  }[];
  fusoHorario: string | null;
  dadosLimitados: boolean;
};
export type MarketingTraffic = {
  origem: string;
  canal: string;
  sessoes: number;
  usuarios: number;
};
export type MarketingPage = {
  pagina: string;
  titulo: string;
  visualizacoes: number;
  usuarios: number;
};
export type MarketingEvent = {
  evento: string;
  quantidade: number;
  conversoes: number;
};
export type MarketingMetrics = {
  resumo: MarketingSummary;
  trafego: MarketingTraffic[];
  paginas: MarketingPage[];
  eventos: MarketingEvent[];
};
