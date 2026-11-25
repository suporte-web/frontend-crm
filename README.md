# Frontend CRM

Aplicação React 19 com TypeScript, Vite e React Router. O NestJS continua responsável pela API e pelo banco de dados.

## Desenvolvimento

Utilize Node.js 24 (indicado em `.nvmrc`) e npm. O projeto requer Node.js 22.12 ou superior.

```sh
npm ci
```

Copie `.env.example` para `.env.local` e confira o endereço do backend. Durante a migração, o `.env.local` existente foi adaptado aos nomes novos.

```sh
npm run dev
```

Frontend: `http://localhost:3000`. Backend esperado: `http://127.0.0.1:3001`. O comando falha se a porta estiver ocupada: encerre o processo antigo do Next.js antes de iniciar o Vite. Para usar outra porta: `npm run dev -- --port 5173`.

No PowerShell com execução de scripts restrita, utilize `npm.cmd` no lugar de `npm`.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Desenvolvimento com atualização automática |
| `npm run typecheck` | Verificação TypeScript |
| `npm run lint` | Verificação ESLint sem alterações automáticas |
| `npm run lint:fix` | Aplicação das correções automáticas do ESLint |
| `npm test` | Testes de sessão, serviços e proxy HTTP |
| `npm run build` | Verificação de tipos e geração de `dist/` |
| `npm run preview` | Inspeção local de `dist/`, na porta 4173 |

`npm start` é um alias de `preview`. O preview não substitui o servidor de publicação.

## Estrutura e convenções

```text
src/
├── main.tsx             # Entrada do React
├── app/                 # Composição da aplicação e providers
├── Rotas.tsx            # Declarações explícitas de Route e carregamento por tela
├── pages/               # Telas por funcionalidade
│   └── clientes/
│       ├── index.tsx
│       ├── components/
│       └── detalhes/
├── components/          # Componentes compartilhados
├── context/             # Estado de sessão e tema
├── stores/              # Comunicação com o backend, separada por domínio
│   └── users/
│       ├── service.ts
│       └── types.ts
├── utils/Api.ts         # Cliente HTTP central (Axios)
├── types/               # Contratos dos dados
├── config/              # Permissões e configurações da interface
├── hooks/
├── lib/
└── styles/
```

- Cada funcionalidade fica em `pages/<funcionalidade>`, com `index.tsx` e componentes locais quando necessário.
- Telas internas usam `AppLayout`, que já fornece um `Container` com largura máxima de 1580 px e espaçamento responsivo. Não é necessário repetir o `Container` em cada página; limites menores podem ser definidos localmente. `CrmPageShell` e `CrmSection` permitem que o conteúdo encolha no espaço disponível. Tabelas largas devem manter a rolagem em `TableContainer` ou em um elemento com `overflow-x: auto`. Login e recuperação de senha têm seus próprios limites; o modo TV usa tela cheia.
- O `index.tsx` contém a implementação principal da tela. Evitar um arquivo que apenas reexporta `components/MinhaPagina`. Componentes auxiliares permanecem em `components/`; quando duas URLs usam exatamente a mesma tela, apontar ambas para o mesmo `index.tsx` em `Rotas.tsx`, sem criar um reexport adicional.
- As URLs são declaradas diretamente em `src/Rotas.tsx`, no formato `<Route path="/url" element={<Tela />} />`. Pastas não criam rotas automaticamente. As telas usam `lazy`, e `app/App.tsx` mantém o carregamento, o tratamento de erros e a rolagem entre páginas.
- Rotas privadas ficam dentro de `<Route element={<ProtectedRoute />}>`. O `UserProvider` compartilha a sessão do login e do `Api`, usando `sessionStorage` (`crm_token`/`crm_user`). Antes de montar uma tela privada, a proteção consulta `/auth/me` a cada navegação, inclusive parâmetros e query. Login e recuperação/redefinição de senha são públicos; `/entregas/tv` exige autenticação. Falhas temporárias bloqueiam a tela com opção de tentar novamente, sem apagar a sessão; permissões e troca obrigatória de senha continuam valendo.
- Usar `Link`, `useNavigate`, `useParams` e `useSearchParams` do React Router para navegação interna.
- Usar `href` em links externos e `to` nos componentes do React Router, inclusive com `component={Link}` no MUI.
- Manter chamadas HTTP em `stores/<dominio>/service.ts`, utilizando o cliente de `utils/Api.ts`. Telas e contextos importam o objeto `<NomeDaPasta>Service` do store e chamam seus métodos. O backend deve continuar validando as permissões.
- O alias `@/` aponta para `src/`. Novas telas são carregadas sob demanda pelo registro de rotas.

## Ambiente e comunicação com a API

| Variável | Finalidade |
| --- | --- |
| `VITE_API_BACKEND` | URL pública base usada por `utils/Api.ts`; padrão `/api` |
| `VITE_API_URL` | Nome anterior, aceito como fallback quando `VITE_API_BACKEND` não está definido |
| `VITE_SITE_PUBLIC_URL` | Endereço do site institucional público |
| `BACKEND_INTERNAL_URL` | Destino do proxy no desenvolvimento/preview |
| `BACKEND_API_PREFIX` | Prefixo real das rotas do backend: vazio no NestJS atual ou `/api` quando configurado |

Variáveis `VITE_*` são públicas e incorporadas ao build. Não armazenar senhas ou tokens nelas. Depois de alterá-las, reiniciar o desenvolvimento ou gerar um novo build para publicação.

