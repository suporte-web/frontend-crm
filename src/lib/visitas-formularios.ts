type Formulario = Record<string, string>;
const necessario = (v: string | undefined, campo: string) => {
  if (!v?.trim()) throw new Error("Informe " + campo + ".");
  return v.trim();
};
const booleano = (v: string | undefined, campo: string) => {
  if (v !== "true" && v !== "false")
    throw new Error("Selecione " + campo + ".");
  return v === "true";
};
const opcionais = (f: Formulario, campos: string[]) =>
  Object.fromEntries(
    campos.filter((c) => f[c]?.trim()).map((c) => [c, f[c].trim()]),
  );
export function montarRealizacao(f: Formulario) {
  const teveCusto = booleano(f.teveCusto, "se houve custo");
  const custo = teveCusto
    ? Number((f.custo || "").replace(",", "."))
    : undefined;
  if (teveCusto && (!Number.isFinite(custo) || !custo || custo <= 0))
    throw new Error("Informe o custo da visita.");
  return {
    dataRealizada: new Date(
      necessario(f.dataRealizada, "a data realizada"),
    ).toISOString(),
    relato: necessario(f.relato, "o relato"),
    pessoaAtendeu: necessario(f.pessoaAtendeu, "quem atendeu"),
    teveCusto,
    ...(teveCusto ? { custo } : {}),
    ...opcionais(f, [
      "insights",
      "pontosPositivos",
      "pontosAtencao",
      "contatoPessoaAtendeu",
      "emailPessoaAtendeu",
    ]),
  };
}
export function montarPosVisita(f: Formulario, reagendada: boolean) {
  const novaDataAceita = reagendada
    ? booleano(f.novaDataAceita, "se a nova data foi aceita")
    : undefined;
  if (novaDataAceita === false)
    return {
      novaDataAceita,
      gerarSac: false,
      ajustesNecessarios: necessario(
        f.ajustesNecessarios,
        "o ajuste necessário",
      ),
      atingiuObjetivo: booleano(f.atingiuObjetivo, "se atingiu o objetivo"),
      sentimentoCliente: necessario(
        f.sentimentoCliente,
        "o sentimento do cliente",
      ),
      possuiMelhoria: booleano(f.possuiMelhoria, "se há melhoria"),
      classificacao: necessario(f.classificacao, "a classificação"),
      ...(f.possuiMelhoria === "true"
        ? {
            melhoriaIdentificada: necessario(
              f.melhoriaIdentificada,
              "a melhoria identificada",
            ),
          }
        : {}),
    };
  const possuiMelhoria = booleano(f.possuiMelhoria, "se há melhoria");
  const gerarSac = booleano(f.gerarSac, "se deve gerar atendimento SAC");
  return {
    ...(reagendada ? { novaDataAceita } : {}),
    atingiuObjetivo: booleano(f.atingiuObjetivo, "se atingiu o objetivo"),
    sentimentoCliente: necessario(
      f.sentimentoCliente,
      "o sentimento do cliente",
    ),
    possuiMelhoria,
    ...(possuiMelhoria
      ? {
          melhoriaIdentificada: necessario(
            f.melhoriaIdentificada,
            "a melhoria identificada",
          ),
        }
      : {}),
    classificacao: necessario(f.classificacao, "a classificação"),
    gerarSac,
    ...(gerarSac
      ? {
          tipoReclamacao: necessario(f.tipoReclamacao, "o tipo da reclamação"),
          relatoSac: necessario(f.relatoSac, "o relato do SAC"),
          ...opcionais(f, ["email", "telefone", "cidade", "estado"]),
        }
      : {}),
  };
}

export function montarClienteVisita(f: Formulario) {
  const clienteNome = necessario(f.clienteNome, "o nome do cliente");
  if (clienteNome.length < 2 || clienteNome.length > 150) throw new Error("O nome do cliente deve ter entre 2 e 150 caracteres.");
  return { clienteNome, cnpj: (f.cnpj || "").trim() };
}
