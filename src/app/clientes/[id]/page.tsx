import PaginaDetalhesCliente from '@/app/clientes/[id]/components/PaginaDetalhesCliente';

export default function PaginaCadastro({ params }: { params: Promise<{ id: string }> }) {
  return <PaginaDetalhesCliente params={params} />;
}
