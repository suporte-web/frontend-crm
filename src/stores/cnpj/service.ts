import { Api } from '@/utils/Api';
export interface CnpjData {
  cnpj: string;
  legalName: string;
  tradeName: string;
  cnae: string;
  cnaeDescription: string;
  segmento?: { id: string; nome: string; prefixo: string } | null;
  phone: string;
  email: string;
  status: string;
  simpleNational: boolean | null;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  provider: 'minhareceita' | 'opencnpj' | 'brasilapi';
}
export class CnpjLookupError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) { super(message); }
}

export const CnpjService = {
  consultarCnpj: async (document: string, signal?: AbortSignal): Promise<CnpjData> => {
    const cnpj = document.replace(/[./\-\s]/g, '');
    // Três tentativas de no máximo 30 s no backend, mais margem de rede.
    const deadline = AbortSignal.timeout(95000);
    const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
    let response: {
      status: number;
      data: CnpjData & {
        message?: string;
        code?: string;
      };
    };
    try {
      response = await Api.get<CnpjData & {
        message?: string;
        code?: string;
      }>(`/cnpj/${encodeURIComponent(cnpj)}`, { headers: { 'Cache-Control': 'no-cache' }, signal: combined, validateStatus: () => true });
    }
    catch (error) {
      if (signal?.aborted)
        throw error;
      throw new CnpjLookupError(deadline.aborted
        ? 'A consulta excedeu o tempo de espera. Você pode preencher os dados manualmente.'
        : 'Não foi possível conectar ao serviço de CNPJ. Você pode preencher os dados manualmente.', 503, deadline.aborted ? 'CNPJ_TIMEOUT' : 'CNPJ_UNAVAILABLE');
    }
    const body = response.data;
    if (!(response.status >= 200 && response.status < 300)) {
      const message = typeof body?.message === 'string' ? body.message :
        response.status === 400 ? 'CNPJ inválido. Confira os números informados.' :
          response.status === 404 ? 'CNPJ não encontrado nas bases consultadas.' :
            response.status === 401 || response.status === 403 ? 'Sua sessão não permite consultar CNPJ. Verifique seu acesso.' :
              'Consulta de CNPJ temporariamente indisponível. Você pode preencher os dados manualmente.';
      throw new CnpjLookupError(message, response.status, typeof body?.code === 'string' ? body.code : 'CNPJ_LOOKUP_FAILED');
    }
    if (body?.cnpj !== cnpj || typeof body?.legalName !== 'string' || !body?.address) {
      throw new CnpjLookupError('A consulta retornou dados inválidos. Você pode preencher os dados manualmente.', 502, 'CNPJ_INVALID_RESPONSE');
    }
    return body as CnpjData;
  },
};
