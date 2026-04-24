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
        <Card className="rounded-3xl border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100 pb-6">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-zinc-500">Logistica</p>
              <CardTitle className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                Rastreamento de encomenda
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-zinc-600">
                Consulte a situacao da entrega informando o CNPJ, o tipo de
                consulta e o valor correspondente. A busca e feita pelo backend
                e traduzida aqui como painel de monitoramento de prazo.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="max-w-2xl">
              <CardTitle className="text-lg text-zinc-900">
                Dados para consulta
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-zinc-500">
                Preencha os campos conforme o contrato do endpoint publico de
                rastreamento.
              </CardDescription>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  CNPJ do destinatario
                </label>
                <Input
                  type="text"
                  value={formData.cnpj}
                  onChange={(event) =>
                    updateField('cnpj', formatCnpj(event.target.value))
                  }
                  placeholder="00.000.000/0000-00"
                  className="h-12 rounded-2xl"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
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
                  className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="nro_nf">{getQueryTypeLabel('nro_nf')}</option>
                  <option value="pedido">{getQueryTypeLabel('pedido')}</option>
                  <option value="chave_nfe">
                    {getQueryTypeLabel('chave_nfe')}
                  </option>
                  <option value="nro_coleta">
                    {getQueryTypeLabel('nro_coleta')}
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  {getQueryTypeLabel(formData.tipoConsulta)}
                </label>
                <Input
                  type="text"
                  value={formData.valor}
                  onChange={(event) => updateField('valor', event.target.value)}
                  placeholder={getValueFieldPlaceholder(formData.tipoConsulta)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Sigla da empresa
                </label>
                <Input
                  type="text"
                  value={formData.siglaEmp}
                  onChange={(event) =>
                    updateField('siglaEmp', event.target.value)
                  }
                  placeholder="Ex: ABC"
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Senha de rastreamento
                </label>
                <Input
                  type="text"
                  value={formData.senha}
                  onChange={(event) => updateField('senha', event.target.value)}
                  placeholder="Preencha apenas se a consulta exigir senha"
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleSearchTracking}
                disabled={isLoading}
                className="h-12 rounded-2xl px-5"
              >
                {isLoading ? 'Consultando...' : 'Rastrear encomenda'}
              </Button>

              <Button
                type="button"
                onClick={handleClear}
                variant="outline"
                className="h-12 rounded-2xl px-5"
              >
                Limpar dados
              </Button>
            </div>
          </CardContent>
        </Card>

        {!hasResponseData && !isLoading && !errorMessage && (
          <Card className="rounded-3xl border-dashed border-zinc-300 shadow-sm">
            <CardContent className="p-10 text-center">
              <h3 className="text-lg font-semibold text-zinc-900">
                Nenhum rastreamento consultado
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Escolha o tipo de consulta e informe os dados para localizar a
                entrega.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Card className="rounded-3xl border-blue-200 bg-blue-50 shadow-sm">
            <CardContent className="p-10 text-center">
              <h3 className="text-lg font-semibold text-blue-800">
                Consultando rastreamento
              </h3>
              <p className="mt-2 text-sm text-blue-700">
                Aguarde enquanto buscamos as informacoes da encomenda.
              </p>
            </CardContent>
          </Card>
        )}

        {hasResponseData && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-3xl border-zinc-200 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">Consulta monitorada</p>
                  <h2 className="mt-2 text-xl font-bold text-zinc-900">
                    {formData.valor || '-'}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    {transportDocument
                      ? `Documento ${transportDocument}`
                      : getQueryTypeLabel(formData.tipoConsulta)}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-zinc-200 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">Ocorrencia atual</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {currentOccurrence.code && (
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-1 text-xs font-semibold text-zinc-700"
                      >
                        Codigo {currentOccurrence.code}
                      </Badge>
                    )}
                    <Badge
                      className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-zinc-900">
                    {currentOccurrence.label}
                  </h2>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-zinc-200 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">{deliveryDisplay.title}</p>
                  <h2 className="mt-2 text-base font-semibold text-zinc-900">
                    {deliveryDisplay.value}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">{deliveryDisplay.detail}</p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-zinc-200 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-500">
                    Monitoramento de prazo
                  </p>
                  <div
                    className={`mt-3 rounded-2xl border px-4 py-3 ${deadlineInfo.className}`}
                  >
                    <p className="text-sm font-semibold">{deadlineInfo.label}</p>
                    <p className="mt-1 text-sm opacity-80">
                      {deadlineInfo.detail}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="overflow-hidden rounded-3xl border-zinc-200 shadow-sm">
              <CardHeader className="border-b border-zinc-100">
                <CardTitle className="text-lg text-zinc-900">
                  Painel logistico do destino
                </CardTitle>
                <CardDescription className="text-sm text-zinc-500">
                  Leitura rapida da rota, do prazo prometido e do ponto atual da
                  carga.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <div className="grid gap-0 lg:grid-cols-[1.4fr_0.8fr]">
                  <div className="border-b border-zinc-100 p-6 lg:border-b-0 lg:border-r">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                          Origem
                        </p>
                        <p className="mt-3 text-sm font-semibold text-zinc-900">
                          {trackingData?.tracking?.header?.remetente || '-'}
                        </p>
                        <p className="mt-2 text-sm text-zinc-500">
                          Embarcador da consulta.
                        </p>
                      </div>

                      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                          Posicao atual
                        </p>
                        <p className="mt-3 text-sm font-semibold text-zinc-900">
                          {latestItem ? getLocationLabel(latestItem) : '-'}
                        </p>
                        <p className="mt-2 text-sm text-zinc-600">
                          Ultima baixa em{' '}
                          {formatDateTime(
                            latestItem?.data_hora_efetiva || latestItem?.data_hora,
                          )}
                          .
                        </p>
                      </div>

                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                          Destino
                        </p>
                        <p className="mt-3 text-sm font-semibold text-zinc-900">
                          {trackingData?.tracking?.header?.destinatario || '-'}
                        </p>
                        <p className="mt-2 text-sm text-zinc-600">
                          {destinationLabel !== '-'
                            ? `Praca de entrega: ${destinationLabel}.`
                            : 'Destino sem cidade detalhada no retorno.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        Dashboard de prazo
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-zinc-900">
                        {deadlineInfo.label}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-600">
                        {deadlineInfo.detail}
                      </p>

                      <div className="mt-5 grid gap-3">
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            {deliveryDisplay.title}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-zinc-900">
                            {deliveryDisplay.value}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Ultima atualizacao
                          </p>
                          <p className="mt-2 text-sm font-semibold text-zinc-900">
                            {formatDateTime(
                              latestItem?.data_hora_efetiva || latestItem?.data_hora,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-900">
                  Etapas da encomenda
                </CardTitle>
                <CardDescription className="text-sm text-zinc-500">
                  A leitura abaixo usa as ocorrencias da API para mostrar a
                  evolucao operacional da carga.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  {trackingStages.map((stage, index) => {
                    const Icon = stage.icon;
                    const stateClass = stage.reached
                      ? stage.current
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-400';
                    const markerClass = stage.reached
                      ? stage.current
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/60'
                        : 'bg-emerald-600 text-white'
                      : 'bg-white text-zinc-400';

                    return (
                      <div key={stage.title} className="relative">
                        {index < trackingStages.length - 1 && (
                          <div className="absolute left-[calc(50%+2rem)] right-[-1.25rem] top-6 hidden h-0.5 bg-zinc-200 md:block" />
                        )}

                        <div
                          className={`relative h-full rounded-3xl border p-5 transition ${stateClass}`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-current/10 ${markerClass}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold">
                                  {stage.title}
                                </p>

                                {stage.current && (
                                  <Badge className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                                    Atual
                                  </Badge>
                                )}
                              </div>

                              <p className="mt-2 text-sm leading-6 text-current/80">
                                {stage.description}
                              </p>

                              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-current/70">
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
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <section className="grid grid-cols-1 gap-6">
              <Card className="rounded-3xl border-zinc-200 shadow-sm">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg text-zinc-900">
                      Historico de movimentacoes
                    </CardTitle>
                    <CardDescription className="text-sm text-zinc-500">
                      Eventos retornados pela consulta de rastreamento, com
                      destaque para a ocorrencia operacional.
                    </CardDescription>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRawJson((prev) => !prev)}
                    className="rounded-2xl"
                  >
                    {showRawJson ? 'Ocultar JSON' : 'Ver JSON bruto'}
                  </Button>
                </CardHeader>

                <CardContent>
                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
                      Nenhuma movimentacao encontrada.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item, index) => {
                        const visual = getMovementVisual(item);
                        const occurrence = splitOccurrenceLabel(item.ocorrencia);
                        const Icon = visual.icon;
                        const isLast = index === items.length - 1;

                        return (
                          <div
                            key={`${item.data_hora}-${index}`}
                            className="relative rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                          >
                            <div className="flex gap-4">
                              <div className="relative flex flex-col items-center">
                                <div
                                  className={`z-10 flex h-12 w-12 items-center justify-center rounded-2xl border ${visual.iconWrapClass}`}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>

                                {!isLast && (
                                  <div className="mt-2 h-full min-h-[40px] w-px bg-zinc-200" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${visual.badgeClass}`}
                                      >
                                        {visual.label}
                                      </Badge>

                                      {item.tipo && (
                                        <Badge
                                          variant="outline"
                                          className="rounded-full px-3 py-1 text-xs font-semibold text-zinc-700"
                                        >
                                          {item.tipo}
                                        </Badge>
                                      )}

                                      {occurrence.code && (
                                        <Badge
                                          variant="outline"
                                          className="rounded-full px-3 py-1 text-xs font-semibold text-zinc-700"
                                        >
                                          Cod. {occurrence.code}
                                        </Badge>
                                      )}
                                    </div>

                                    <h4 className="mt-3 text-base font-semibold text-zinc-900">
                                      {occurrence.label}
                                    </h4>

                                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                                      {item.descricao ||
                                        'Sem descricao adicional para esta movimentacao.'}
                                    </p>
                                  </div>

                                  <div className="shrink-0 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                                    <p className="font-semibold text-zinc-900">
                                      {formatDateTime(
                                        item.data_hora_efetiva || item.data_hora,
                                      )}
                                    </p>
                                    <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                                      Atualizacao do evento
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                      <MapPin className="h-4 w-4" />
                                      <span className="text-xs font-semibold uppercase tracking-wide">
                                        Local
                                      </span>
                                    </div>

                                    <p className="mt-2 text-sm font-semibold text-zinc-900">
                                      {getLocationLabel(item)}
                                    </p>
                                  </div>

                                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                      <Clock3 className="h-4 w-4" />
                                      <span className="text-xs font-semibold uppercase tracking-wide">
                                        Data original
                                      </span>
                                    </div>

                                    <p className="mt-2 text-sm font-semibold text-zinc-900">
                                      {formatDateTime(item.data_hora)}
                                    </p>
                                  </div>
                                </div>

                                {item.nome_recebedor && (
                                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                    <span className="font-semibold">Recebedor:</span>{' '}
                                    {item.nome_recebedor}
                                    {item.nro_doc_recebedor
                                      ? ` • Documento: ${item.nro_doc_recebedor}`
                                      : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

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
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
