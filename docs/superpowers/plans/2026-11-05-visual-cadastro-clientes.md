# Modernização visual do cadastro de clientes

Especificação: solicitação da usuária de 05/11/2026. Somente frontend; preservar campos, ações, permissões, endpoints e alterações locais.
Abordagem: reutilizar os componentes existentes; cabeçalho compacto com avatar 54 px e resumo em faixa; cadastro com grupos separados por linhas leves; abas com indicador discreto; formulário compartilhado com modo compacto opcional aplicado somente ao diálogo de edição. Nenhum novo componente paralelo ou mudança nas regras.

- [x] Inspecionar os cinco componentes indicados e o ClientForm realmente renderizado pelo diálogo.
- [x] Guardar cópia exata das versões locais antes das alterações.
- [x] Ajustar apresentação do cabeçalho, cadastro, abas, diálogo e espaçamento da página.
- [x] Conferir campos, eventos e permissões contra a versão anterior.
- [x] Verificar disposição em telas larga e estreita.
- [x] Executar TypeScript, testes de regressão de CNPJ e build Next.js.

Arquivos: src/app/clientes/[id]/components/PaginaDetalhesCliente.tsx, src/app/clientes/[id]/components/detalhes-cliente/CabecalhoDetalhesCliente.tsx, src/app/clientes/[id]/components/detalhes-cliente/AbaCadastroCliente.tsx, src/app/clientes/[id]/components/detalhes-cliente/AbasDetalhesCliente.tsx, src/components/cadastros/editar-cadastro-dialog.tsx, src/components/clientes/client-form.tsx.
Backup anterior: C:\Users\caroline.augusto\Desktop\repositório\frontend-crm\.temp\visual-clientes-antes.
