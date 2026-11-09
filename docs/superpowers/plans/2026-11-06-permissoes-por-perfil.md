# Permissões por perfil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refatorar a tela com Select de perfil, grupos visuais, busca e salvamento explícito, sem alterar autorizações.
**Architecture:** Reutilizar src/config/screens.ts como fonte de chaves e regras, GET /screen-permissions e PUT /screen-permissions/:role. Manter rascunhos locais por perfil; enviar somente alterações explícitas e os efeitos de vínculo já existentes. Categorias e pesquisa não participam da autorização.
**Tech Stack:** React, TypeScript, MUI, Next.js; testes Node e verificação de interface com dados fictícios.
**Spec:** Requisitos do usuário na conversa de 2026-11-06 (itens 1 a 9).

## Global Constraints
- Não alterar src/config/screens.ts, regras de múltiplos perfis, backend, banco ou migrations.
- Manter todos os itens do catálogo e modalidades clients/leads, mais chaves desconhecidas retornadas pela API.
- Bloquear users/profilePermissions do ADMIN e modalidades quando Cadastros está desabilitado, como hoje.
- Nenhuma gravação em carregamento, pesquisa, filtro ou troca de perfil.

## Review Focus
- Perfis vazios e perfil CLIENTE continuam selecionáveis; falha de carregamento não mostra permissões fictícias.
- Busca e filtros não perdem rascunhos nem omitem permissões do payload alterado.
- Cadastros conserva vínculos existentes sem materializar valores padrão de outras telas.
- Falha do PUT conserva alterações e permite tentar novamente; duplo clique produz uma requisição.
- Falha de atualização da sessão após PUT bem-sucedido não é anunciada como perda da gravação.

### Task 1: Agrupamento e rascunhos
**Files:** Create src/lib/permissoes-perfil.ts; scripts/permissoes-perfil.test.cjs.
- [x] Testes falhando para cobertura de catálogo, grupos, busca, proteções e alterações vinculadas.
- [x] Implementar funções puras reutilizando as regras atuais.
- [x] Executar testes e validar múltiplos perfis sem alterar o cálculo existente.

### Task 2: Interface e persistência
**Files:** Modify src/app/permissoes-por-perfil/page.tsx.
- [x] Substituir cabeçalhos duplicados/botões por cabeçalho único e Select da API.
- [x] Cards com linhas compactas, contadores estáveis, busca e filtro por grupo.
- [x] Rascunhos por perfil, aviso pendente, descarte confirmado e proteção ao recarregar.
- [x] Salvar somente alterações do perfil pela API atual; mutex contra duplo envio e refreshUser com múltiplos perfis.

### Task 3: Validação
- [x] Interface real com API fictícia: troca de perfil, filtros, toggles, gravação, recarga, falhas e Admin.
- [x] Layout desktop/tablet/mobile sem overflow.
- [x] TypeScript, lint e build disponíveis; registrar limitações reais.
- [x] Revisão final e resumo dos arquivos alterados, sem commit nem mudanças em dados reais.

## Evidências de execução
- 6 testes Node de catálogo, agrupamento, busca, vínculos, proteção Admin, alterações parciais e múltiplos perfis: aprovados.
- Página React/MUI real em navegador com API fictícia e armazenamento isolado: 1440, 980, 390 e 320 px sem rolagem horizontal nem botões cortados.
- Nove perfis disponíveis, troca com rascunhos, persistência após recarga, prevenção de PUT duplicado, falha/retry, descarte isolado, estados de carregamento/erro/vazio: aprovados.
- Atualização da sessão para perfil secundário e distinção entre falha de PUT e falha de refresh: aprovadas.
- TypeScript e build Next.js aprovados. Lint executado, indisponível por ausência prévia de eslint.config no projeto com ESLint 9.
- Revisão independente: nenhum achado concreto. Configuração de autorizações, serviços existentes e backend preservados.
- Ruling: enviar somente mudanças explícitas e efeitos de vínculo já existentes, pois o PUT faz upsert e devolve o perfil completo; evita materializar padrões de telas não editadas.
