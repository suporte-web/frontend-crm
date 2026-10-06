import type { SitePageConfig } from '@/types/site-institucional';

const publicSiteBaseUrl = process.env.NEXT_PUBLIC_SITE_PUBLIC_URL ?? 'http://localhost:3002';

const placements: Record<string, Record<string, string>> = {
  home: {
    'hero.imagemUrl': 'Primeiro banner do carrossel no topo da página inicial.',
    'hero.imagemUrlSecundaria': 'Segundo banner do carrossel no topo da página inicial.',
    'solucoes.0.imagemUrl': 'Card de Armazenagem na página inicial.',
    'solucoes.2.imagemUrl': 'Card de Operador Logístico na página inicial.',
    'solucoes.1.imagemUrl': 'Card de Transporte de Cargas na página inicial.',
  },
  'quem-somos': {
    'banner.imagemUrl': 'Banner no topo da página Quem Somos.',
    'historia.imagemUrl': 'Foto ao lado da história da empresa.',
  },
  solucoes: {
    'cabecalho.imagemUrl': 'Banner no topo da página Soluções.',
    'solucoes.0.imagemUrl': 'Card de Armazenagem na página Soluções.',
    'solucoes.1.imagemUrl': 'Card de Operador Logístico na página Soluções.',
    'solucoes.2.imagemUrl': 'Card de Transporte de Cargas na página Soluções.',
  },
  social: { 'hero.imagemUrl': 'Banner no topo da página Social.' },
  carreiras: {
    'hero.imagemUrl': 'Banner no topo da página Carreiras.',
    'programas.0.imagem': 'Foto do programa Rota de Oportunidade.',
    'programas.1.imagem': 'Foto do programa Café com RH.',
    'programas.2.imagem': 'Foto do programa Rota do Saber.',
  },
  agregados: {
    'banner.imagemUrl': 'Banner no topo da página Agregados.',
    'intro.imagemUrl': 'Foto da frota na apresentação de Agregados.',
    'oQueE.imagemUrl': 'Foto do motorista na seção sobre ser agregado.',
  },
  esg: {
    'compromisso.imagemUrl': 'Banner no topo da página ESG.',
    'ambiental.imagemUrl': 'Foto da seção Ambiental.',
    'social.imagemUrl': 'Foto da seção Social dentro da página ESG.',
    'governanca.imagemUrl': 'Foto da seção Governança.',
  },
  seminovos: {
    'hero.imagemUrl': 'Foto de destaque no topo da página Seminovos.',
    'introducao.imagemUrl': 'Foto do caminhão na apresentação dos seminovos.',
  },
};

export function getImagePlacement(slug: string, fieldPath: string) {
  return placements[slug]?.[fieldPath] ?? 'Imagem exibida nesta seção do site.';
}

export function getSitePageUrl(slug: string) {
  return `${publicSiteBaseUrl.replace(/\/$/, '')}/${slug === 'home' ? '' : slug}`;
}

export function getSitePhotoCount(config: SitePageConfig) {
  return config.sections.reduce((total, section) => total + section.fields.filter(field => field.type === 'image').length, 0);
}
