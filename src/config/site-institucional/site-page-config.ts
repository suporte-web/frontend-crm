import type {
  SiteFieldConfig,
  SitePageConfig,
} from "@/types/site-institucional";

function text(
  path: string,
  label: string,
  helperText?: string,
): SiteFieldConfig {
  return {
    path,
    label,
    type: "text",
    helperText,
  };
}

function textarea(
  path: string,
  label: string,
  rows = 4,
  helperText?: string,
): SiteFieldConfig {
  return {
    path,
    label,
    type: "textarea",
    rows,
    helperText,
  };
}

function image(
  path: string,
  label: string,
  recommendedSize: string,
): SiteFieldConfig {
  return {
    path,
    label,
    type: "image",
    recommendedSize,
  };
}

function cardTextFields(
  path: string,
  titles: string[],
  label: string,
  descriptionLabel = "descrição",
  descriptionPath = "descricao",
): SiteFieldConfig[] {
  return titles.flatMap((title, index) => [
    text(`${path}.${index}.titulo`, `${label} ${index + 1} - título`, title),
    textarea(
      `${path}.${index}.${descriptionPath}`,
      `${label} ${index + 1} - ${descriptionLabel}`,
      3,
    ),
  ]);
}

function itemTextFields(
  path: string,
  titles: string[],
  label: string,
  fields: Array<{
    key: string;
    label: string;
    rows?: number;
  }>,
): SiteFieldConfig[] {
  return titles.flatMap((title, index) =>
    fields.map((field, fieldIndex) => {
      const fieldPath = `${path}.${index}.${field.key}`;

      const fieldLabel = `${label} ${index + 1} - ${field.label}`;

      const helperText = fieldIndex === 0 ? title : undefined;

      if (field.rows && field.rows > 1) {
        return textarea(fieldPath, fieldLabel, field.rows, helperText);
      }

      return text(fieldPath, fieldLabel, helperText);
    }),
  );
}

function bulletFields(
  path: string,
  titles: string[],
  label: string,
): SiteFieldConfig[] {
  return titles.map((title, index) =>
    text(`${path}.${index}`, `${label} ${index + 1}`, title),
  );
}

function legalSectionFields(
  sectionIndex: number,
  paragraphs: number,
): SiteFieldConfig[] {
  const basePath = `secoes.${sectionIndex}`;

  return [
    text(`${basePath}.titulo`, `Seção ${sectionIndex + 1} - título`),
    ...Array.from(
      {
        length: paragraphs,
      },
      (_, paragraphIndex) =>
        textarea(
          `${basePath}.paragrafos.${paragraphIndex}`,
          `Seção ${sectionIndex + 1} - parágrafo ${paragraphIndex + 1}`,
          4,
        ),
    ),
  ];
}

const solucoesPrincipais = [
  "Armazenagem",
  "Operador Logistico",
  "Transporte de Cargas",
];

const valores = [
  "Conformidade Legal",
  "Foco no Cliente",
  "Cultura de Seguranca",
  "Transparencia",
  "Sustentabilidade",
  "Gestao de Riscos",
  "Manutencao Preditiva",
  "Melhoria continua",
];

