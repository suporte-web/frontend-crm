import { appScreens, type ScreenKey } from '@/config/screens';

export type PageTopInfo = { title: string; description: string };

const descriptions: Record<ScreenKey, string> = {
  dashboard: 'Acesse os módulos e acompanhe sua rotina no CRM.',
  bi: 'Visualize o funil de vendas e a evolução das etapas comerciais.',
  commercialBi: 'Analise os indicadores e o desempenho da área comercial.',
  entregas: 'Acompanhe pedidos, prazos e ocorrências das entregas.',
  trackings: 'Consulte o status e o histórico de movimentações da encomenda.',
  'entregas-por-placas': 'Acompanhe rotas, motoristas e o andamento das entregas por veículo.',
  cadastros: 'Gerencie clientes e leads, contatos, documentos e acompanhamento comercial.',
  clients: 'Gerencie clientes e leads, contatos, documentos e acompanhamento comercial.',
  leads: 'Acompanhe os leads e sua evolução no relacionamento comercial.',
  opportunities: 'Acompanhe as oportunidades e propostas vinculadas aos cadastros.',
  quotes: 'Consulte e acompanhe as solicitações de cotação.',
  prospectingManagement: 'Acompanhe as consultoras e a evolução das prospecções.',
  entradas: 'Analise e acompanhe os registros recebidos pelo CRM.',
  atendimentoSac: 'Gerencie os atendimentos, reclamações e elogios dos clientes.',
  acoesSac: 'Acompanhe as ações de atendimento atribuídas a você.',
  visitas: 'Organize visitas e acompanhe os registros de atendimento.',
  users: 'Gerencie os usuários e seus perfis de acesso.',
  profilePermissions: 'Configure quais recursos cada perfil pode acessar.',
  marketing: 'Crie e gerencie os conteúdos de marketing.',
  marketingIntegrations: 'Configure as integrações utilizadas pelo marketing.',
  marketingMetrics: 'Acompanhe as métricas e os resultados dos canais digitais.',
  informativo: 'Consulte os inscritos no Informativo Pizzattolog.',
  siteRequests: 'Analise e acompanhe as solicitações recebidas pelo site.',
  siteInstitutional: 'Gerencie as páginas e os conteúdos do site institucional.',
  logs: 'Consulte os registros de atividades e alterações no CRM.',
};

const screensBySpecificity = [...appScreens].sort((a, b) => b.href.length - a.href.length);

export function getPageTop(pathname: string): PageTopInfo | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/entregas/tv') return null;
  if (path === '/alterar-senha') return { title: 'Alterar senha', description: 'Atualize a senha de acesso à sua conta.' };
  if (/^\/(?:oportunidades\/cadastro\/[^/]+\/propostas\/[^/]+|clientes\/[^/]+\/propostas\/[^/]+)$/.test(path)) {
    return { title: 'Detalhes da proposta', description: 'Consulte os dados comerciais, anexos e a situação da proposta.' };
  }
  if (/^\/oportunidades\/cadastro\/[^/]+$/.test(path)) return { title: 'Oportunidades do cadastro', description: 'Gerencie as oportunidades e propostas deste cadastro.' };
  if (path === '/atendimento/visitas/nova') return { title: 'Nova visita', description: 'Registre uma visita e as informações do atendimento.' };
  if (/^\/atendimento\/visitas\/[^/]+$/.test(path)) return { title: 'Detalhes da visita', description: 'Consulte e acompanhe as informações registradas na visita.' };
  if (/^\/atendimento\/[^/]+$/.test(path) && path !== '/atendimento/acoes' && path !== '/atendimento/visitas') return { title: 'Detalhes do atendimento', description: 'Acompanhe o atendimento, as ações e o histórico do registro.' };
  if (/^\/(?:cadastros|clientes|leads|prospects)\/[^/]+$/.test(path)) return { title: 'Detalhes do cadastro', description: 'Consulte os dados, contatos, documentos e o histórico do cadastro.' };
  if (/^\/cotacoes\/[^/]+$/.test(path)) return { title: 'Detalhes da cotação', description: 'Consulte as informações e acompanhe a situação da cotação.' };
  if (/^\/entradas\/[^/]+$/.test(path)) return { title: 'Detalhes da entrada', description: 'Analise as informações e acompanhe o andamento da entrada.' };
  if (/^\/solicitacoes-site\/[^/]+$/.test(path)) return { title: 'Detalhes da solicitação', description: 'Analise e acompanhe a solicitação recebida pelo site.' };
  const normalized = path === '/prospects' ? '/cadastros' : path;
  const screen = screensBySpecificity.find(item => normalized === item.href || normalized.startsWith(item.href + '/'));
  if (screen) return { title: screen.label, description: descriptions[screen.key] };
  return { title: 'CRM Pizzattolog', description: 'Acompanhe suas atividades e os registros do CRM.' };
}
