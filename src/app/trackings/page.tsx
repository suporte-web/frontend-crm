'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';

type TrackingQueryType =
  | 'nro_nf'
  | 'pedido'
  | 'chave_nfe'
  | 'nro_coleta';

type QueryTrackingPayload = {
  cnpj: string;
  senha?: string;
  siglaEmp?: string;
  tipoConsulta: TrackingQueryType;
  valor: string;
};

type TrackingApiItem = {
  data_hora?: string;
  dominio?: string;
  filial?: string;
  cidade?: string;
  ocorrencia?: string;
  descricao?: string;
  tipo?: string;
  data_hora_efetiva?: string;
  nome_recebedor?: string;
  nro_doc_recebedor?: string;
};

type TrackingApiResponse = {
  tracking?: {
    success?: boolean;
    message?: string;
    header?: {
      remetente?: string;
      destinatario?: string;
    };
    items?: {
      item?: TrackingApiItem | TrackingApiItem[];
    };
  };
};

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function getQueryTypeLabel(type: TrackingQueryType) {
  const map: Record<TrackingQueryType, string> = {
    nro_nf: 'Número da nota fiscal',
    pedido: 'Número do pedido',
    chave_nfe: 'Chave da NFe',
    nro_coleta: 'Número da coleta',
  };

  return map[type];
}

function getValueFieldPlaceholder(type: TrackingQueryType) {
  const map: Record<TrackingQueryType, string> = {
    nro_nf: 'Ex: 12345678',
    pedido: 'Ex: PED-2026-001',
    chave_nfe: 'Ex: 43160400850257000132550010000083991000083990',
    nro_coleta: 'Ex: COL-123456',
  };

  return map[type];
}

function normalizeItems(data: unknown): TrackingApiItem[] {
  if (!data || typeof data !== 'object') return [];

  const response = data as TrackingApiResponse;
  const rawItems = response.tracking?.items?.item;

  if (!rawItems) return [];
  if (Array.isArray(rawItems)) return rawItems;
  return [rawItems];
}

