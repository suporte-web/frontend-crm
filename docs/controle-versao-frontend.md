# Controle de versão do frontend

O plugin `config/app-version.ts` gera um identificador com data UTC, milissegundos e UUID em cada build. O mesmo objeto é incorporado ao JavaScript por `__APP_VERSION__` e emitido em `dist/version.json`, incluindo `buildDate` ISO e o hash Git quando disponível. Não é necessário alterar a versão do package.json. O comando `npm run build` continua executando TypeScript antes do Vite.

O AppVersionProvider é instalado uma única vez em `src/app/providers.tsx`. Seus consumidores usam `useAppVersion()`, sem criar novos intervalos. A versão atual vem do bundle, nunca da primeira consulta ao servidor. O monitor consulta o manifesto estático ao iniciar, a cada 60 segundos, ao retornar à aba e ao focar a janela. Usa fetch sem cache, timestamp, timeout de 8 segundos, validação do JSON e bloqueio de consultas simultâneas. Falhas preservam o estado e não afetam autenticação nem operações do CRM. Em `npm run dev` o monitor fica desativado; valide com build e preview.

Uma versão diferente abre uma notificação persistente no canto inferior direito, acima da faixa usada pelos avisos de operação existentes. Não bloqueia a tela nem desaparece por clique externo. “Atualizar depois” oculta o aviso por 10 minutos para aquela versão, mantendo as consultas. Outra versão pode avisar imediatamente. O adiamento vale para a instância atual da aba e não grava dados no navegador.

“Atualizar agora” solicita confirmação nativa sobre trabalho não salvo e só então executa `window.location.reload()`. Cancelar mantém o aviso. Não há recarga forçada, redirecionamento ou limpeza de localStorage/sessionStorage: a rota e a sessão seguem os mecanismos existentes. Não existe detecção global de formulários alterados no projeto; a confirmação é sempre exibida. O `beforeunload` específico de Permissões por perfil continua funcionando.

## Nginx em produção

No bloco HTTPS atual, preserve `root /var/www/frontend-crm;`, SSL, proxy `/api/` para o backend existente na porta 3004, uploads e demais configurações. Ajuste apenas os blocos estáticos abaixo, sem duplicar locations já existentes:

```nginx
location = /version.json {
    default_type application/json;
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    try_files $uri =404;
}

location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
}

location / {
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    try_files $uri $uri/ /index.html;
}

location /assets/ {
    try_files $uri =404;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

Após editar a configuração manualmente, execute `sudo nginx -t` e, se passar, `sudo systemctl reload nginx`. O arquivo `deploy/nginx.conf` é um exemplo genérico e não deve substituir integralmente sua configuração de produção. Nenhuma alteração de servidor é executada pela implementação.

## Publicação no diretório fixo

No Ubuntu, com Node, npm, rsync, flock e sudo disponíveis:

```bash
cd /home/ubuntu/frontend-crm
npm run deploy:frontend
```

O script compila com o usuário atual, impede publicações concorrentes e copia para `/var/www/frontend-crm` nesta ordem:

1. Assets e demais arquivos, preservando os arquivos antigos e excluindo HTML/manifesto desta primeira cópia.
2. Novo `index.html`, por renomeação atômica no diretório de destino.
3. Novo `version.json`, também por renomeação atômica e sempre por último.

Não usa rsync --delete e não cria diretórios de releases. Falhas antes do último passo não anunciam a nova versão. Não é necessário reiniciar PM2/backend. Use este script em vez do comando antigo que copiava todo o dist de uma vez. Evite publicar manualmente em paralelo. Assets antigos acumulam: eventual limpeza exige uma política própria de retenção, não faz parte deste script.

## Validação

Arquivos criados: `config/app-version.ts`, `src/stores/app-version/service.ts`, `src/lib/app-version-monitor.ts`, `src/context/app-version-context.tsx`, `src/components/app-version/UpdateAvailableNotification.tsx`, `deploy/publish-frontend.sh`, `.gitattributes`, `tests/app-version.cjs` e este documento.

Arquivos ajustados: `vite.config.ts`, `src/vite-env.d.ts`, `src/app/providers.tsx`, `package.json`, `deploy/nginx.conf`, `tests/api-client.cjs` e `README.md`. O teste de arquitetura mantém o cliente Api obrigatório para HTTP de negócio e permite fetch exclusivamente no serviço do manifesto estático.

Execute `npm test`, `npm run typecheck` e `npm run build`. Os testes simulam um bundle A consultando um manifesto B, concorrência, intervalos, retorno à aba, falhas, timeout, StrictMode (iniciar/parar/iniciar), adiamento, nova versão durante o adiamento e cancelamento/confirmação da recarga. Testam também o contrato entre manifesto e definição do plugin, inclusive sem Git.

Para conferir em navegador: gere o build A, execute `npm run preview` e abra a aplicação. Guarde `dist/version.json` fora do dist. Gere o build B mantendo a aba A aberta. Ao retornar à aba ou após 60 segundos, ela deverá mostrar o aviso. Teste adiar, cancelar a confirmação e confirmar a recarga; confira a rota e a sessão. Para verificar os 10 minutos reais, aguarde o período; os testes automatizados usam relógio controlado.

```bash
curl -I https://crm.pizzattolog.com.br/version.json
curl -I https://crm.pizzattolog.com.br/index.html
curl -fsS https://crm.pizzattolog.com.br/version.json
```

Abas carregadas antes da primeira publicação desta funcionalidade ainda precisam de uma atualização manual inicial. Navegadores podem suspender abas em segundo plano e atrasar timers; a consulta ao retornar à aba reduz esse atraso. A validação de e-mails, regras comerciais e o banco não são alterados.