O proxy está em `config/api-proxy.ts`, fora do código do navegador. Ele preserva o token, a query string e o corpo de uploads e mantém 90 segundos para consultas de monitoramento. A rota de servidor que antes existia no Next.js foi substituída por esse encaminhamento; o endpoint continua no NestJS.

## Padrão dos stores

Cada domínio possui `src/stores/<nome>/service.ts`. Tipos locais podem ficar em `types.ts` na mesma pasta; os contratos compartilhados existentes continuam em `src/types`. Um store só com funções HTTP não exige uma biblioteca de estado global.

O service exporta um objeto com o nome da pasta em PascalCase, seguido de `Service`: `AnexosService`, `AtendimentoSacService`, `AuditLogsService`, `UsersService`. Métodos públicos ficam dentro desse objeto; helpers privados podem ficar fora. Tipos, constantes e classes de erro continuam como exports próprios.

```ts
// src/stores/users/service.ts
import { Api } from '@/utils/Api';
import type { User } from './types';

export const UsersService = {
  getUsers: async (): Promise<User[]> => {
    const { data } = await Api.get<User[]>('/users');
    return data;
  },
};
```

Nas telas, usar `import { UsersService } from '@/stores/users/service'` e chamar `UsersService.getUsers()`. Não utilizar `fetch`, Axios direto ou montar endpoints de negócio nos componentes. Serviços que coordenam outros domínios podem reutilizar os objetos dos outros stores. Chamadas internas também usam o nome do objeto, como `AnexosService.obterArquivoAnexo(caminho)`.

`Api` e `createApi` centralizam base URL, autenticação e tratamento comum de erros. Os serviços retornam os dados de `response.data`; as telas não precisam verificar `response.ok` nem chamar `json()`. Erros HTTP geram `ApiError`, com mensagem, status e dados da resposta. Apenas erros 401 de operações autenticadas encerram a sessão.

Todos os serviços usam `Api.get<T>`, `Api.post<T>` e os demais métodos tipados. Não duplicar o prefixo: com a base `/api`, a chamada é `Api.get('/users')`. Para uploads, enviar `FormData` diretamente, sem definir `Content-Type`. Para downloads, usar `responseType: 'blob'` e retornar `data`. Formatações de telefone, CPF e CNPJ ficam em `utils/formatadores.ts`.

O token do fluxo ativo é lido do `sessionStorage` em cada requisição. As chaves ficam em `utils/constants.ts`; não há fallback para tokens antigos do `localStorage`. Login e recuperação de senha não recebem o token existente. Um 401 autenticado encerra a sessão; 403 e erros transitórios não apagam credenciais. Senhas, tokens e headers não são registrados pelo cliente HTTP no console.

Os stores não recebem o token da sessão por parâmetro nem montam `Authorization`; esse header pertence ao interceptor de `utils/Api.ts`. Passe somente os dados da operação, filtros e opções como `AbortSignal`. Tokens com finalidade própria, como redefinição de senha e integração WhatsApp, continuam nos respectivos contratos.

A entrada atual mantém o `AuthProvider` como responsável pela sessão. Não montar simultaneamente providers independentes de autenticação com chaves ou mecanismos de armazenamento diferentes.

As configurações TypeScript estão separadas em `tsconfig.app.json` e `tsconfig.node.json`. `npm run typecheck` verifica ambos com `tsc -b`.

## Publicação

1. Configurar as variáveis públicas para o ambiente de destino.
2. Executar `npm run build`.
3. Publicar assets, depois `index.html` e por último `version.json`, preservando os assets anteriores.
4. Configurar o retorno de `index.html` para rotas da aplicação e o encaminhamento de `/api/` e `/uploads/` ao backend.

Há um exemplo em `deploy/nginx.conf`. Ajuste endereço do upstream, prefixo da API, domínio e TLS ao ambiente. O proxy do Vite não é incluído no build estático.

No Ubuntu de produção, execute `npm run deploy:frontend` no repositório. O script já realiza o build e publica em `/var/www/frontend-crm`, sem apagar assets anteriores. Veja [controle de versão e publicação](docs/controle-versao-frontend.md) para os blocos de cache do Nginx e o roteiro de validação.

Cada build gera `dist/version.json` e incorpora a mesma versão ao JavaScript. O monitor global verifica atualizações a cada 60 segundos e ao retornar à aba. O colaborador pode atualizar após confirmação ou adiar por 10 minutos. Em desenvolvimento, o monitor fica desativado. A consulta ao manifesto é a única exceção ao uso de `Api`: usa `fetch` em `stores/app-version/service.ts`, pois acessa um arquivo estático do frontend sem token, conforme o contrato desta funcionalidade.

## Validação da migração

As 52 URLs foram preservadas. Parâmetros dinâmicos passaram a ser lidos pelo React Router. O endereço `/bi-studio`, cuja página anterior estava vazia, redireciona para `/bi`.

O frontend mantém testes de serviços, sessão e comunicação HTTP, executados com `npm test`, sem automatização de navegador. Para conferir as telas e a navegação, gere o build e execute `npm run preview` para uma verificação manual.

Os testes de proxy usam um servidor HTTP temporário, sem acessar bancos. O lint mantém avisos sobre código existente para revisão gradual. O pacote de exportação Excel continua grande e é carregado sob demanda; sua otimização pode ser feita separadamente.
