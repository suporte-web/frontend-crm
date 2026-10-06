'use client';

import { hasAnyRole } from "@/lib/user-roles";
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { getSitePageUrl, getSitePhotoCount } from '@/config/site-institucional/site-media-guide';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Link from 'next/link';

import type {
    ReactNode,
} from 'react';


import {
    Building2,
    FileText,
    Globe2,
    Home,
    Layers3,
    Leaf,
    MessageSquareText,
    Pencil,
    Truck,
} from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import {
    CrmPageHeader,
    CrmPageShell,
    CrmSection,
    crmPalette,
} from '@/components/mui/crm-primitives';

import {
    sitePageConfigs,
} from '@/config/site-institucional/site-page-config';

import { useAuth } from '@/context/auth-context';

const allowedRoles = new Set(['ADMIN', 'MARKETING']);

type PaginaSite = {
    id: string;
    nome: string;
    descricao: string;
    rota: string;
    icon: ReactNode;
};

const paginasSite: PaginaSite[] = [
    {
        id: 'home',
        nome: sitePageConfigs.home.title,
        descricao: sitePageConfigs.home.description ??
            'Gerencie os principais conteúdos apresentados na página inicial do site.',
        rota: '/',
        icon: <Home size={22} />,
    },
    {
        id: 'quem-somos',
        nome: sitePageConfigs['quem-somos'].title,
        descricao: sitePageConfigs['quem-somos'].description ??
            'História, missão, visão, valores e informações institucionais da empresa.',
        rota: '/quem-somos',
        icon: <Building2 size={22} />,
    },
    {
        id: 'solucoes',
        nome: sitePageConfigs.solucoes.title,
        descricao: sitePageConfigs.solucoes.description ??
            'Gerencie as soluções e os serviços logísticos apresentados no site.',
        rota: '/solucoes',
        icon: <Layers3 size={22} />,
    },
    {
        id: 'carreiras',
        nome: sitePageConfigs.carreiras.title,
        descricao: sitePageConfigs.carreiras.description ??
            'Gerencie textos institucionais da página de carreiras.',
        rota: '/carreiras',
        icon: <FileText size={22} />,
    },
    {
        id: 'agregados',
        nome: sitePageConfigs.agregados.title,
        descricao: sitePageConfigs.agregados.description ??
            'Gerencie textos e imagens institucionais da página de agregados.',
        rota: '/agregados',
        icon: <Truck size={22} />,
    },
    {
        id: 'esg',
        nome: sitePageConfigs.esg.title,
        descricao: sitePageConfigs.esg.description ??
            'Conteúdos relacionados aos pilares ambiental, social e de governança.',
        rota: '/esg',
        icon: <Leaf size={22} />,
    },
    {
        id: 'seminovos',
        nome: sitePageConfigs.seminovos.title,
        descricao: sitePageConfigs.seminovos.description ??
            'Gerencie informações e conteúdos da página de veículos seminovos.',
        rota: '/seminovos',
        icon: <Truck size={22} />,
    },
    {
        id: 'solicitar-cotacao',
        nome: sitePageConfigs['solicitar-cotacao'].title,
        descricao: sitePageConfigs['solicitar-cotacao'].description ??
            'Gerencie textos e conteúdos apresentados na página de solicitação de cotação.',
        rota: '/solicitar-cotacao',
        icon: <FileText size={22} />,
    },
    {
        id: 'contatos',
        nome: sitePageConfigs.contatos.title,
        descricao: sitePageConfigs.contatos.description ??
            'Gerencie as informações apresentadas nos canais de contato do site.',
        rota: '/contatos',
        icon: <MessageSquareText size={22} />,
    },
    {
        id: 'blog',
        nome: sitePageConfigs.blog.title,
        descricao: sitePageConfigs.blog.description ??
            'Gerencie os textos da página do blog.',
        rota: '/blog',
        icon: <FileText size={22} />,
    },
    {
        id: 'lei-geral-de-protecao-de-dados',
        nome: sitePageConfigs['lei-geral-de-protecao-de-dados'].title,
        descricao: sitePageConfigs['lei-geral-de-protecao-de-dados'].description ??
            'Gerencie o conteúdo da página de LGPD.',
        rota: '/lei-geral-de-protecao-de-dados',
        icon: <FileText size={22} />,
    },
    {
        id: 'politica-de-privacidade',
        nome: sitePageConfigs['politica-de-privacidade'].title,
        descricao: sitePageConfigs['politica-de-privacidade'].description ??
            'Gerencie o conteúdo da política de privacidade.',
        rota: '/politica-de-privacidade',
        icon: <FileText size={22} />,
    },
    {
        id: 'termos-de-uso',
        nome: sitePageConfigs['termos-de-uso'].title,
        descricao: sitePageConfigs['termos-de-uso'].description ??
            'Gerencie o conteúdo dos termos de uso.',
        rota: '/termos-de-uso',
        icon: <FileText size={22} />,
    },
];