function formatDateTime(date?: string) {
  if (!date) return '-';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

function getStatusInfo(items: TrackingApiItem[]) {
  if (!items.length) {
    return {
      label: 'Sem movimentações',
      className: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    };
  }

  const latest = items[items.length - 1];
  const ocorrencia = (latest.ocorrencia || '').toUpperCase();
  const tipo = (latest.tipo || '').toUpperCase();
  const descricao = `${ocorrencia} ${tipo}`;

  if (descricao.includes('ENTREGUE') || descricao.includes('ENTREGA')) {
    return {
      label: 'Entregue',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }

  if (
    descricao.includes('TRANSITO') ||
    descricao.includes('TRANSPORTE') ||
    descricao.includes('INFORMATIVO')
  ) {
    return {
      label: 'Em trânsito',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    };
  }

  return {
    label: latest.ocorrencia || latest.tipo || 'Em processamento',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };
}

function getLatestItem(items: TrackingApiItem[]) {
  if (!items.length) return null;
  return items[items.length - 1];
}

function getLocationLabel(item: TrackingApiItem) {
  const parts = [item.cidade, item.filial, item.dominio].filter(Boolean);
  return parts.join(' • ') || '-';
}

export default function TrackingsPage() {
  const [formData, setFormData] = useState<QueryTrackingPayload>({
    cnpj: '',
    senha: '',
    siglaEmp: '',
    tipoConsulta: 'nro_nf',
    valor: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [responseData, setResponseData] = useState<unknown>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const trackingData = useMemo(() => {
    if (!responseData || typeof responseData !== 'object') return null;
    return responseData as TrackingApiResponse;
  }, [responseData]);

  const items = useMemo(() => normalizeItems(responseData), [responseData]);
  const latestItem = useMemo(() => getLatestItem(items), [items]);
  const statusInfo = useMemo(() => getStatusInfo(items), [items]);

  const formattedResponse = useMemo(() => {
    if (!responseData) return '';
    return JSON.stringify(responseData, null, 2);
  }, [responseData]);

  const hasResponseData = responseData !== null;

  function updateField<K extends keyof QueryTrackingPayload>(
    field: K,
    value: QueryTrackingPayload[K]
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSearchTracking() {
    setErrorMessage('');
    setResponseData(null);

    if (!formData.cnpj.trim()) {
      setErrorMessage('Informe o CNPJ do destinatário.');
      return;
    }

    if (!formData.valor.trim()) {
      setErrorMessage(
        `Informe ${getQueryTypeLabel(formData.tipoConsulta).toLowerCase()}.`
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload: QueryTrackingPayload = {
        cnpj: formData.cnpj.replace(/\D/g, ''),
        tipoConsulta: formData.tipoConsulta,
        valor: formData.valor.trim(),
        ...(formData.senha?.trim() && { senha: formData.senha.trim() }),
        ...(formData.siglaEmp?.trim() && { siglaEmp: formData.siglaEmp.trim() }),
      };

      const response = await fetch(`${apiBaseUrl}/trackings/public-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.message === 'string'
            ? data.message
            : 'Erro ao consultar rastreamento.'
        );
      }

      setResponseData(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Não foi possível consultar o rastreamento.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setFormData({
      cnpj: '',
      senha: '',
      siglaEmp: '',
      tipoConsulta: 'nro_nf',
      valor: '',
    });
    setErrorMessage('');
    setResponseData(null);
    setShowRawJson(false);
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Logística</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                  Rastreamento de encomenda
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-zinc-600">
                  Consulte a situação da entrega informando o CNPJ, o tipo de
                  consulta e o valor correspondente. A busca será feita pelo seu
                  backend, que por sua vez consulta a SSW.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                  Voltar ao dashboard
                </Link>

                <Link
                  href="/quotes"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                  Cotações
                </Link>

                <Link
                  href="/clients"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                  Clientes
                </Link>

                <Link
                  href="/tickets"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                  Tickets
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Dados para consulta
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Preencha os campos conforme o contrato do endpoint público de
                  rastreamento.
                </p>
              </div>

              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      CNPJ do destinatário
                    </label>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => updateField('cnpj', formatCnpj(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Tipo de consulta
                    </label>
                    <select
                      value={formData.tipoConsulta}
                      onChange={(e) =>
                        updateField('tipoConsulta', e.target.value as TrackingQueryType)
                      }
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                    >
                      <option value="nro_nf">{getQueryTypeLabel('nro_nf')}</option>
                      <option value="pedido">{getQueryTypeLabel('pedido')}</option>
                      <option value="chave_nfe">{getQueryTypeLabel('chave_nfe')}</option>
                      <option value="nro_coleta">{getQueryTypeLabel('nro_coleta')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      {getQueryTypeLabel(formData.tipoConsulta)}
                    </label>
                    <input
                      type="text"
                      value={formData.valor}
                      onChange={(e) => updateField('valor', e.target.value)}
                      placeholder={getValueFieldPlaceholder(formData.tipoConsulta)}
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Sigla da empresa
                    </label>
                    <input
                      type="text"
                      value={formData.siglaEmp}
                      onChange={(e) => updateField('siglaEmp', e.target.value)}
                      placeholder="Ex: ABC"
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Senha de rastreamento
                    </label>
                    <input
                      type="text"
                      value={formData.senha}
                      onChange={(e) => updateField('senha', e.target.value)}
                      placeholder="Preencha apenas se a consulta exigir senha"
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSearchTracking}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? 'Consultando...' : 'Rastrear encomenda'}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Limpar dados
                  </button>
                </div>
              </div>
            </div>
          </section>

          {!hasResponseData && !isLoading && !errorMessage && (
            <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-900">
                Nenhum rastreamento consultado
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Escolha o tipo de consulta e informe os dados para localizar a entrega.
              </p>
            </section>
          )}

          {isLoading && (
            <section className="rounded-3xl border border-blue-200 bg-blue-50 p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-blue-800">
                Consultando rastreamento
              </h3>
              <p className="mt-2 text-sm text-blue-700">
                Aguarde enquanto buscamos as informações da encomenda.
              </p>
            </section>
          )}

          {hasResponseData && (
            <>
              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-zinc-500">Consulta</p>
                  <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                    {formData.valor || '-'}
                  </h2>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-zinc-500">Status</p>
                  <div className="mt-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-zinc-500">Mensagem</p>
                  <h2 className="mt-2 text-base font-semibold text-zinc-900">
                    {trackingData?.tracking?.message || '-'}
                  </h2>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-zinc-500">Última atualização</p>
                  <h2 className="mt-2 text-base font-semibold text-zinc-900">
                    {formatDateTime(latestItem?.data_hora_efetiva || latestItem?.data_hora)}
                  </h2>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-1">
                  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      Dados do embarque
                    </h3>

                    <div className="mt-6 space-y-4">
                      <div>
                        <p className="text-sm text-zinc-500">Remetente</p>
                        <p className="mt-1 text-sm font-semibold text-zinc-900">
                          {trackingData?.tracking?.header?.remetente || '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-zinc-500">Destinatário</p>
                        <p className="mt-1 text-sm font-semibold text-zinc-900">
                          {trackingData?.tracking?.header?.destinatario || '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-zinc-500">Tipo de consulta</p>
                        <p className="mt-1 text-sm font-semibold text-zinc-900">
                          {getQueryTypeLabel(formData.tipoConsulta)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-zinc-500">CNPJ informado</p>
                        <p className="mt-1 text-sm font-semibold text-zinc-900">
                          {formData.cnpj || '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-zinc-500">Última unidade</p>
                        <p className="mt-1 text-sm font-semibold text-zinc-900">
                          {latestItem ? getLocationLabel(latestItem) : '-'}
                        </p>
                      </div>

                      {latestItem?.nome_recebedor && (
                        <div>
                          <p className="text-sm text-zinc-500">Recebedor</p>
                          <p className="mt-1 text-sm font-semibold text-zinc-900">
                            {latestItem.nome_recebedor}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-2">
                  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          Histórico de movimentações
                        </h3>
                        <p className="text-sm text-zinc-500">
                          Eventos retornados pela consulta de rastreamento.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowRawJson((prev) => !prev)}
                        className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                      >
                        {showRawJson ? 'Ocultar JSON' : 'Ver JSON bruto'}
                      </button>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
                      <div className="hidden grid-cols-12 gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 md:grid">
                        <div className="col-span-3">Data / Hora</div>
                        <div className="col-span-3">Unidade</div>
                        <div className="col-span-6">Situação</div>
                      </div>

                      <div className="divide-y divide-zinc-200">
                        {items.length === 0 && (
                          <div className="p-6 text-sm text-zinc-500">
                            Nenhuma movimentação encontrada.
                          </div>
                        )}

                        {items.map((item, index) => (
                          <div
                            key={`${item.data_hora}-${index}`}
                            className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-12"
                          >
                            <div className="md:col-span-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 md:hidden">
                                Data / Hora
                              </p>
                              <p className="text-sm font-semibold text-zinc-900">
                                {formatDateTime(item.data_hora)}
                              </p>
                            </div>

                            <div className="md:col-span-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 md:hidden">
                                Unidade
                              </p>
                              <p className="text-sm font-semibold text-zinc-900">
                                {item.cidade || '-'}
                              </p>
                              <p className="mt-1 text-sm text-zinc-500">
                                {[item.dominio, item.filial].filter(Boolean).join(' / ') || '-'}
                              </p>
                            </div>

                            <div className="md:col-span-6">
                              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 md:hidden">
                                Situação
                              </p>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                                  {item.tipo || 'Sem tipo'}
                                </span>
                              </div>

                              <p className="mt-2 text-sm font-semibold text-zinc-900">
                                {item.ocorrencia || '-'}
                              </p>

                              <p className="mt-1 text-sm text-zinc-600">
                                {item.descricao || '-'}
                              </p>

                              {item.nome_recebedor && (
                                <p className="mt-2 text-sm text-zinc-500">
                                  <span className="font-semibold text-zinc-700">Recebedor:</span>{' '}
                                  {item.nome_recebedor}
                                  {item.nro_doc_recebedor
                                    ? ` • Documento: ${item.nro_doc_recebedor}`
                                    : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {showRawJson && (
                      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
                        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700">
                          JSON retornado
                        </div>
                        <pre className="overflow-x-auto p-4 text-sm text-zinc-800">
                          {formattedResponse}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}