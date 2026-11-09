import { normalizarNomesCadastro } from '@/lib/nome-cadastro';
import type { ClientFormData } from '@/components/clientes/client-form';
import type { CnpjData } from '@/services/cnpj.service';

export function mesclarDadosCnpj(current: ClientFormData, data: CnpjData, snapshot: ClientFormData): ClientFormData {
  if (current.document.replace(/[.\/\-\s]/g, '') !== data.cnpj) return current;
  const cep = data.address.zipCode?.replace(/\D/g, '') ?? '';
  const patch: Partial<ClientFormData> = {
    legalName: data.legalName, tradeName: data.tradeName,
    companyName: data.tradeName || data.legalName, cnae: data.cnae,
    businessActivity: data.cnaeDescription, segment: data.cnaeDescription,
    taxRegime: data.simpleNational === true ? 'Simples Nacional' : '', phone: data.phone,
    zipCode: cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : '',
    street: data.address.street, number: data.address.number, complement: data.address.complement,
    neighborhood: data.address.neighborhood, city: data.address.city, state: data.address.state,
  };
  const result = { ...current };
  for (const key of Object.keys(patch) as Array<keyof ClientFormData>) {
    const value = patch[key];
    if (typeof value === 'string' && value.trim() && current[key] === snapshot[key]) {
      // status não faz parte dos campos preenchidos pela consulta.
      Object.assign(result, { [key]: value.trim() });
    }
  }
  return normalizarNomesCadastro(result);
}
