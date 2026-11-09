'use client';
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { ClientFormData } from '@/components/clientes/client-form';
import { consultarCnpj } from '@/services/cnpj.service';
import { mesclarDadosCnpj } from '@/lib/cnpj-form';

export function useCnpjLookup(token: string | null, form: ClientFormData, setForm: Dispatch<SetStateAction<ClientFormData>>) {
  const requestRef = useRef<AbortController | null>(null);
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [cnpjError, setCnpjError] = useState('');
  useEffect(() => {
    setSearchingCnpj(false);
    return () => { requestRef.current?.abort(); requestRef.current = null; };
  }, [token]);

  async function searchCnpj() {
    if (requestRef.current) return;
    setCnpjError('');
    if (!token) { setCnpjError('Sua sessão expirou. Entre novamente para consultar o CNPJ. O preenchimento manual continua disponível.'); return; }
    if (!/^\d{14}$/.test(form.document.replace(/[.\/\-\s]/g, ''))) {
      setCnpjError('Informe os 14 números do CNPJ. Você também pode preencher os dados manualmente.'); return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setSearchingCnpj(true);
    const snapshot = { ...form };
    try {
      const data = await consultarCnpj(snapshot.document, token, controller.signal);
      if (!controller.signal.aborted) setForm(current => mesclarDadosCnpj(current, data, snapshot));
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = error instanceof Error ? error.message : 'Não foi possível consultar o CNPJ.';
        setCnpjError(/manualmente|manual/i.test(message) ? message : `${message} Você pode continuar preenchendo os dados manualmente.`);
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setSearchingCnpj(false);
      }
    }
  }
  return { searchingCnpj, cnpjError, searchCnpj, clearCnpjError: () => setCnpjError('') };
}
