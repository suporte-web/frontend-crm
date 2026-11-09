# Padronização das abas de clientes — 05/11/2026

## Mudanças

Contatos, condições comerciais, documentos, histórico e modalidade seguem o padrão mais limpo do Cadastro: fundo branco, títulos menores, bordas discretas, menos textos explicativos, espaçamento consistente e ações identificadas. Apenas textos repetidos ou decorativos foram retirados; dados preenchidos e instruções de validação continuam disponíveis.

- [src/app/clientes/[id]/components/detalhes-cliente/AbaContatosCliente.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/detalhes-cliente/AbaContatosCliente.tsx): Título e contagem objetivos; dados dos contatos sem minicards decorativos. Mantidos contato principal, cargo, e-mail, telefone, WhatsApp, LinkedIn, observações e ações de criar/editar/excluir.

- [src/app/clientes/[id]/components/detalhes-cliente/AbaCondicoesComerciaisCliente.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/detalhes-cliente/AbaCondicoesComerciaisCliente.tsx): Condições de pagamento, faturamento, bancos e observações organizados com separadores laranja e títulos menores. Formas de pagamento e múltiplas contas mantidas. Formulário e validações permanecem iguais.

- [src/app/clientes/[id]/components/detalhes-cliente/AbaDocumentosCliente.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/detalhes-cliente/AbaDocumentosCliente.tsx): Cabeçalho único, envio de arquivos direto e apresentação mais neutra. Mantidos arquivos, descrições, datas, seleção múltipla, remoção de selecionados, visualização e exclusão autorizada.

- [src/app/clientes/[id]/components/PaginaDetalhesCliente.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/PaginaDetalhesCliente.tsx): Histórico usa um único cabeçalho compacto, preservando o despacho das abas e as condições de permissão.

- [src/components/crm/timeline-section.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/components/crm/timeline-section.tsx): Modo compacto opcional, linha vertical discreta, autoria legível, quebras de linha preservadas e estado vazio objetivo. Nenhum registro é removido; ordenação e paginação de cinco itens continuam iguais.

- [src/components/cadastros/modalidade-cadastro.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/components/cadastros/modalidade-cadastro.tsx): Estado atual, seleção e botão de salvar sem ícone grande ou painel interno redundante. Mantidas as regras de edição, documento opcional, mensagens de erro e modo somente leitura.

- [src/app/clientes/[id]/components/detalhes-cliente/detalhes-cliente-compartilhado.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/detalhes-cliente/detalhes-cliente-compartilhado.tsx): Helpers existentes receberam modo compacto opcional para títulos, listas e informações de contato. O padrão continua false, preservando os outros usos.

- [src/app/clientes/[id]/components/detalhes-cliente/estilos-abas-cliente.ts](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/detalhes-cliente/estilos-abas-cliente.ts): Novo estilo cadastral uniforme, com campos pequenos, raio de 8 px, fundo branco e fontes neutras. O estilo anterior de oportunidades não foi modificado.

## Preservação

Os oito arquivos foram comparados a cópias exatas das versões locais antes desta tarefa. As alterações anteriores de CNPJ, anexos, motivos de perda e cadastro foram preservadas. A revisão independente não encontrou regressões em dados, callbacks, permissões, valores ReactNode das informações comerciais, paginação ou autoria.

Somente frontend foi alterado. Nenhuma alteração em backend, banco, Prisma, endpoints, permissões ou fluxo Lead → Prospect → Cliente. Nenhum reset, stash ou commit foi executado. Backups: C:/Users/caroline.augusto/Desktop/repositório/frontend-crm/.temp/abas-clientes-padrao-antes.

## Verificações

- npx tsc --noEmit: sem erros.
- npm run build: concluído.
- Regressões: 8 testes de consulta de CNPJ, 4 de anexos de oportunidade e 6 de motivos de perda aprovados (18 no total).
- Conferência visual local em 390 e 1440 px: 22 cenários, com contatos/edição/vazio, condições comerciais/edição, documentos/consulta, histórico/vazio e modalidade/consulta. Nenhum transbordamento horizontal do documento.
- O envio/visualização de documentos e as operações de salvar/excluir não foram executados nos dados reais. As prévias usaram componentes reais com dados fictícios somente em arquivos temporários, sem acesso a APIs ou ao banco.

## Como conferir

Atualizar a página de detalhes de um cadastro e abrir cada uma das cinco abas. Com o perfil autorizado, conferir os formulários e ações existentes; com perfil de consulta, verificar que os controles de alteração permanecem indisponíveis. Em tela estreita, os grupos e campos se reorganizam; textos longos e registros completos continuam acessíveis.
