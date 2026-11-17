import { useParams } from 'react-router-dom';
import PaginaDetalhePropostaCliente from '@/pages/clientes/detalhes/propostas/detalhes/components/PaginaDetalhePropostaCliente';
export default function DetalheProposta() {
  const { id = '', propostaId = '' } = useParams<'id' | 'propostaId'>();
  return <PaginaDetalhePropostaCliente clientIdParam={id} proposalIdParam={propostaId} />;
}
