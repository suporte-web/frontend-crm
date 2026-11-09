/** Primeira letra maiúscula e demais minúsculas, preservando acentos. */
export function formatarNomeCadastro(valor?: string | null) {
  const nome = (valor ?? '').trim().replace(/\s+/g, ' ').normalize('NFC').toLocaleLowerCase('pt-BR');
  return nome.replace(/\p{L}/u, letra => letra.toLocaleUpperCase('pt-BR'));
}

/** Altera apenas os nomes da empresa; contatos, documentos e demais dados são preservados. */
export function normalizarNomesCadastro<T extends object>(registro: T): T {
  const normalizado = { ...registro };
  const campos = normalizado as Record<string, unknown>;
  for (const campo of ['name', 'company', 'companyName', 'legalName', 'tradeName']) {
    if (typeof campos[campo] === 'string') campos[campo] = formatarNomeCadastro(campos[campo]);
  }
  return normalizado;
}

/** O nome da pessoa do Lead permanece separado do nome da empresa. */
export function normalizarEmpresaLead<T extends { company?: string | null }>(registro: T): T {
  return typeof registro.company === 'string' ? { ...registro, company: formatarNomeCadastro(registro.company) } : registro;
}
