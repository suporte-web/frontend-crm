# Melhoria visual do cadastro de clientes — 05/11/2026

## Resultado

Implementação somente no frontend organizado em C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm. Interface branca, textos neutros, bordas discretas, ausência de sombras nos painéis e destaque laranja #ff5805 para a ação principal. Os componentes existentes foram reutilizados.

## Componentes alterados

- [src/app/clientes/[id]/components/PaginaDetalhesCliente.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/PaginaDetalhesCliente.tsx): Menor espaçamento vertical entre cabeçalho, abas e conteúdo, sem modificar a orquestração da página.

- [src/app/clientes/[id]/components/detalhes-cliente/CabecalhoDetalhesCliente.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/detalhes-cliente/CabecalhoDetalhesCliente.tsx): Avatar de 54 px, nome/documento/modalidade/status compactos, resumo em faixa responsiva, Voltar discreto e Editar como ação principal. Mantidos os cinco indicadores, identificação da consultora, menu de exclusão e condições de permissão.

- [src/app/clientes/[id]/components/detalhes-cliente/AbaCadastroCliente.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/detalhes-cliente/AbaCadastroCliente.tsx): Superfícies internas substituídas por separadores leves. Grupos de identificação, fiscal, comercial, endereço e observações preservados; títulos menores e grade responsiva. Mesmos campos, opções, condições fiscais, valores vazios e edição.

- [src/app/clientes/[id]/components/detalhes-cliente/AbasDetalhesCliente.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/app/clientes/[id]/components/detalhes-cliente/AbasDetalhesCliente.tsx): Abas menores sem ícones decorativos, indicador discreto, rolagem no celular e acesso às oportunidades ao lado das abas quando há espaço. Mantidos os valores das abas e o endereço do link.

- [src/components/cadastros/editar-cadastro-dialog.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/components/cadastros/editar-cadastro-dialog.tsx): Diálogo com fundo branco, raio de 12 px, título e espaçamentos menores; campos com raio de 8 px. Mesmas funções de carregamento, CNPJ, validação, salvamento, cancelamento, contatos, documentos, modalidade e dados comerciais.

- [src/components/clientes/client-form.tsx](C:/Users/caroline.augusto/Desktop/repositório/Pizzattolog-CRM/frontend-crm/src/components/clientes/client-form.tsx): Modo compacto opcional reutiliza o formulário existente no diálogo: seções planas, ícones reduzidos, consulta de CNPJ como ação secundária, botões identificados e campos size="small" preservados. Demais usos mantêm compacto=false por padrão.

## Preservação de comportamento

As alterações foram comparadas às cópias exatas dos seis arquivos antes desta tarefa, incluindo as mudanças locais anteriores de CNPJ e motivos de perda. Não foram alterados serviços, endpoints, permissões, regras de consultoras/Leads/Prospects/Clientes ou mecanismos de salvar/cancelar. Os conteúdos de histórico, contatos, anexos e condições comerciais permanecem acessíveis pelas abas existentes.

Nenhum arquivo do backend, Prisma ou banco foi alterado nesta melhoria visual. Nenhum comando de Git reset, stash ou commit foi executado. As cópias anteriores estão em C:/Users/caroline.augusto/Desktop/repositório/frontend-crm/.temp/visual-clientes-antes.

## Verificações realizadas

- npx tsc --noEmit: concluído sem erros.
- npm run build: build Next.js concluído, incluindo a geração das páginas.
- node scripts/cnpj-lookup.test.cjs: 8 testes aprovados, cobrindo preservação de preenchimento manual, estado de carregamento, bloqueio de consultas duplicadas e erros com preenchimento manual disponível.
- git diff --check nos seis arquivos: sem problemas de whitespace.
- Revisão independente, somente leitura, dos arquivos em relação aos backups: sem achados de regressão; TypeScript também validado sem cache incremental.
- Conferência visual com os componentes reais renderizados localmente e dados fictícios apenas em arquivos temporários, em larguras de 390 e 1440 px. Cenários: detalhes preenchidos, campos vazios e formulário de edição. Sem transbordamento horizontal do documento nessas larguras.
- No exemplo comparado de desktop, o cabeçalho passou de 355 para 188 px; o avatar passou de 86 para 54 px. A altura se adapta ao nome e aos dados do cadastro.

A prévia visual foi isolada: não foram enviados cadastros ou efetuadas consultas às APIs/banco. Ela confirma disposição e estilos; não equivale a um teste de salvamento com persistência. As funções e validações existentes foram preservadas e os testes de regressão de CNPJ passaram.

## Como conferir no CRM

Atualizar uma página de detalhes em /cadastros/:id ou /clientes/:id. Conferir o resumo, abrir cada aba e selecionar Editar com um perfil já autorizado. No diálogo, verificar campos, consulta CNPJ, contatos, documentos e os botões Salvar alterações/Cancelar. Em largura pequena, os grupos e campos se reorganizam sem cortar os textos; as abas continuam roláveis.
