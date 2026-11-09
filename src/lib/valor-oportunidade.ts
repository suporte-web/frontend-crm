type ValoresOportunidade = {
  value?: string | number | null;
  valorPropostaComercial?: string | number | null;
};

/** O valor explícito zero é preservado; ausência de valor nunca é convertida em zero. */
export function formatarValorOportunidade(oportunidade: ValoresOportunidade): string {
  const valor = oportunidade.value ?? oportunidade.valorPropostaComercial;
  if (valor === null || valor === undefined || (typeof valor === 'string' && !valor.trim())) {
    return 'Não informado';
  }
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'Não informado';
}

export function origemValorOportunidade(oportunidade: ValoresOportunidade): string {
  return oportunidade.value === null || oportunidade.value === undefined
    ? (oportunidade.valorPropostaComercial !== null && oportunidade.valorPropostaComercial !== undefined
      ? 'Valor da proposta comercial' : 'Valor da oportunidade')
    : 'Valor da oportunidade';
}

/** Aceita entrada brasileira e decimal simples; não soma taxas de unidades diferentes. */
export function converterValorTotalOportunidade(texto: string): number | null {
  const entrada = texto.trim().replace(/^R\$\s*/i, '');
  if (!entrada) return null;
  let normalizado: string;
  if (entrada.includes(',')) {
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(entrada)) {
      throw new Error('Informe um valor total válido, como 1.234,56, sem valores negativos.');
    }
    normalizado = entrada.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(entrada)) {
    normalizado = entrada.replace(/\./g, '');
  } else if (/^\d+(?:\.\d{1,2})?$/.test(entrada)) {
    normalizado = entrada;
  } else {
    throw new Error('Informe um valor total válido, como 1.234,56, sem valores negativos.');
  }
  const valor = Number(normalizado);
  if (!Number.isFinite(valor) || !Number.isSafeInteger(Math.round(valor * 100))) {
    throw new Error('Informe um valor total válido dentro do limite permitido.');
  }
  return valor;
}

export function formatarCampoValorTotal(valor?: number | null): string {
  return valor === null || valor === undefined || !Number.isFinite(valor) ? ''
    : valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Máscara de centavos: cada dígito desloca o valor duas casas decimais. */
export function mascararValorMonetario(texto: string): string {
  const digitos = texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digitos) return '';
  const centavos = digitos.padStart(3, '0');
  return centavos.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + centavos.slice(-2);
}

/** Formata dados já salvos sem interpretá-los como novos dígitos de centavos. */
export function formatarValorMonetarioSalvo(valor?: string | number | null): string {
  if (valor === null || valor === undefined || valor === '') return '';
  try { return formatarCampoValorTotal(typeof valor === 'number' ? valor : converterValorTotalOportunidade(valor)); }
  catch { return String(valor); }
}