export const sitePageConfigs: Record<string, SitePageConfig> = {
  home: {
    slug: "home",

    title: "Página inicial",

    description:
      "Gerencie as imagens do banner principal e o conteúdo das soluções exibidas na página inicial.",

    sections: [
      {
        key: "hero",

        title: "Banner principal",

        description:
          "Altere as duas imagens exibidas no banner principal da página inicial.",

        fields: [
          image(
            "hero.imagemUrl",
            "Imagem 1 do banner",
            "1920 x 900 px, proporção aproximada 16:9",
          ),

          image(
            "hero.imagemUrlSecundaria",
            "Imagem 2 do banner",
            "1920 x 900 px, proporção aproximada 16:9",
          ),
        ],
      },

      {
        key: "solucoes",

        title: "Soluções da Home",

        description:
          "Edite os textos e as imagens das três soluções exibidas na página inicial.",

        fields: [
          // =====================================================
          // SOLUÇÃO 1 - ARMAZENAGEM
          // =====================================================

          text("solucoes.0.titulo", "Solução 1 - título", "Armazenagem"),

          textarea("solucoes.0.descricao", "Solução 1 - descrição", 4),

          image(
            "solucoes.0.imagemUrl",
            "Solução 1 - imagem",
            "900 x 620 px, proporção aproximada 3:2",
          ),

          // =====================================================
          // SOLUÇÃO 2 - OPERADOR LOGÍSTICO
          // =====================================================

          text("solucoes.2.titulo", "Solução 3 - título", "Operador Logístico"),

          textarea("solucoes.2.descricao", "Solução 3 - descrição", 4),

          image(
            "solucoes.2.imagemUrl",
            "Solução 3 - imagem",
            "900 x 620 px, proporção aproximada 3:2",
          ),

          // =====================================================
          // SOLUÇÃO 3 - TRANSPORTE DE CARGAS
          // =====================================================

          text(
            "solucoes.1.titulo",
            "Solução 2 - título",
            "Transporte de Cargas",
          ),

          textarea("solucoes.1.descricao", "Solução 2 - descrição", 4),

          image(
            "solucoes.1.imagemUrl",
            "Solução 2 - imagem",
            "900 x 620 px, proporção aproximada 3:2",
          ),
        ],
      },
    ],
  },

  "quem-somos": {
    slug: "quem-somos",
    title: "Quem Somos",
    description:
      "Gerencie os conteudos institucionais da pagina Quem Somos na ordem atual do site.",
    sections: [
      {
        key: "banner",
        title: "Banner",
        fields: [
          text("banner.titulo", "Titulo"),
          textarea("banner.subtitulo", "Subtitulo", 3),
          image(
            "banner.imagemUrl",
            "Imagem do banner",
            "1920 x 640 px, proporcao aproximada 3:1",
          ),
        ],
      },
      {
        key: "historia",
        title: "Nossa História",
        fields: [
          text("historia.titulo", "Titulo"),
          textarea("historia.texto", "Texto", 8),
          image(
            "historia.imagemUrl",
            "Imagem da seção",
            "900 x 720 px, proporcao aproximada 5:4",
          ),
        ],
      },
      {
        key: "missao",
        title: "Propósito, Visão, Valores",
        description:
          "Os cards desta secao sao fixos; edite apenas titulos e textos.",
        fields: [
          text("missao.titulo", "Missao - titulo"),
          textarea("missao.texto", "Missao - texto", 5),
          text("visao.titulo", "Visao - titulo"),
          textarea("visao.texto", "Visao - texto", 5),
          text("valoresResumo.titulo", "Valores - titulo"),
          textarea("valoresResumo.texto", "Valores - texto", 5),
        ],
      },
      {
        key: "pilares",
        title: "Pilares de valores",
        description:
          "Cards fixos: altere somente os textos. Icones, ordem, cores, estrutura e quantidade permanecem como no site.",
        fields: cardTextFields("valores", valores, "Pilar"),
      },
      {
        key: "certificacoes",
        title: "Certificações e compromissos",
        description:
          "Cards fixos: altere somente os textos. Imagens, logos, layout e quantidade permanecem como no site.",
        fields: cardTextFields(
          "certificacoes",
          [
            "PLVB",
            "SASSMAQ",
            "Hospital Pequeno Principe",
            "Empresa B Certificada",
          ],
          "Certificações",
        ),
      },
      {
        key: "unidades",
        title: "Nossas Unidades",
        fields: [
          text("unidades.etiqueta", "Etiqueta"),
          text("unidades.titulo", "Titulo"),
          textarea("unidades.texto", "Texto", 5),
        ],
      },
    ],
  },

  solucoes: {
    slug: "solucoes",

    title: "Soluções",

    description:
      "Gerencie os textos e imagens da página de soluções respeitando a estrutura atual do site.",

    sections: [
      {
        key: "cabecalho",

        title: "Cabeçalho da seção",

        fields: [
          text("cabecalho.etiqueta", "Etiqueta"),

          text("cabecalho.titulo", "Título"),

          textarea("cabecalho.descricao", "Descrição", 4),

          image(
            "cabecalho.imagemUrl",
            "Imagem da seção",
            "1440 x 720 px, proporção aproximada 2:1",
          ),
        ],
      },

      {
        key: "solucoes-principais",

        title: "Soluções principais",

        description:
          "Edite os conteúdos das três soluções principais exibidas no site.",

        fields: [
          // =====================================================
          // SOLUÇÃO 1 - ARMAZENAGEM
          // =====================================================

          text("itens.0.titulo", "Solução 1 - título", "Armazenagem"),

          textarea("itens.0.descricao", "Solução 1 - descrição", 4),

          ...bulletFields(
            "itens.0.pontos",
            [
              "Armazenagem - ponto 1",
              "Armazenagem - ponto 2",
              "Armazenagem - ponto 3",
            ],
            "Solução 1 - ponto",
          ),

          // =====================================================
          // SOLUÇÃO 2 - OPERADOR LOGÍSTICO
          //
          // IMPORTANTE:
          // Continua usando itens.2 para não trocar os dados
          // reais do site. Estamos alterando apenas a ordem no CRM.
          // =====================================================

          text("itens.2.titulo", "Solução 2 - título", "Operador Logístico"),

          textarea("itens.2.descricao", "Solução 2 - descrição", 4),

          ...bulletFields(
            "itens.2.pontos",
            [
              "Operador Logístico - ponto 1",
              "Operador Logístico - ponto 2",
              "Operador Logístico - ponto 3",
            ],
            "Solução 2 - ponto",
          ),

          // =====================================================
          // SOLUÇÃO 3 - TRANSPORTE DE CARGAS
          //
          // Continua usando itens.1.
          // =====================================================

          text("itens.1.titulo", "Solução 3 - título", "Transporte de Cargas"),

          textarea("itens.1.descricao", "Solução 3 - descrição", 4),

          ...bulletFields(
            "itens.1.pontos",
            [
              "Transporte de Cargas - ponto 1",
              "Transporte de Cargas - ponto 2",
              "Transporte de Cargas - ponto 3",
            ],
            "Solução 3 - ponto",
          ),
        ],
      },

      {
        key: "cta",

        title: "Chamada da página",

        fields: [
          text("cta.titulo", "Título"),

          textarea("cta.descricao", "Descrição", 3),

          text("cta.botaoTexto", "Texto do botão"),
        ],
      },
    ],
  },

  "especialidades-logisticas": {
    slug: "especialidades-logisticas",
    title: "Especialidades Logísticas",
    description:
      "Gerencie os textos da página de especialidades logísticas.",
    sections: [
      {
        key: "hero",
        title: "Cabeçalho",
        fields: [
          text("hero.etiqueta", "Etiqueta"),
          text("hero.titulo", "Título"),
          textarea("hero.descricao", "Descrição", 4),
        ],
      },
      {
        key: "especialidades",
        title: "Especialidades",
        description:
          "Edite os textos das três especialidades exibidas no site.",
        fields: [
          ...itemTextFields(
            "especialidades",
            [
              "Produtos Químicos",
              "Cosméticos e Higiene",
              "Saúde e Nutrição Pet",
            ],
            "Especialidade",
            [
              {
                key: "etiqueta",
                label: "etiqueta",
              },
              {
                key: "titulo",
                label: "título",
              },
              {
                key: "descricao",
                label: "descrição",
                rows: 4,
              },
            ],
          ),
          ...Array.from(
            {
              length: 3,
            },
            (_, specialtyIndex) =>
              bulletFields(
                `especialidades.${specialtyIndex}.pontos`,
                [
                  "Ponto 1",
                  "Ponto 2",
                  "Ponto 3",
                ],
                `Especialidade ${specialtyIndex + 1} - ponto`,
              ),
          ).flat(),
        ],
      },
    ],
  },

  social: {
    slug: "social",
    title: "Social",
    description:
      "Gerencie textos da pagina Social mantendo cards, imagens e icones fixos.",
    sections: [
      {
        key: "hero",
        title: "Cabecalho",
        fields: [
          text("hero.etiqueta", "Etiqueta"),
          text("hero.titulo", "Titulo"),
          textarea("hero.descricao", "Descricao", 4),
          image(
            "hero.imagemUrl",
            "Imagem do cabecalho",
            "1440 x 720 px, proporcao aproximada 2:1",
          ),
        ],
      },
      {
        key: "iniciativas",
        title: "Iniciativas",
        description:
          "Cards fixos: altere somente os textos. Imagens, icones, ordem, cores, estrutura e quantidade permanecem como no site.",
        fields: [
          text("iniciativasCabecalho.titulo", "Titulo da secao"),
          textarea("iniciativasCabecalho.descricao", "Descricao da secao", 3),
          ...cardTextFields(
            "iniciativas",
            [
              "Entre Rotas",
              "Rota Verde",
              "Rota do Saber",
              "Rota de Oportunidade",
              "Historias que Inspiram",
            ],
            "Iniciativa",
          ),
        ],
      },
      {
        key: "historias",
        title: "Histórias que Inspiram",
        description:
          "Cards fixos: altere somente os textos. Imagens, layout e quantidade permanecem como no site.",
        fields: [
          text("historiasCabecalho.titulo", "Titulo da secao"),
          textarea("historiasCabecalho.descricao", "Descricao da secao", 3),
          ...itemTextFields(
            "historias",
            ["Desenvolvimento", "Comunidade", "Educação", "Impacto", "Futuro"],
            "História",
            [
              {
                key: "nome",
                label: "nome",
              },
              {
                key: "cargo",
                label: "cargo",
              },
              {
                key: "texto",
                label: "texto",
                rows: 3,
              },
            ],
          ),
        ],
      },
    ],
  },

  carreiras: {
    slug: "carreiras",
    title: "Carreiras",
    description:
      "Gerencie os textos institucionais da pagina de carreiras mantendo cards e comportamento atuais.",
    sections: [
      {
        key: "hero",
        title: "Cabeçalho",
        fields: [
          text("hero.etiqueta", "Etiqueta"),
          text("hero.titulo", "Titulo"),
          textarea("hero.descricao", "Descricao", 4),
          image(
            "hero.imagemUrl",
            "Imagem do cabecalho",
            "1440 x 720 px, proporcao aproximada 2:1",
          ),
        ],
      },
      {
        key: "destaques",
        title: "Destaques de carreira",
        description:
          "Cards fixos: altere somente os textos. Icones, ordem, cores, estrutura e quantidade permanecem como no site.",
        fields: itemTextFields(
          "destaques",
          ["Desenvolvimento", "Ambiente colaborativo", "Impacto real"],
          "Destaque",
          [
            {
              key: "texto",
              label: "texto",
            },
          ],
        ),
      },
      {
        key: "historias",
        title: "Histórias",
        description:
          "Cards fixos: altere somente os textos. Layout e quantidade permanecem como no site.",
        fields: itemTextFields(
          "historias",
          ["Historia 1", "Historia 2", "Historia 3"],
          "História",
          [
            {
              key: "nome",
              label: "nome",
            },
            {
              key: "cargo",
              label: "cargo",
            },
            {
              key: "texto",
              label: "texto",
              rows: 3,
            },
          ],
        ),
      },
      {
        key: "programas",
        title: "Programas",
        description:
          "Cards fixos: altere textos e imagens. Icones, ordem, cores, estrutura e quantidade permanecem como no site.",
        fields: [
          text(
            "programas.0.titulo",
            "Programa 1 - titulo",
            "Rota de Oportunidade",
          ),
          textarea("programas.0.texto", "Programa 1 - texto", 3),
          image(
            "programas.0.imagem",
            "Programa 1 - imagem",
            "900 x 620 px, proporcao aproximada 3:2",
          ),
          text("programas.1.titulo", "Programa 2 - titulo", "Café com RH"),
          textarea("programas.1.texto", "Programa 2 - texto", 3),
          image(
            "programas.1.imagem",
            "Programa 2 - imagem",
            "900 x 620 px, proporcao aproximada 3:2",
          ),
          text("programas.2.titulo", "Programa 3 - titulo", "Rota do Saber"),
          textarea("programas.2.texto", "Programa 3 - texto", 3),
          image(
            "programas.2.imagem",
            "Programa 3 - imagem",
            "900 x 620 px, proporcao aproximada 3:2",
          ),
        ],
      },
      {
        key: "cta",
        title: "Chamada final",
        fields: [
          text("cta.titulo", "Titulo"),
          textarea("cta.descricao", "Descricao", 3),
          text("cta.botaoTexto", "Texto do botao"),
        ],
      },
    ],
  },

  agregados: {
    slug: "agregados",
    title: "Agregados",
    description:
      "Gerencie os textos e imagens institucionais da pagina de agregados mantendo formularios e cards fixos.",
    sections: [
      {
        key: "banner",
        title: "Banner superior",
        fields: [
          image(
            "banner.imagemUrl",
            "Imagem do banner superior",
            "1920 x 520 px, proporcao aproximada 15:4",
          ),
        ],
      },
      {
        key: "intro",
        title: "Apresentação",
        fields: [
          text("intro.titulo", "Titulo"),
          textarea("intro.texto", "Texto", 5),
          text("intro.botaoTexto", "Texto do botao"),
          image(
            "intro.imagemUrl",
            "Imagem da apresentao",
            "900 x 720 px, proporcao aproximada 5:4",
          ),
        ],
      },
      {
        key: "o-que-e",
        title: "O que e ser um agregado",
        fields: [
          text("oQueE.titulo", "Titulo"),
          textarea("oQueE.texto", "Texto", 5),
          image(
            "oQueE.imagemUrl",
            "Imagem da seção",
            "900 x 720 px, proporcao aproximada 5:4",
          ),
        ],
      },
      {
        key: "vantagens",
        title: "Vantagens",
        description:
          "Cards fixos: altere somente os textos. Icones, ordem, cores, estrutura e quantidade permanecem como no site.",
        fields: itemTextFields(
          "vantagens",
          [
            "Cartão de abastecimento",
            "Carretas revisadas",
            "Seguro contra terceiros com preço diferenciado",
            "Transparência nas negociações",
            "Rastreador em comodato",
            "Fluxo de cargas com sinergia o ano todo",
            "Clube exclusivo de benefícios",
            "Bonificação para segurança e produtividade",
          ],
          "Vantagem",
          [
            {
              key: "titulo",
              label: "título",
            },
          ],
        ),
      },
      {
        key: "clube-beneficios",
        title: "Clube de benefícios",
        description:
          "Cards fixos: altere somente os textos. Icones, ordem, cores, estrutura e quantidade permanecem como no site.",
        fields: itemTextFields(
          "beneficiosClube",
          [
            "Inspeção veicular",
            "Bonificação por performance",
            "Educação financeira",
            "Exame toxicológico",
            "Saúde e qualidade de vida",
            "Bonificação por tempo de agregamento",
            "Pneus com condições especiais",
            "Indique e ganhe bônus",
            "Manutenção preventiva",
            "Diesel e Arla",
          ],
          "Benefício",
          [
            {
              key: "titulo",
              label: "título",
            },
          ],
        ),
      },
      {
        key: "requisitos",
        title: "Requisitos",
        description:
          "Listas fixas: altere somente os textos. Quantidade, ordem e estrutura permanecem como no site.",
        fields: [
          text("requisitos.titulo", "Titulo da secao"),
          ...bulletFields(
            "requisitos.veiculo",
            ["Veiculo 1", "Veiculo 2", "Veiculo 3", "Veiculo 4"],
            "Requisito do veiculo",
          ),
          ...bulletFields(
            "requisitos.motorista",
            ["Motorista 1", "Motorista 2", "Motorista 3", "Motorista 4"],
            "Requisito do motorista",
          ),
        ],
      },
      {
        key: "unidades",
        title: "Unidades",
        description:
          "Cards fixos: altere somente os textos. Quantidade e estrutura permanecem como no site.",
        fields: itemTextFields(
          "unidades",
          ["Curitiba", "Joinville", "Sao Paulo"],
          "Unidade",
          [
            {
              key: "nome",
              label: "nome",
            },
            {
              key: "endereco",
              label: "endereço",
              rows: 3,
            },
          ],
        ),
      },
      {
        key: "cta",
        title: "Chamada final",
        fields: [
          text("cta.titulo", "Titulo"),
          textarea("cta.descricao", "Descricao", 3),
          text("cta.botaoTexto", "Texto do botao"),
        ],
      },
    ],
  },

  esg: {
    slug: "esg",
    title: "ESG",
    description:
      "Gerencie textos e imagens da pagina ESG mantendo a ordem atual dos pilares.",
    sections: [
      {
        key: "compromisso",
        title: "Nosso compromisso ESG",
        fields: [
          text("compromisso.etiqueta", "Etiqueta"),
          text("compromisso.titulo", "Titulo"),
          textarea("compromisso.descricao", "Descricao", 5),
          image(
            "compromisso.imagemUrl",
            "Imagem do banner",
            "1920 x 760 px, proporcao aproximada 5:2",
          ),
        ],
      },
      {
        key: "empresa-b",
        title: "Empresa B",
        fields: [
          text("empresaB.titulo", "Titulo"),
          textarea("empresaB.texto", "Texto", 5),
          text("empresaB.botaoTexto", "Texto do botao"),
        ],
      },
      {
        key: "ambiental",
        title: "Ambiental",
        fields: [
          text("ambiental.titulo", "Titulo"),
          textarea("ambiental.texto", "Texto", 7),
          image(
            "ambiental.imagemUrl",
            "Imagem da seção",
            "900 x 900 px, proporcao 1:1",
          ),
        ],
      },
      {
        key: "social",
        title: "Social",
        fields: [
          text("social.titulo", "Titulo"),
          textarea("social.texto", "Texto", 7),
          image(
            "social.imagemUrl",
            "Imagem da seção",
            "900 x 900 px, proporcao 1:1",
          ),
        ],
      },
      {
        key: "programas",
        title: "Programas internos",
        description:
          "Cards fixos: altere somente os textos. Imagens, logos, layout e quantidade permanecem como no site.",
        fields: [
          text("programasCabecalho.titulo", "Titulo da secao"),
          textarea("programasCabecalho.descricao", "Descricao da secao", 3),
          ...cardTextFields(
            "programas",
            ["Vez & Voz", "Cafe com RH", "Rota do Saber", "Rota Verde"],
            "Programa",
          ),
        ],
      },
      {
        key: "governanca",
        title: "Governança Corporativa",
        fields: [
          text("governanca.titulo", "Titulo"),
          textarea("governanca.texto", "Texto", 7),
          image(
            "governanca.imagemUrl",
            "Imagem da seção",
            "900 x 900 px, proporcao 1:1",
          ),
        ],
      },
      {
        key: "relatorio",
        title: "Relatorio ESG",
        fields: [
          text("relatorio.etiqueta", "Etiqueta"),
          text("relatorio.titulo", "Titulo"),
          textarea("relatorio.texto", "Texto", 5),
          text("relatorio.botaoTexto", "Texto do botao"),
        ],
      },
    ],
  },

  seminovos: {
    slug: "seminovos",
    title: "Seminovos",
    description:
      "Gerencie textos e imagens da pagina de seminovos mantendo cards e comportamento atuais.",
    sections: [
      {
        key: "hero",
        title: "Banner",
        fields: [
          text("hero.etiqueta", "Etiqueta"),
          text("hero.titulo", "Titulo"),
          textarea("hero.descricao", "Descricao", 4),
          text("hero.botaoTexto", "Texto do botao"),
          image(
            "hero.imagemUrl",
            "Imagem do banner",
            "1920 x 820 px, proporcao aproximada 21:9",
          ),
        ],
      },
      {
        key: "introducao",
        title: "Introducao",
        fields: [
          text("introducao.etiqueta", "Etiqueta"),
          text("introducao.titulo", "Titulo"),
          textarea("introducao.texto", "Texto", 6),
          image(
            "introducao.imagemUrl",
            "Imagem da introducao",
            "900 x 720 px, proporcao aproximada 5:4",
          ),
        ],
      },
      {
        key: "pilares",
        title: "Pilares da introducao",
        description:
          "Cards fixos: altere somente os textos. Icones, ordem, cores, estrutura e quantidade permanecem como no site.",
        fields: cardTextFields(
          "introducaoPilares",
          ["Procedência conferida", "Frota preparada", "Escolha orientada"],
          "Pilar",
          "texto",
          "texto",
        ),
      },
      {
        key: "beneficios",
        title: "Beneficios",
        description:
          "Cards fixos: altere somente os textos. Icones, ordem, cores, estrutura e quantidade permanecem como no site.",
        fields: cardTextFields(
          "beneficios",
          [
            "Transparência total",
            "Manutenção em dia",
            "Segurança garantida",
            "Pronto para crescer",
          ],
          "Benefício",
        ),
      },
      {
        key: "diferenciais",
        title: "Diferenciais",
        description:
          "Cards fixos: altere somente os textos. Icones, ordem, cores, estrutura e quantidade permanecem como no site.",
        fields: cardTextFields(
          "diferenciais",
          [
            "Documentação 100% regularizada",
            "Check-up completo antes da entrega",
            "Modelos multimarcas à sua disposição",
            "Suporte consultivo na escolha",
            "A confiança de quem entende de logística",
          ],
          "Diferencial",
        ),
      },
      {
        key: "depoimentos",
        title: "Depoimentos",
        description:
          "Cards fixos: altere somente os textos. Quantidade e estrutura permanecem como no site.",
        fields: [
          ...itemTextFields(
            "depoimentos",
            ["Depoimento 1", "Depoimento 2", "Depoimento 3"],
            "Depoimento",
            [
              {
                key: "nome",
                label: "nome",
              },
              {
                key: "cargo",
                label: "cargo",
              },
              {
                key: "texto",
                label: "texto",
                rows: 4,
              },
            ],
          ),
        ],
      },
      {
        key: "faq",
        title: "FAQ",
        description:
          "Perguntas fixas: altere somente textos. Quantidade, ordem e comportamento permanecem como no site.",
        fields: Array.from({ length: 5 }, (_, index) => [
          text(`faq.${index}.pergunta`, `Pergunta ${index + 1}`),
          textarea(`faq.${index}.resposta`, `Resposta ${index + 1}`, 4),
        ]).flat(),
      },
      {
        key: "cta",
        title: "Chamada final",
        fields: [
          text("cta.titulo", "Titulo"),
          textarea("cta.descricao", "Descricao", 3),
          text("cta.botaoTexto", "Texto do botao"),
        ],
      },
    ],
  },

  "solicitar-cotacao": {
    slug: "solicitar-cotacao",
    title: "Solicitar Cotação",
    description:
      "Edite somente textos institucionais ao redor do formulario. O formulario funcional permanece fixo.",
    sections: [
      {
        key: "hero",
        title: "Cabeçalho do formulário",
        fields: [
          text("hero.etiqueta", "Etiqueta"),
          text("hero.titulo", "Titulo"),
          textarea("hero.descricao", "Descricao", 4),
        ],
      },
      {
        key: "apoio",
        title: "Textos de apoio",
        fields: [
          text("apoio.titulo", "Titulo"),
          textarea("apoio.texto", "Texto", 5),
        ],
      },
    ],
  },

  contatos: {
    slug: "contatos",
    title: "Contatos",
    description:
      "Edite textos institucionais da pagina de contatos. Formularios, links funcionais e acoes permanecem fixos.",
    sections: [
      {
        key: "hero",
        title: "Cabeçalho",
        fields: [
          text("hero.etiqueta", "Etiqueta"),
          text("hero.titulo", "Titulo"),
          textarea("hero.descricao", "Descricao", 4),
        ],
      },
      {
        key: "areas",
        title: "Áreas de contato",
        description:
          "Cards fixos: altere somente os textos. Icones, links, ordem e quantidade permanecem como no site.",
        fields: itemTextFields(
          "areasContato",
          [
            "Solicite uma cotação",
            "Seja um agregado",
            "Seja um fornecedor",
            "Frota e Manutenção",
            "Marketing e Comunicação",
            "Financeiro",
            "Jurídico",
            "Fiscal",
          ],
          "Área",
          [
            {
              key: "titulo",
              label: "título",
            },
          ],
        ),
      },
      {
        key: "canais",
        title: "Canais de atendimento",
        description:
          "Cards fixos: altere somente os textos. Links, icones, ordem e quantidade permanecem como no site.",
        fields: cardTextFields(
          "canaisAtendimento",
          ["Canal de ouvidoria", "Agregados", "Lei Geral de Proteção de Dados"],
          "Canal",
          "texto",
          "texto",
        ),
      },
      {
        key: "comunicacao",
        title: "Opções de comunicação",
        description:
          "Opções fixas do formulário: altere somente os textos exibidos.",
        fields: itemTextFields(
          "opcoesComunicacao",
          ["Elogio", "Reclamação", "Sugestão", "Outro assunto"],
          "Opção",
          [
            {
              key: "titulo",
              label: "título",
            },
          ],
        ),
      },
      {
        key: "unidades",
        title: "Nossas unidades",
        fields: [
          text("unidades.titulo", "Titulo"),
          textarea("unidades.descricao", "Descricao", 3),
        ],
      },
    ],
  },

  blog: {
    slug: "blog",
    title: "Blog",
    description:
      "Gerencie somente as publicações novas do blog. Os textos da listagem seguem o padrão do site.",
    sections: [],
  },

  "lei-geral-de-protecao-de-dados": {
    slug: "lei-geral-de-protecao-de-dados",
    title: "Lei Geral de Proteção de Dados",
    description:
      "Gerencie os textos da pagina legal de LGPD mantendo layout e icone atuais.",
    sections: [
      {
        key: "conteudo",
        title: "Conteudo legal",
        fields: [
          text("titulo", "Titulo"),
          textarea("resumo", "Resumo", 4),
          ...[2, 2, 2, 2, 2].flatMap((paragraphs, index) =>
            legalSectionFields(index, paragraphs),
          ),
        ],
      },
    ],
  },

  "politica-de-privacidade": {
    slug: "politica-de-privacidade",
    title: "Política de Privacidade",
    description:
      "Gerencie os textos da política de privacidade mantendo layout e icone atuais.",
    sections: [
      {
        key: "conteudo",
        title: "Conteudo legal",
        fields: [
          text("titulo", "Titulo"),
          textarea("resumo", "Resumo", 4),
          ...[2, 2, 2, 2, 2, 2].flatMap((paragraphs, index) =>
            legalSectionFields(index, paragraphs),
          ),
        ],
      },
    ],
  },

  "termos-de-uso": {
    slug: "termos-de-uso",
    title: "Termos de Uso",
    description:
      "Gerencie os textos dos termos de uso mantendo layout e icone atuais.",
    sections: [
      {
        key: "conteudo",
        title: "Conteudo legal",
        fields: [
          text("titulo", "Titulo"),
          textarea("resumo", "Resumo", 4),
          ...[2, 2, 2, 2, 2].flatMap((paragraphs, index) =>
            legalSectionFields(index, paragraphs),
          ),
        ],
      },
    ],
  },
};

export function getSitePageConfig(slug: string): SitePageConfig | null {
  return sitePageConfigs[slug] ?? null;
}
