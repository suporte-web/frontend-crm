import { lazy } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/protected-route";
import Login from "./pages/login/index";
import { App } from "./app/App";

// Cada tela é carregada somente quando sua URL é acessada.
const AlterarSenha = lazy(() => import("@/pages/alterar-senha/index"));
const AcoesSac = lazy(() => import("@/pages/atendimento/acoes/index"));
const AtendimentoSac = lazy(() => import("@/pages/atendimento/index"));
const NovaVisita = lazy(() => import("@/pages/atendimento/visitas/nova/index"));
const Visitas = lazy(() => import("@/pages/atendimento/visitas/index"));
const DetalheVisita = lazy(
  () => import("@/pages/atendimento/visitas/detalhes/index"),
);
const DetalheAtendimentoSac = lazy(
  () => import("@/pages/atendimento/detalhes/index"),
);
const BusinessIntelligence = lazy(() => import("@/pages/bi/index"));
const BiComercial = lazy(() => import("@/pages/bi-comercial/index"));
const BiStudio = lazy(() => import("@/pages/bi-studio/index"));
const Cadastros = lazy(() => import("@/pages/clientes/index"));
const DetalheCadastro = lazy(() => import("@/pages/clientes/detalhes/index"));
const CentralAjuda = lazy(() => import("@/pages/central-ajuda/index"));
const Chamados = lazy(() => import("@/pages/chamados/index"));
const Chat = lazy(() => import("@/pages/chat/index"));
const Clientes = lazy(() => import("@/pages/clientes/index"));
const DetalheCliente = lazy(() => import("@/pages/clientes/detalhes/index"));
const DetalhePropostaCliente = lazy(
  () => import("@/pages/clientes/detalhes/propostas/detalhes/index"),
);
const Cotacoes = lazy(() => import("@/pages/cotacoes/index"));
const DetalheCotacao = lazy(() => import("@/pages/cotacoes/detalhes/index"));
const Entradas = lazy(() => import("@/pages/entradas/index"));
const DetalheEntrada = lazy(() => import("@/pages/entradas/detalhes/index"));
const Entrar = lazy(() => import("@/pages/entrar/index"));
const Entregas = lazy(() => import("@/pages/entregas/index"));
const EntregasTv = lazy(() => import("@/pages/entregas/tv/index"));
const EntregasPorPlacas = lazy(
  () => import("@/pages/entregas-por-placas/index"),
);
const Fornecedores = lazy(() => import("@/pages/fornecedores/index"));
const GestaoProspeccoes = lazy(
  () => import("@/pages/gestao-prospeccoes/index"),
);
const Leads = lazy(() => import("@/pages/leads/index"));
const DetalheLead = lazy(() => import("@/pages/leads/detalhes/index"));
const Logs = lazy(() => import("@/pages/logs/index"));
const Informativo = lazy(() => import("@/pages/marketing/informativo/index"));
const IntegracoesMarketing = lazy(
  () => import("@/pages/marketing/integracoes/index"),
);
const MetricasMarketing = lazy(
  () => import("@/pages/marketing/metricas/index"),
);
const Marketing = lazy(() => import("@/pages/marketing/index"));
const OportunidadesCadastro = lazy(
  () => import("@/pages/oportunidades/cadastro/detalhes/index"),
);
const DetalhePropostaOportunidade = lazy(
  () =>
    import("@/pages/oportunidades/cadastro/detalhes/propostas/detalhes/index"),
);
const Oportunidades = lazy(() => import("@/pages/oportunidades/index"));
const Painel = lazy(() => import("@/pages/painel/index"));
const PermissoesPorPerfil = lazy(
  () => import("@/pages/permissoes-por-perfil/index"),
);
const Prospects = lazy(() => import("@/pages/prospects/index"));
const DetalheProspect = lazy(
  () => import("@/pages/solicitacoes-site/detalhes/index"),
);
const Rastreamentos = lazy(() => import("@/pages/rastreamentos/index"));
const RecuperarSenha = lazy(() => import("@/pages/recuperar-senha/index"));
const RedefinirSenha = lazy(() => import("@/pages/redefinir-senha/index"));
const SiteInstitucional = lazy(
  () => import("@/pages/site-institucional/index"),
);
const QuemSomos = lazy(
  () => import("@/pages/site-institucional/quem-somos/index"),
);
const PaginaSiteInstitucional = lazy(
  () => import("@/pages/site-institucional/detalhes/index"),
);
const SolicitacoesSite = lazy(() => import("@/pages/solicitacoes-site/index"));
const DetalheSolicitacaoSite = lazy(
  () => import("@/pages/solicitacoes-site/detalhes/index"),
);
const Usuarios = lazy(() => import("@/pages/usuarios/index"));

