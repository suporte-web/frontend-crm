'use client';

import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
  PackageSearch,
  Truck,
  UserCheck,
} from 'lucide-react';

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
      [key: string]: unknown;
    };
    items?: {
      item?: TrackingApiItem | TrackingApiItem[];
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type TrackingStage = {
  title: string;
  description: string;
  icon: typeof Package;
  reached: boolean;
  current: boolean;
  timestamp: string | null;
};

type DeadlineInfo = {
  label: string;
  detail: string;
  className: string;
};

type DeliveryDisplay = {
  title: string;
  value: string;
  detail: string;
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
    nro_nf: 'Numero da nota fiscal',
    pedido: 'Numero do pedido',
    chave_nfe: 'Chave da NFe',
    nro_coleta: 'Numero da coleta',
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeItems(data: unknown): TrackingApiItem[] {
  if (!isRecord(data)) return [];

  const response = data as TrackingApiResponse;
  const rawItems = response.tracking?.items?.item;

  if (!rawItems) return [];
  if (Array.isArray(rawItems)) return rawItems;
  return [rawItems];
}

function parseFlexibleDate(value?: string | null) {
  if (!value) return null;

  const nativeDate = new Date(value);

  if (!Number.isNaN(nativeDate.getTime())) {
    return nativeDate;
  }

  const match = value.match(
    /^(\d{2})[\/-](\d{2})[\/-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (!match) return null;

  const [, day, month, year, hour = '00', minute = '00', second = '00'] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatDateTime(date?: string | null) {
  if (!date) return '-';

  const parsed = parseFlexibleDate(date);

  if (!parsed) {
    return date;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

function formatDate(date?: string | null) {
  if (!date) return '-';

  const parsed = parseFlexibleDate(date);

  if (!parsed) {
    return date;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(parsed);
}

function findStringByKeys(value: unknown, keys: string[]): string | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findStringByKeys(entry, keys);

      if (found) {
        return found;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const [key, entryValue] of Object.entries(value)) {
    if (
      keys.includes(key) &&
      typeof entryValue === 'string' &&
      entryValue.trim()
    ) {
      return entryValue.trim();
    }
  }

  for (const entryValue of Object.values(value)) {
    const found = findStringByKeys(entryValue, keys);

    if (found) {
      return found;
    }
  }

  return null;
}

function getEstimatedDeliveryDate(data: TrackingApiResponse | null) {
  return findStringByKeys(data, [
    'previsao_entrega',
    'previsaoEntrega',
    'data_previsao_entrega',
    'dataPrevistaEntrega',
    'entrega_prevista',
    'prazo_entrega',
    'prazoEntrega',
    'previsao',
  ]);
}

function getTransportDocument(data: TrackingApiResponse | null) {
  return findStringByKeys(data, [
    'documento_transporte',
    'documentoTransporte',
    'nro_cte',
    'nr_cte',
    'cte',
    'conhecimento',
    'nro_documento',
  ]);
}

function getDestinationLabel(
  data: TrackingApiResponse | null,
  latestItem: TrackingApiItem | null,
) {
  const explicitDestination = findStringByKeys(data, [
    'cidade_destino',
    'cidadeDestino',
    'destino',
    'cidade_entrega',
    'cidadeEntrega',
  ]);

  if (explicitDestination) {
    return explicitDestination;
  }

  return latestItem?.cidade || '-';
}

function getStatusInfo(items: TrackingApiItem[]) {
  if (!items.length) {
    return {
      label: 'Sem movimentacoes',
      className: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    };
  }

  const latest = items[items.length - 1];
  const combinedText = `${latest.ocorrencia || ''} ${latest.tipo || ''}`.toUpperCase();

  if (combinedText.includes('ENTREGUE') || combinedText.includes('ENTREGA')) {
    return {
      label: 'Entregue',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }

  if (
    combinedText.includes('TRANSITO') ||
    combinedText.includes('TRANSPORTE') ||
    combinedText.includes('INFORMATIVO')
  ) {
    return {
      label: 'Em transito',
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

function getTrackingText(item: TrackingApiItem) {
  return `${item.ocorrencia || ''} ${item.tipo || ''} ${item.descricao || ''}`.toUpperCase();
}

function splitOccurrenceLabel(ocorrencia?: string) {
  const value = ocorrencia?.trim() || '';
  const match = value.match(/^(\d+)\s*-\s*(.+)$/);

  if (!match) {
    return {
      code: null,
      label: value || 'Movimentacao registrada',
    };
  }

  return {
    code: match[1],
    label: match[2],
  };
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function findLatestStageDate(items: TrackingApiItem[], keywords: string[]) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];

    if (includesAny(getTrackingText(item), keywords)) {
      return item.data_hora_efetiva || item.data_hora || null;
    }
  }

  return null;
}

function getTrackingStages(items: TrackingApiItem[]): TrackingStage[] {
  const processingKeywords = [
    'COLETA',
    'POSTADO',
    'EMBARQUE',
    'EXPEDICAO',
    'EXPEDI',
    'SEPARA',
    'PROCESS',
    'DOCUMENTO DE TRANSPORTE EMITIDO',
    'MERCADORIA RECEBIDA PARA TRANSPORTE',
  ];

  const transitKeywords = [
    'TRANSITO',
    'TRANSPORTE',
    'A CAMINHO',
    'TRANSFERENCIA',
    'ROTA',
    'SAIU PARA ENTREGA',
    'EM ENTREGA',
  ];

  const deliveredKeywords = [
    'ENTREGUE',
    'ENTREGA',
    'RECEBIDO',
    'RECEBEDOR',
    'ASSINADO',
    'COMPROVANTE',
  ];

  const hasItems = items.length > 0;
  const hasProcessing = items.some((item) =>
    includesAny(getTrackingText(item), processingKeywords),
  );
  const hasTransit = items.some((item) =>
    includesAny(getTrackingText(item), transitKeywords),
  );
  const hasDelivered = items.some((item) =>
    includesAny(getTrackingText(item), deliveredKeywords),
  );

  const currentStageIndex = hasDelivered
    ? 3
    : hasTransit
      ? 2
      : hasProcessing
        ? 1
        : hasItems
          ? 0
          : -1;

  return [
    {
      title: 'Pedido localizado',
      description: 'Consulta encontrada e embarque identificado.',
      icon: Package,
      reached: hasItems,
      current: currentStageIndex === 0,
      timestamp: hasItems
        ? items[0]?.data_hora_efetiva || items[0]?.data_hora || null
        : null,
    },
    {
      title: 'Em processamento',
      description: 'Documento emitido, coleta ou recebimento para transporte.',
      icon: PackageCheck,
      reached: hasProcessing || hasTransit || hasDelivered,
      current: currentStageIndex === 1,
      timestamp: findLatestStageDate(items, processingKeywords),
    },
    {
      title: 'Em rota',
      description: 'Carga em transito ou em roteiro de entrega.',
      icon: Truck,
      reached: hasTransit || hasDelivered,
      current: currentStageIndex === 2,
      timestamp: findLatestStageDate(items, transitKeywords),
    },
    {
      title: 'Entregue',
      description: 'Recebimento confirmado pelo destinatario.',
      icon: CheckCircle2,
      reached: hasDelivered,
      current: currentStageIndex === 3,
      timestamp: findLatestStageDate(items, deliveredKeywords),
    },
  ];
}

function getLocationLabel(item: TrackingApiItem) {
  const parts = [item.cidade, item.filial, item.dominio].filter(Boolean);
  return parts.join(' • ') || '-';
}

function getMovementVisual(item: TrackingApiItem) {
  const text =
    `${item.ocorrencia || ''} ${item.tipo || ''} ${item.descricao || ''}`.toUpperCase();

  if (
    text.includes('ENTREGUE') ||
    text.includes('ENTREGA') ||
    text.includes('RECEBIDO')
  ) {
    return {
      icon: CheckCircle2,
      iconWrapClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Entregue',
    };
  }

  if (
    text.includes('RECEBEDOR') ||
    text.includes('ASSINADO') ||
    text.includes('COMPROVANTE')
  ) {
    return {
      icon: UserCheck,
      iconWrapClass: 'bg-teal-100 text-teal-700 border-teal-200',
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      label: 'Recebimento',
    };
  }

  if (
    text.includes('TRANSITO') ||
    text.includes('TRANSPORTE') ||
    text.includes('A CAMINHO') ||
    text.includes('TRANSFERENCIA')
  ) {
    return {
      icon: Truck,
      iconWrapClass: 'bg-blue-100 text-blue-700 border-blue-200',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Em transito',
    };
  }

  if (
    text.includes('COLETA') ||
    text.includes('POSTADO') ||
    text.includes('EMBARQUE') ||
    text.includes('EXPEDICAO') ||
    text.includes('DOCUMENTO DE TRANSPORTE EMITIDO') ||
    text.includes('MERCADORIA RECEBIDA PARA TRANSPORTE')
  ) {
    return {
      icon: PackageCheck,
      iconWrapClass: 'bg-violet-100 text-violet-700 border-violet-200',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
      label: 'Processado',
    };
  }

  if (
    text.includes('PENDENTE') ||
    text.includes('AGUARDANDO') ||
    text.includes('ATRASO')
  ) {
    return {
      icon: Clock3,
      iconWrapClass: 'bg-amber-100 text-amber-700 border-amber-200',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Pendente',
    };
  }

  if (
    text.includes('ERRO') ||
    text.includes('RECUSA') ||
    text.includes('DEVOL') ||
    text.includes('OCORRENCIA')
  ) {
    return {
      icon: AlertCircle,
      iconWrapClass: 'bg-red-100 text-red-700 border-red-200',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      label: 'Atencao',
    };
  }

  return {
    icon: CircleDashed,
    iconWrapClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    badgeClass: 'bg-zinc-50 text-zinc-700 border-zinc-200',
    label: item.tipo || 'Movimentacao',
  };
}

function getDeadlineInfo(
  items: TrackingApiItem[],
  estimatedDelivery: string | null,
): DeadlineInfo {
  const deliveredKeywords = [
    'ENTREGUE',
    'ENTREGA',
    'RECEBIDO',
    'RECEBEDOR',
    'ASSINADO',
    'COMPROVANTE',
  ];

  const latestDeliveredAt = findLatestStageDate(items, deliveredKeywords);
  const estimatedDate = parseFlexibleDate(estimatedDelivery);
  const deliveredDate = parseFlexibleDate(latestDeliveredAt);

  if (deliveredDate) {
    if (estimatedDate && deliveredDate.getTime() > estimatedDate.getTime()) {
      return {
        label: 'Entregue com atraso',
        detail: `Conclusao registrada em ${formatDateTime(latestDeliveredAt)}.`,
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      };
    }

    return {
      label: 'Entregue no prazo',
      detail: `Baixa confirmada em ${formatDateTime(latestDeliveredAt)}.`,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    };
  }

  if (!estimatedDate) {
    return {
      label: 'Previsao pendente',
      detail: 'A consulta nao retornou data prevista de entrega.',
      className: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    };
  }

  const now = new Date();
  const remainingMs = estimatedDate.getTime() - now.getTime();
  const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));

  if (remainingMs < 0) {
    return {
      label: 'Prazo em atraso',
      detail: `Previsao encerrada em ${formatDate(estimatedDelivery)}.`,
      className: 'border-red-200 bg-red-50 text-red-800',
    };
  }

  if (remainingHours <= 24) {
    return {
      label: 'Entrega prevista hoje',
      detail: `Janela prevista ate ${formatDateTime(estimatedDelivery)}.`,
      className: 'border-blue-200 bg-blue-50 text-blue-800',
    };
  }

  return {
    label: 'Dentro do prazo',
    detail: `Entrega prevista para ${formatDate(estimatedDelivery)}.`,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  };
}

function getDeliveryDisplay(
  items: TrackingApiItem[],
  estimatedDelivery: string | null,
  destinationLabel: string,
): DeliveryDisplay {
  const deliveredKeywords = [
    'ENTREGUE',
    'ENTREGA',
    'RECEBIDO',
    'RECEBEDOR',
    'ASSINADO',
    'COMPROVANTE',
  ];

  const latestDeliveredAt = findLatestStageDate(items, deliveredKeywords);

  if (latestDeliveredAt) {
    return {
      title: 'Entrega concluida',
      value: formatDateTime(latestDeliveredAt),
      detail:
        destinationLabel !== '-'
          ? `Baixa final registrada para ${destinationLabel}.`
          : 'Baixa final registrada no historico da carga.',
    };
  }

  return {
    title: 'Previsao de entrega',
    value: formatDateTime(estimatedDelivery),
    detail:
      destinationLabel !== '-'
        ? `Destino operacional: ${destinationLabel}`
        : 'Sem destino detalhado no retorno.',
  };
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
    if (!isRecord(responseData)) return null;
    return responseData as TrackingApiResponse;
  }, [responseData]);

  const items = useMemo(() => normalizeItems(responseData), [responseData]);
  const latestItem = useMemo(() => getLatestItem(items), [items]);
  const statusInfo = useMemo(() => getStatusInfo(items), [items]);
  const trackingStages = useMemo(() => getTrackingStages(items), [items]);
  const estimatedDelivery = useMemo(
    () => getEstimatedDeliveryDate(trackingData),
    [trackingData],
  );
  const transportDocument = useMemo(
    () => getTransportDocument(trackingData),
    [trackingData],
  );
  const deadlineInfo = useMemo(
    () => getDeadlineInfo(items, estimatedDelivery),
    [estimatedDelivery, items],
  );
  const destinationLabel = useMemo(
    () => getDestinationLabel(trackingData, latestItem),
    [latestItem, trackingData],
  );
  const currentOccurrence = useMemo(
    () => splitOccurrenceLabel(latestItem?.ocorrencia),
    [latestItem?.ocorrencia],
  );
  const deliveryDisplay = useMemo(
    () => getDeliveryDisplay(items, estimatedDelivery, destinationLabel),
    [destinationLabel, estimatedDelivery, items],
  );
  const formattedResponse = useMemo(() => {
    if (!responseData) return '';
    return JSON.stringify(responseData, null, 2);
  }, [responseData]);

  const hasResponseData = responseData !== null;

  const selectedQueryLabel = getQueryTypeLabel(formData.tipoConsulta);
  const selectedQueryPlaceholder = getValueFieldPlaceholder(formData.tipoConsulta);

  function updateField<K extends keyof QueryTrackingPayload>(
    field: K,
    value: QueryTrackingPayload[K],
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
      setErrorMessage('Informe o CNPJ do destinatario.');
      return;
    }

    if (!formData.valor.trim()) {
      setErrorMessage(
        `Informe ${getQueryTypeLabel(formData.tipoConsulta).toLowerCase()}.`,
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
            : 'Erro ao consultar rastreamento.',
        );
      }

      setResponseData(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Nao foi possivel consultar o rastreamento.');
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />

          <div className="relative grid gap-0 xl:grid-cols-[0.82fr_1.18fr]">
            <div className="border-b border-slate-200/70 bg-[linear-gradient(135deg,#020617_0%,#0f172a_55%,#1d4ed8_100%)] p-6 text-white xl:border-b-0 xl:border-r xl:border-white/10 lg:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.20em] text-sky-100">
                <Package className="h-3.5 w-3.5" />
                Logistica
              </div>

              <h1 className="mt-5 max-w-xl text-3xl font-bold tracking-tight md:text-4xl">
                Rastreamento de encomenda
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
                Consulte a situacao da entrega pelo CNPJ e pelo identificador informado
                no contrato de rastreamento.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sky-100">
                    <Package className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-white">
                    Dados da consulta
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    CNPJ, tipo de busca e valor correspondente.
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sky-100">
                    <Truck className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-white">
                    Retorno operacional
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    Eventos, localizacao e ocorrencia atual.
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sky-100">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-white">
                    Prazo da entrega
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    Previsao, atraso ou baixa final registrada.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative p-6 lg:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.20em] text-blue-600">
                    Consulta
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                    Dados para rastreamento
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Informe os dados necessários para localizar a encomenda e acompanhar
                    a movimentação retornada pela transportadora.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Tipo atual
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedQueryLabel}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    CNPJ do destinatario
                  </label>

                  <Input
                    type="text"
                    value={formData.cnpj}
                    onChange={(event) =>
                      updateField('cnpj', formatCnpj(event.target.value))
                    }
                    placeholder="00.000.000/0000-00"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4 text-slate-900 shadow-none transition focus-visible:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo de consulta
                  </label>

                  <select
                    value={formData.tipoConsulta}
                    onChange={(event) =>
                      updateField(
                        'tipoConsulta',
                        event.target.value as TrackingQueryType,
                      )
                    }
                    className="flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="nro_nf">{getQueryTypeLabel('nro_nf')}</option>
                    <option value="pedido">{getQueryTypeLabel('pedido')}</option>
                    <option value="chave_nfe">{getQueryTypeLabel('chave_nfe')}</option>
                    <option value="nro_coleta">{getQueryTypeLabel('nro_coleta')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {selectedQueryLabel}
                  </label>

                  <Input
                    type="text"
                    value={formData.valor}
                    onChange={(event) => updateField('valor', event.target.value)}
                    placeholder={selectedQueryPlaceholder}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4 text-slate-900 shadow-none transition focus-visible:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sigla da empresa
                  </label>

                  <Input
                    type="text"
                    value={formData.siglaEmp}
                    onChange={(event) => updateField('siglaEmp', event.target.value)}
                    placeholder="Ex: ABC"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4 text-slate-900 shadow-none transition focus-visible:bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Senha de rastreamento
                  </label>

                  <Input
                    type="text"
                    value={formData.senha}
                    onChange={(event) => updateField('senha', event.target.value)}
                    placeholder="Preencha apenas se a consulta exigir senha"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4 text-slate-900 shadow-none transition focus-visible:bg-white"
                  />
                </div>
              </div>

              {errorMessage ? (
                <div className="mt-5 flex items-start gap-3 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <p>{errorMessage}</p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleSearchTracking}
                  disabled={isLoading}
                  className="h-12 rounded-2xl bg-blue-600 px-5 font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
                >
                  {isLoading ? 'Consultando...' : 'Rastrear encomenda'}
                </Button>

                <Button
                  type="button"
                  onClick={handleClear}
                  variant="outline"
                  className="h-12 rounded-2xl border-slate-200 bg-white px-5 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Limpar dados
                </Button>
              </div>
            </div>
          </div>
        </section>

        {!hasResponseData && !isLoading && !errorMessage && (
          <section className="rounded-[30px] border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Package className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-950">
              Nenhum rastreamento consultado
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Preencha os dados acima para localizar a entrega e visualizar o historico
              de movimentacoes.
            </p>
          </section>
        )}

        {isLoading && (
          <section className="rounded-[30px] border border-blue-200 bg-blue-50/80 p-8 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)]">
                <Truck className="h-6 w-6 animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-950">
                  Consultando rastreamento
                </h3>

                <p className="mt-1 text-sm leading-6 text-blue-700">
                  Aguarde enquanto buscamos as informacoes da encomenda e organizamos os
                  eventos retornados.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="h-20 animate-pulse rounded-2xl bg-white/70" />
              <div className="h-20 animate-pulse rounded-2xl bg-white/70" />
              <div className="h-20 animate-pulse rounded-2xl bg-white/70" />
            </div>
          </section>
        )}

        {hasResponseData && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-400" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      Consulta monitorada
                    </p>

                    <h2 className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-950">
                      {formData.valor || '-'}
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {transportDocument
                        ? `Documento ${transportDocument}`
                        : selectedQueryLabel}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <PackageSearch className="h-5 w-5" />
                  </div>
                </div>
              </article>

              <article className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 to-fuchsia-400" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      Ocorrencia atual
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {currentOccurrence.code ? (
                        <Badge
                          variant="outline"
                          className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          Codigo {currentOccurrence.code}
                        </Badge>
                      ) : null}

                      <Badge
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <h2 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-slate-950">
                      {currentOccurrence.label}
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                    <CircleDashed className="h-5 w-5" />
                  </div>
                </div>
              </article>

              <article className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-400" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      {deliveryDisplay.title}
                    </p>

                    <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
                      {deliveryDisplay.value}
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {deliveryDisplay.detail}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>
              </article>

              <article className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      Monitoramento de prazo
                    </p>

                    <div
                      className={`mt-3 rounded-2xl border px-4 py-3 ${deadlineInfo.className}`}
                    >
                      <p className="text-sm font-semibold">
                        {deadlineInfo.label}
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm opacity-80">
                        {deadlineInfo.detail}
                      </p>
                    </div>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                    <Clock3 className="h-5 w-5" />
                  </div>
                </div>
              </article>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
              <div className="border-b border-slate-200/70 px-6 py-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.20em] text-blue-600">
                      Acompanhamento
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                      Etapas da encomenda
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      A leitura abaixo usa as ocorrencias da API para mostrar a evolucao
                      operacional da carga.
                    </p>
                  </div>

                  <div className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    Fluxo da entrega
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="relative">
                  <div className="absolute left-6 top-6 hidden h-[calc(100%-3rem)] w-px bg-slate-200 lg:block" />

                  <div className="grid gap-4 lg:grid-cols-4">
                    {trackingStages.map((stage, index) => {
                      const Icon = stage.icon;

                      const isReached = stage.reached;
                      const isCurrent = stage.current;

                      const cardClass = isReached
                        ? isCurrent
                          ? 'border-blue-200 bg-blue-50/80'
                          : 'border-emerald-200 bg-emerald-50/80'
                        : 'border-slate-200 bg-slate-50/80';

                      const iconClass = isReached
                        ? isCurrent
                          ? 'bg-blue-600 text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)]'
                          : 'bg-emerald-600 text-white shadow-[0_14px_28px_rgba(5,150,105,0.18)]'
                        : 'bg-white text-slate-400 ring-1 ring-slate-200';

                      const titleClass = isReached
                        ? isCurrent
                          ? 'text-blue-950'
                          : 'text-emerald-950'
                        : 'text-slate-600';

                      const textClass = isReached
                        ? isCurrent
                          ? 'text-blue-700'
                          : 'text-emerald-700'
                        : 'text-slate-500';

                      const connectorClass = isReached ? 'bg-emerald-300' : 'bg-slate-200';

                      return (
                        <div key={stage.title} className="relative">
                          {index < trackingStages.length - 1 ? (
                            <div
                              className={`absolute left-[calc(50%+2rem)] right-[-1.25rem] top-6 hidden h-0.5 lg:block ${connectorClass}`}
                            />
                          ) : null}

                          <div
                            className={`group relative h-full overflow-hidden rounded-[26px] border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)] ${cardClass}`}
                          >
                            {isCurrent ? (
                              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-400" />
                            ) : null}

                            <div className="flex items-start gap-4 lg:flex-col">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className={`text-sm font-bold ${titleClass}`}>
                                    {stage.title}
                                  </h3>

                                  {isCurrent ? (
                                    <Badge className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                                      Atual
                                    </Badge>
                                  ) : null}

                                  {!isCurrent && isReached ? (
                                    <Badge className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                      Concluida
                                    </Badge>
                                  ) : null}
                                </div>

                                <p className={`mt-2 text-sm leading-6 ${textClass}`}>
                                  {stage.description}
                                </p>

                                <div className="mt-4 rounded-2xl bg-white/70 px-3 py-2 ring-1 ring-black/5">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Registro
                                  </p>

                                  <p className="mt-1 text-xs font-semibold text-slate-700">
                                    {stage.timestamp
                                      ? formatDateTime(stage.timestamp)
                                      : stage.reached
                                        ? 'Etapa confirmada'
                                        : 'Aguardando etapa'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

<section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
  <div className="border-b border-slate-200/70 px-6 py-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.20em] text-blue-600">
          Movimentações
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Histórico de movimentações
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Eventos retornados pela consulta de rastreamento, com destaque para
          ocorrência, local e data do registro.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setShowRawJson((prev) => !prev)}
        className="h-11 w-fit rounded-2xl border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
      >
        {showRawJson ? 'Ocultar JSON' : 'Ver JSON bruto'}
      </Button>
    </div>
  </div>

  <div className="p-6">
    {items.length === 0 ? (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
          <CircleDashed className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-950">
          Nenhuma movimentação encontrada
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          A consulta foi concluída, mas não retornou eventos de movimentação
          para esta encomenda.
        </p>
      </div>
    ) : (
      <div className="relative">
        <div className="absolute left-6 top-6 hidden h-[calc(100%-3rem)] w-px bg-slate-200 md:block" />

        <div className="space-y-4">
          {items.map((item, index) => {
            const visual = getMovementVisual(item);
            const occurrence = splitOccurrenceLabel(item.ocorrencia);
            const Icon = visual.icon;
            const isLast = index === items.length - 1;

            return (
              <article
                key={`${item.data_hora}-${index}`}
                className="group relative rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              >
                <div className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${visual.iconWrapClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {!isLast ? (
                      <div className="mt-2 h-full min-h-[48px] w-px bg-slate-200 md:hidden" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${visual.badgeClass}`}
                          >
                            {visual.label}
                          </Badge>

                          {item.tipo ? (
                            <Badge
                              variant="outline"
                              className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              {item.tipo}
                            </Badge>
                          ) : null}

                          {occurrence.code ? (
                            <Badge
                              variant="outline"
                              className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              Cod. {occurrence.code}
                            </Badge>
                          ) : null}
                        </div>

                        <h4 className="mt-3 text-base font-bold leading-6 text-slate-950">
                          {occurrence.label}
                        </h4>

                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                          {item.descricao ||
                            'Sem descrição adicional para esta movimentação.'}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-950">
                          {formatDateTime(
                            item.data_hora_efetiva || item.data_hora,
                          )}
                        </p>

                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Atualização
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin className="h-4 w-4" />

                          <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                            Local
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {getLocationLabel(item)}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock3 className="h-4 w-4" />

                          <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                            Data original
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {formatDateTime(item.data_hora)}
                        </p>
                      </div>
                    </div>

                    {item.nome_recebedor ? (
                      <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <span className="font-semibold">Recebedor:</span>{' '}
                        {item.nome_recebedor}
                        {item.nro_doc_recebedor
                          ? ` • Documento: ${item.nro_doc_recebedor}`
                          : ''}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    )}

    {showRawJson ? (
      <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
          <p className="text-sm font-semibold text-white">
            JSON retornado
          </p>

          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
            Debug
          </span>
        </div>

        <pre className="max-h-[420px] overflow-auto p-4 text-sm leading-6 text-slate-100">
          {formattedResponse}
        </pre>
      </div>
    ) : null}
  </div>
</section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
