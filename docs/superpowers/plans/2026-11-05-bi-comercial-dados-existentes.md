# BI Comercial — dados reais existentes

Objetivo: incluir os indicadores solicitados no padrão visual atual, sem alterar backend, banco, schema, migrations, endpoints ou permissões. Sem commits automáticos.

## Fontes e critérios

- Cadastros: GET /cadastros, com deduplicação por ID e recorte de período pela criação do cadastro.
- Acompanhamento: dados do Lead vinculado por ID; reutilizar listagens de Leads não convertidos e convertidos quando permitidas, com consultas existentes do cadastro como alternativa limitada a quatro requisições simultâneas. Não usar updatedAt como data de contato.
- Funil: somente os sete valores existentes e seus aliases legados conhecidos. Ausência ou valor desconhecido fica em Etapa não informada, sem inferir estágio pelo status da oportunidade.
- Segmentos: segmento real do cadastro; informar separadamente os cadastros sem segmento, sem inventar um valor.
- Oportunidades: GET /opportunities, uma chamada por atualização compartilhada entre os indicadores e a análise de perdas. Contagens por OPEN, WON e LOST; período pela criação da oportunidade.
- Propostas cadastradas: registros identificados pela marcação Tipo de proposta gravada pelo formulário Nova proposta, independentemente da etapa/status atual. Chamados não fazem parte deste novo fluxo.
- Perdas: usar o catálogo padronizado existente; não transportar observações livres para os dados agregados nem exibi-las no BI.
- Dados ausentes permanecem identificados como não informados; falhas de consulta não são apresentadas como zero.

## Etapas de execução

- [x] Escrever testes de deduplicação, etapas, segmentos, status, propostas, períodos e dados ausentes.
- [x] Ajustar funções de agregação e criar carregamento modular com consultas somente de leitura.
- [x] Integrar as métricas na página e no painel de perdas, reutilizando os componentes e estilos existentes.
- [x] Preservar filtros, acompanhamento, tempo sem contato, ausência de interação, valor mensal e participação de clientes.
- [x] Validar testes, TypeScript, build e revisão independente. Conferir por AST que os estilos existentes foram preservados.

## Arquivos desta alteração

- src/lib/bi-comercial.ts
- src/services/bi-comercial.service.ts
- src/app/bi-comercial/components/BiComercialPage.tsx
- src/app/bi-comercial/components/AnalisePerdasOportunidades.tsx
- scripts/bi-comercial-dados.test.cjs
- Este documento.

## Validação concluída

- 15 testes do BI e 6 testes de motivos de perda aprovados.
- npx tsc --noEmit aprovado.
- npm run build concluído com código 0.
- Comparação por AST: preservados os 69 estilos existentes da página e os 13 do painel de perdas. Novos blocos reutilizam o padrão atual.
- Conferência visual isolada em desktop e celular, incluindo base vazia, indisponibilidade e perfil restrito. Nenhum dado de demonstração foi inserido no produto.
- git diff --check dos arquivos modificados nesta tarefa aprovado. A conferência global apontou espaço em branco preexistente em src/config/site-institucional/site-page-config.ts:555, fora do escopo.
- Revisão independente sem achados no conjunto principal de alterações.

Nenhum backend, banco, Prisma, endpoint ou permissão foi alterado. Nenhum commit foi criado.

## Conferência local

Execute npm run dev na pasta frontend-crm organizada e abra /bi-comercial com uma conta autorizada. Confira os filtros de período, as sete etapas, os segmentos, as quatro contagens e os motivos padronizados. Os totais dependem exclusivamente dos registros permitidos pelas APIs existentes. As propostas são identificadas pela marcação persistida pelo formulário Nova proposta; registros sem essa identificação não são presumidos como propostas.

## Complemento visual solicitado

Referência enviada pelo usuário: indicadores de segmentos e propostas/oportunidades com gráficos no padrão visual atual.

- Novo componente: src/app/bi-comercial/components/IndicadoresSegmentosOportunidades.tsx.
- Página integrada: src/app/bi-comercial/components/BiComercialPage.tsx.
- Segmentos: barras horizontais em laranja, quantidade e percentual; ordenação por quantidade; sem agrupamento artificial de segmentos.
- Oportunidades e propostas: quatro indicadores e barras nas cores laranja, verde, vermelho e roxo. Percentuais calculados sobre as oportunidades do período, com explicação de que propostas podem também integrar os status.
- Painéis lado a lado quando há espaço e empilhados no celular. Mantidos os demais indicadores e filtros.
- Nenhuma alteração de consulta, agregação, backend, banco ou permissões neste complemento. Nenhuma dependência adicionada.
- Validados 15 testes de dados, TypeScript, build e prévias isoladas em 1440, 1180 e 390 px, incluindo base vazia, erro e perfil restrito.

## Organização em abas

Solicitação: separar os assuntos para reduzir as informações simultâneas, seguindo a referência enviada.

- Visão geral (inicial): gráficos de segmentos, propostas e oportunidades e resumo de cadastros.
- Funil e cadastros: segmentos, indicadores cadastrais, sete etapas e distribuição por etapa.
- Oportunidades: quatro indicadores e gráfico de propostas e oportunidades.
- Motivos de perda: análise padronizada já existente, sem observações livres.
- Acompanhamento: prioridades, responsável, próxima ação, situação do contato e indicadores de contato, valor mensal e participação de clientes.

A navegação usa Tabs do Material UI com seleção laranja, suporte a teclado, vínculo acessível entre aba e painel e rolagem horizontal em telas pequenas. Mantidos os filtros de período, atualização, permissões e consultas existentes. Trocar abas preserva os filtros e não recarrega as listagens. O catálogo de motivos é consultado pelo painel de perdas quando aberto. O cabeçalho foi compactado e o botão Ver cadastros pode quebrar para outra linha em telas pequenas.

Arquivos deste ajuste: BiComercialPage.tsx e IndicadoresSegmentosOportunidades.tsx.

Conferência: TypeScript sem erros; 15 testes do BI e 6 de perdas aprovados; nove cenários isolados de renderização verificando os títulos exclusivos por aba, seleção única e vínculos acessíveis; capturas de cada aba em 1440 e 390 px sem ampliar a largura da página.
