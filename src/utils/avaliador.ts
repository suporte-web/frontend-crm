const TOKEN_KEY = "avaliador-token";

let tokenEmMemoria: string | null = null;

function uuidV4Fallback(): string {
  const bytes = new Uint8Array(16);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes).map((byte) =>
    byte.toString(16).padStart(2, "0"),
  );

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

function gerarToken(): string {
  return window.crypto?.randomUUID?.() ?? uuidV4Fallback();
}

export function getOrCreateAvaliadorToken(): string {
  if (tokenEmMemoria) {
    return tokenEmMemoria;
  }

  const tokenExistente = localStorage.getItem(TOKEN_KEY);

  if (tokenExistente?.trim()) {
    tokenEmMemoria = tokenExistente;
    return tokenExistente;
  }

  const novoToken = gerarToken();

  localStorage.setItem(TOKEN_KEY, novoToken);
  tokenEmMemoria = novoToken;

  return novoToken;
}

export function getAvaliadorToken(): string {
  return getOrCreateAvaliadorToken();
}