const Rotas = () => (
  <App>
    <Routes>
      {/* Acesso público. */}
      <Route path="/" index element={<Login />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      {/* Valida o usuário no backend antes de abrir qualquer tela privada. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/alterar-senha" element={<AlterarSenha />} />
        <Route path="/atendimento/acoes" element={<AcoesSac />} />
        <Route path="/atendimento" element={<AtendimentoSac />} />
        <Route path="/atendimento/visitas/nova" element={<NovaVisita />} />
        <Route path="/atendimento/visitas" element={<Visitas />} />
        <Route path="/atendimento/visitas/:id" element={<DetalheVisita />} />
        <Route path="/atendimento/:id" element={<DetalheAtendimentoSac />} />
        <Route path="/bi" element={<BusinessIntelligence />} />
        <Route path="/bi-comercial" element={<BiComercial />} />
        <Route path="/bi-studio" element={<BiStudio />} />
        <Route path="/cadastros" element={<Cadastros />} />
        <Route path="/cadastros/:id" element={<DetalheCadastro />} />
        <Route path="/central-ajuda" element={<CentralAjuda />} />
        <Route path="/chamados" element={<Chamados />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id" element={<DetalheCliente />} />
        <Route
          path="/clientes/:id/propostas/:propostaId"
          element={<DetalhePropostaCliente />}
        />
        <Route path="/cotacoes" element={<Cotacoes />} />
        <Route path="/cotacoes/:id" element={<DetalheCotacao />} />
        <Route path="/entradas" element={<Entradas />} />
        <Route path="/entradas/:id" element={<DetalheEntrada />} />
        <Route path="/entregas" element={<Entregas />} />
        <Route path="/entregas/tv" element={<EntregasTv />} />
        <Route path="/entregas-por-placas" element={<EntregasPorPlacas />} />
        <Route path="/fornecedores" element={<Fornecedores />} />
        <Route path="/gestao-prospeccoes" element={<GestaoProspeccoes />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<DetalheLead />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/marketing/informativo" element={<Informativo />} />
        <Route path="/marketing/integracoes" element={<IntegracoesMarketing />} />
        <Route path="/marketing/metricas" element={<MetricasMarketing />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route
          path="/oportunidades/cadastro/:id"
          element={<OportunidadesCadastro />}
        />
        <Route
          path="/oportunidades/cadastro/:id/propostas/:propostaId"
          element={<DetalhePropostaOportunidade />}
        />
        <Route path="/oportunidades" element={<Oportunidades />} />
        <Route path="/painel" element={<Painel />} />
        <Route path="/permissoes-por-perfil" element={<PermissoesPorPerfil />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/prospects/:id" element={<DetalheProspect />} />
        <Route path="/rastreamentos" element={<Rastreamentos />} />
        <Route path="/site-institucional" element={<SiteInstitucional />} />
        <Route path="/site-institucional/quem-somos" element={<QuemSomos />} />
        <Route
          path="/site-institucional/:slug"
          element={<PaginaSiteInstitucional />}
        />
        <Route path="/solicitacoes-site" element={<SolicitacoesSite />} />
        <Route
          path="/solicitacoes-site/:id"
          element={<DetalheSolicitacaoSite />}
        />
        <Route path="/usuarios" element={<Usuarios />} />
      </Route>

      <Route
        path="*"
        element={
          <main style={{ padding: 32 }}>
            <h1>Página não encontrada</h1>
            <Link to="/painel">Voltar ao início</Link>
          </main>
        }
      />
    </Routes>
  </App>
);

export default Rotas;
