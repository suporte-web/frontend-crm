# Padronização de oportunidades

Objetivo: preservar todos os campos, ações, permissões, anexos e informações; aplicar o padrão compacto de Clientes na listagem, cadastro e nova proposta.

Decisão da usuária: exibir automaticamente o valor da proposta comercial vinculada. Não somar tarifas de transporte nem usar o valor agregado da carga como receita.

- [x] Analisar componentes, vínculo Opportunity → Proposta e consultas existentes.
- [x] Padronizar cabeçalho, filtros, cartões, navegação e formulários com Material UI, branco, laranja #ff5805 e campos de 40 px.
- [x] Consultar a versão mais recente da proposta não cancelada/expirada, sem chamadas individuais por oportunidade. Preservar o valor original e usar como alternativa apenas quando não houver preço vinculado.
- [x] Distinguir ausência de preço de zero explícito. Não alterar schema, banco, migrations ou regras de ganho.
- [x] Executar testes do valor, regressões de anexos/perda, TypeScript, builds e inspeção responsiva.

## Resultado e arquivos

Frontend alterado:
- src/app/oportunidades/page.tsx
- src/app/clientes/[id]/components/PaginaDetalhesCliente.tsx
- src/app/clientes/[id]/components/detalhes-cliente/AbaOportunidadePropostaCliente.tsx
- src/services/crm.service.ts
- src/types/crm.ts

Frontend criado:
- src/components/crm/estilos-oportunidades.ts
- src/lib/valor-oportunidade.ts
- scripts/valor-oportunidade.test.cjs

Backend alterado:
- src/modules/oportunidades/oportunidades.service.ts
- src/modules/clientes/clients.service.ts

Backend criado:
- src/common/valor-proposta-comercial.ts
- src/modules/oportunidades/valor-proposta.spec.ts

O campo adicional valorPropostaComercial é calculado somente para leitura. A consulta prioriza createdAt, pois versões são numeradas por ticket e uma oportunidade pode ter vários tickets. Propostas canceladas e expiradas são desconsideradas. O valor original da oportunidade e as regras de ganho/BI são preservados. Se não existir preço de proposta, um valor anterior da oportunidade continua visível com sua origem indicada. Sem ambos, exibe Não informado. Zero explícito é mantido como R$ 0,00. Não há leitura automática de valores de planilhas anexadas.

## Verificação concluída

- TypeScript e builds de produção: frontend e backend aprovados.
- 15 testes frontend de valor/mapeamento, anexos e motivos de perda aprovados.
- 47 testes backend de valor, respostas sanitizadas, ganho, perda e consultoras aprovados.
- Revisão independente: dois ajustes encontrados e corrigidos (ordem cronológica entre tickets e remoção da relação interna nas respostas).
- 14 cenários visuais com componentes reais e dados fictícios: sidebar aberta/recolhida, desktop/celular, cadastro, seleção, nova proposta de transporte/armazenagem e edição; sem transbordamento horizontal, campos e botões de 40 px.
- Nenhuma alteração de schema, migration, banco, rota ou permissão. Sem commits automáticos.

Para visualizar localmente, reiniciar o backend e atualizar o frontend. Na publicação, atualizar ambos os projetos e executar os respectivos builds antes de reiniciar os serviços; não é necessário executar comandos Prisma para esta alteração.


## Atualização: preenchimento diretamente na oportunidade

A usuária informou que não utilizará mais a tela de Chamados e solicitou incluir o campo na própria oportunidade. Foi acrescentado Valor total (R$) na criação e na edição, com carregamento do valor salvo, validação brasileira de moeda e envio ao campo value das rotas existentes. Esse total agora prevalece na listagem. O valor de proposta comercial vinculada permanece como alternativa para registros anteriores sem total preenchido.

Arquivos adicionais alterados nesta etapa: detalhes-cliente-compartilhado.tsx (formulário, estado e preenchimento inicial), AbaOportunidadePropostaCliente.tsx (campos), PaginaDetalhesCliente.tsx (envio), src/lib/valor-oportunidade.ts (validação, formatação e prioridade) e scripts/valor-oportunidade.test.cjs. Criado scripts/valor-total-oportunidade.test.cjs.

Verificados: TypeScript, build de produção, 19 testes de valor/criação/edição/perdas e revisão independente sem achados. O campo foi conferido em desktop e celular. Esta etapa alterou somente o frontend, sem mudanças de banco, Prisma ou backend.
