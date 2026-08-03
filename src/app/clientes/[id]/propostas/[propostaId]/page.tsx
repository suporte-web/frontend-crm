import PaginaDetalhePropostaCliente from "./components/PaginaDetalhePropostaCliente";

export default async function DetalhePropostaClientePage({
  params,
}: {
  params: Promise<{ id: string; propostaId: string }>;
}) {
  const { id, propostaId } = await params;

  return (
    <PaginaDetalhePropostaCliente
      clientIdParam={id}
      proposalIdParam={propostaId}
    />
  );
}