export default function SiteInstitucionalPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const filteredPages = paginasSite.filter(page => normalize(page.nome + ' ' + page.descricao).includes(normalize(search.trim())));

    const isAllowed = user?.role
        ? hasAnyRole(user, [...allowedRoles])
        : false;

    if (!isAllowed) {
        return (
            <AppLayout>
                <Alert severity="warning">
                    Esta área é restrita aos perfis de Marketing e Administração.
                </Alert>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <CrmPageShell>
                <CrmPageHeader
                    eyebrow="Marketing"
                    title="Site Institucional"
                    description="Gerencie as páginas e os conteúdos exibidos no site institucional da Pizzattolog."
                    icon={<Globe2 size={24} />}
                />

                <CrmSection
                    sx={{
                        p: { xs: 2, md: 3 },
                    }}
                >
                    <Stack
                        direction={{
                            xs: 'column',
                            md: 'row',
                        }}
                        spacing={2}
                        sx={{
                            alignItems: {
                                xs: 'flex-start',
                                md: 'center',
                            },
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography
                                component="h2"
                                sx={{
                                    fontSize: 22,
                                    fontWeight: 900,
                                    color: 'text.primary',
                                }}
                            >
                                Páginas do site
                            </Typography>

                            <Typography
                                sx={{
                                    mt: 0.75,
                                    color: 'text.secondary',
                                    fontSize: 14,
                                }}
                            >
                                Escolha a página, confira onde cada foto aparece e publique
                                suas alterações para atualizar o site.
                            </Typography>
                        </Box>

                        <Chip
                            label={`${paginasSite.length} páginas`}
                            sx={{
                                bgcolor: '#fff7ed',
                                color: crmPalette.orangeDark,
                                fontWeight: 800,
                                border: '1px solid #fed7aa',
                            }}
                        />
                    </Stack>

                    <TextField label="Buscar página" placeholder="Ex.: Soluções, Carreiras, ESG"
                        value={search} onChange={event => setSearch(event.target.value)} fullWidth
                        sx={{ mt: 3, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                    {filteredPages.length === 0 ? <Alert severity="info" sx={{ mt: 2 }}>Nenhuma página encontrada.</Alert> : null}
                    <Box
                        sx={{
                            mt: 3,

                            display: 'grid',

                            gap: 2,

                            gridTemplateColumns: {
                                xs: '1fr',
                                md: 'repeat(2, minmax(0, 1fr))',
                                xl: 'repeat(3, minmax(0, 1fr))',
                            },
                        }}
                    >
                        {filteredPages.map((pagina) => (
                            <Paper
                                key={pagina.id}
                                elevation={0}
                                sx={{
                                    position: 'relative',

                                    display: 'flex',
                                    flexDirection: 'column',

                                    minHeight: 220,

                                    p: 2.5,

                                    overflow: 'hidden',

                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: '14px',

                                    bgcolor: '#fff',

                                    transition:
                                        'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',

                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        borderColor: '#fdba74',
                                        boxShadow: '0 16px 34px rgba(15, 23, 42, 0.08)',
                                    },
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    sx={{
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 46,
                                            height: 46,

                                            display: 'grid',
                                            placeItems: 'center',

                                            flexShrink: 0,

                                            borderRadius: '12px',

                                            bgcolor: '#fff7ed',
                                            color: crmPalette.orangeDark,
                                        }}
                                    >
                                        {pagina.icon}
                                    </Box>

                                    <Chip
                                        size="small"
                                        label={getSitePhotoCount(sitePageConfigs[pagina.id]) > 0
                                            ? `${getSitePhotoCount(sitePageConfigs[pagina.id])} fotos editáveis`
                                            : pagina.id === 'blog' ? 'Posts e imagens' : 'Conteúdo da página'}
                                        sx={{
                                            fontWeight: 800,
                                        }}
                                    />
                                </Stack>

                                <Box
                                    sx={{
                                        mt: 2.5,
                                        flex: 1,
                                    }}
                                >
                                    <Typography
                                        component="h3"
                                        sx={{
                                            fontSize: 19,
                                            fontWeight: 900,
                                            color: 'text.primary',
                                        }}
                                    >
                                        {pagina.nome}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 1,
                                            color: 'text.secondary',
                                            fontSize: 14,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {pagina.descricao}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 1.5,
                                            color: 'text.disabled',
                                            fontSize: 12,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {pagina.rota}
                                    </Typography>
                                </Box>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        mt: 2.5,
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <Button
                                        component={Link}
                                        href={`/site-institucional/${pagina.id}`}
                                        variant="contained"
                                        size="small"
                                        startIcon={<Pencil size={16} />}
                                        sx={{
                                            borderRadius: '10px',
                                            fontWeight: 800,
                                            textTransform: 'none',
                                            bgcolor: crmPalette.orange,

                                            '&:hover': {
                                                bgcolor: crmPalette.orangeDark,
                                            },
                                        }}
                                    >
                                        Editar página
                                    </Button>
                                    <Button component="a" href={getSitePageUrl(pagina.id)} target="_blank" rel="noopener noreferrer"
                                        variant="outlined" sx={{ textTransform: 'none', fontWeight: 750 }}>
                                        Ver no site
                                    </Button>
                                </Stack>
                            </Paper>
                        ))}
                    </Box>
                </CrmSection>
            </CrmPageShell>
        </AppLayout>
    );
}
