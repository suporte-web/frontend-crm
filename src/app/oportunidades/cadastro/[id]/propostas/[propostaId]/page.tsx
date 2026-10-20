import PaginaDetalhePropostaCliente from '@/app/clientes/[id]/propostas/[propostaId]/components/PaginaDetalhePropostaCliente';
export default async function DetalheProposta({ params }: { params: Promise<{ id: string; propostaId: string }> }) {
  const { id, propostaId } = await params;
  return <PaginaDetalhePropostaCliente clientIdParam={id} proposalIdParam={propostaId} />;
}
