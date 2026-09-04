import type { EntregaPorPlaca, StatusEntrega } from "@/types/entregas-por-placas";

export function normalizarPlaca(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function placaValida(value: string): boolean {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(value);
}

export function formatarData(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export function obterStatusEntrega(entrega: EntregaPorPlaca): StatusEntrega {
  if (entrega.data_entrega) {
    return "Entregue";
  }

  if (entrega.data_prev_ent) {
    const dataPrevista = new Date(entrega.data_prev_ent);
    const hoje = new Date();

    dataPrevista.setHours(23, 59, 59, 999);

    if (dataPrevista < hoje) {
      return "Em atraso";
    }
  }

  return "Pendente";
}

export function formatarDestino(entrega: EntregaPorPlaca): string {
  if (!entrega.cidade_dest) {
    return "-";
  }

  return `${entrega.cidade_dest}${entrega.uf_dest ? `/${entrega.uf_dest}` : ""}`;
}

export function formatarTexto(value: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export function criarChaveEntrega(entrega: EntregaPorPlaca, index: number) {
  return [
    entrega.seq_ctrc,
    entrega.ser_ctrc,
    entrega.nro_ctrc,
    entrega.seq_manifesto,
    index,
  ].join("-");
}
