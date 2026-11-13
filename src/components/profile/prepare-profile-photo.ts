/** Converte a imagem escolhida em um retrato quadrado, sem metadados do arquivo original. */
export async function prepareProfilePhoto(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Escolha uma imagem de até 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url;
    await image.decode().catch(() => { throw new Error('Não foi possível abrir essa imagem. Escolha outra foto.'); });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('Escolha uma foto com resolução menor.');
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a foto neste navegador.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, 512, 512);
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível preparar sua foto.')), 'image/jpeg', .9));
  } finally { URL.revokeObjectURL(url); }
}
