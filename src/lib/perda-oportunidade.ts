export type MotivoPerda = {
  codigo: string;
  rotulo: string;
  exigeObservacao: boolean;
};
export type PerdaOportunidade = {
  lostReason?: string | null;
  motivoPerda?: string | null;
  observacaoPerda?: string | null;
};

export function validarPerda(
  catalog: readonly MotivoPerda[],
  codigo: string,
  notes: string,
) {
  const reason = catalog.find((item) => item.codigo === codigo);
  if (!reason) return "Selecione um motivo da perda válido.";
  if (reason.exigeObservacao && !notes.trim())
    return reason.codigo === "LIMITACAO_OPERACIONAL"
      ? "Descreva a limitação operacional identificada."
      : "Descreva o outro motivo da perda.";
  if (notes.length > 2000)
    return "As observações da perda devem ter no máximo 2000 caracteres.";
  return "";
}
export function rotuloPerda(opportunity: PerdaOportunidade) {
  if (opportunity.motivoPerda === "OUTRO" && opportunity.observacaoPerda?.trim())
    return opportunity.observacaoPerda.trim();
  return opportunity.motivoPerda
    ? opportunity.lostReason || "Motivo não informado"
    : "Motivo não informado";
}
function limite(value?: string) {
  if (!value) return null;
  const date = new Date(value + "T00:00:00-03:00");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new Error("Período de oportunidades inválido.");
  return date.getTime();
}
/** Dados do endpoint autenticado existente, uma ocorrência por oportunidade. */
export function analisarPerdas(
  opportunities: (PerdaOportunidade & {
    id: string;
    status: string;
    createdAt: string;
  })[],
  catalog: readonly MotivoPerda[],
  filters: { de?: string; ate?: string } = {},
) {
  const start = limite(filters.de),
    end = limite(filters.ate);
  if (start !== null && end !== null && start > end)
    throw new Error("Período de oportunidades inválido.");
  const records = Array.from(
    new Map(opportunities.map((row) => [row.id, row])).values(),
  ).filter((row) => {
    const time = new Date(row.createdAt).getTime();
    return (
      (start === null && end === null) ||
      (Number.isFinite(time) &&
        (start === null || time >= start) &&
        (end === null || time < end + 86400000))
    );
  });
  const lost = records.filter((row) => row.status === "LOST");
  const closed = records.filter(
    (row) => row.status === "LOST" || row.status === "WON",
  ).length;
  const counts = new Map<string | null, number>();
  for (const row of lost) {
    const codigo = catalog.some((reason) => reason.codigo === row.motivoPerda)
      ? row.motivoPerda!
      : null;
    counts.set(codigo, (counts.get(codigo) || 0) + 1);
  }
  const categories: { codigo: string | null; rotulo: string }[] = [...catalog];
  if (counts.has(null))
    categories.push({ codigo: null, rotulo: "Motivo não informado" });
  const motivos = categories.map((reason) => ({
    ...reason,
    quantidade: counts.get(reason.codigo) || 0,
    percentual: lost.length
      ? ((counts.get(reason.codigo) || 0) / lost.length) * 100
      : 0,
  }));
  const principal =
    [...motivos]
      .sort((a, b) => b.quantidade - a.quantidade)
      .find((row) => row.quantidade > 0)?.rotulo || "Sem perdas";
  return {
    total: lost.length,
    encerradas: closed,
    taxa: closed ? (lost.length / closed) * 100 : 0,
    principal,
    motivos,
  };
}
