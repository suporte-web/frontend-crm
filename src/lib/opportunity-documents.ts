export const OPPORTUNITY_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;
export const OPPORTUNITY_DOCUMENT_LIMIT_MESSAGE =
  'Cada arquivo deve ter no máximo 20 MB. Reduza o tamanho do arquivo e tente novamente.';

export function validarDocumentosOportunidade(files: ReadonlyArray<{ name: string; size: number }>): string {
  if (files.length > 20) return 'Selecione no máximo 20 arquivos por envio.';
  const file = files.find(item => item.size > OPPORTUNITY_DOCUMENT_MAX_BYTES);
  return file ? `O arquivo "${file.name}" ultrapassa o limite de 20 MB. Reduza o tamanho do arquivo e tente novamente.` : '';
}
