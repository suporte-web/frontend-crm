'use client';

import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { API_BASE_URL } from '@/services/api';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import MuiChip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CircleDashed,
  Clock3,
  EyeOff,
  FileText,
  Lock,
  MapPin,
  Package,
  PackageCheck,
  PackageOpen,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';


type TrackingQueryType = 'nro_nf' | 'pedido' | 'chave_nfe' | 'nro_coleta';

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
  success?: boolean;
  message?: string;
  header?: {
    remetente?: string;
    destinatario?: string;
    [key: string]: unknown;
  };
  tracking?:
  | TrackingApiItem[]
  | {
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

const deliverySuccessBadgeClass =
  'border-[#bfe6c0] bg-[#e8f5e7] text-[#2f7b2d]';
const deliverySuccessIconClass = 'bg-[#e8f5e7] text-[#2f7b2d] border-[#bfe6c0]';
const deliverySuccessCardClass =
  'border-[#bfe6c0] bg-[#e8f5e7]/75 text-[#2f7b2d]';

const trackingPalette = {
  text: '#343434',
  title: '#020617',
  muted: '#64748b',
  border: '#e2e8f0',
  orange: '#ec3f12',
  orangeStrong: '#ec3139',
  yellow: '#fab519',
  yellowSoft: '#fff7df',
  green: '#2f7b2d',
  greenSoft: '#e8f5e7',
  blue: '#0875e1',
  blueSoft: '#eff7ff',
  page: '#fbf7ef',
  surface: '#ffffff',
};

const paperSx = {
  border: `1px solid ${trackingPalette.border}`,
  borderRadius: '18px',
  bgcolor: trackingPalette.surface,
  boxShadow: '0 18px 50px rgba(15,23,42,0.07)',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 44,
    borderRadius: '10px',
    bgcolor: '#ffffff',
  },
  '& .MuiInputBase-input': {
    py: '9px',
    fontSize: 13,
    fontWeight: 700,
  },
  '& .MuiInputLabel-root': {
    fontSize: 13,
    fontWeight: 800,
  },
  '& .MuiInputAdornment-root svg': {
    color: '#94a3b8',
  },
};

function statusChipSx(label: string) {
  if (label.includes('Entregue')) {
    return {
      borderColor: '#bfe6c0',
      bgcolor: trackingPalette.greenSoft,
      color: trackingPalette.green,
    };
  }

  if (label.includes('trânsito')) {
    return {
      borderColor: 'rgba(236,49,57,0.25)',
      bgcolor: 'rgba(236,49,57,0.10)',
      color: trackingPalette.orangeStrong,
    };
  }

  if (label.includes('Documento')) {
    return {
      borderColor: 'rgba(52,52,52,0.20)',
      bgcolor: 'rgba(52,52,52,0.10)',
      color: trackingPalette.text,
    };
  }

  return {
    borderColor: 'rgba(250,181,25,0.40)',
    bgcolor: 'rgba(250,181,25,0.15)',
    color: trackingPalette.text,
  };
}

function deadlineCardSx(label: string) {
  if (label.includes('atras')) {
    return {
      borderColor: 'rgba(236,49,57,0.25)',
      bgcolor: 'rgba(236,49,57,0.10)',
      color: trackingPalette.orangeStrong,
    };
  }

  if (label.includes('Entregue no prazo')) {
    return {
      borderColor: '#bfe6c0',
      bgcolor: 'rgba(232,245,231,0.75)',
      color: trackingPalette.green,
    };
  }

  if (label.includes('pendente')) {
    return {
      borderColor: '#e4e4e7',
      bgcolor: '#fafafa',
      color: '#3f3f46',
    };
  }

  return {
    borderColor: 'rgba(250,181,25,0.40)',
    bgcolor: trackingPalette.yellowSoft,
    color: trackingPalette.text,
  };
}

function movementSx(label: string) {
  if (label.includes('Entregue') || label.includes('Recebimento')) {
    return {
      iconBg: trackingPalette.greenSoft,
      iconColor: trackingPalette.green,
      iconBorder: '#bfe6c0',
      chip: statusChipSx('Entregue'),
    };
  }

  if (label.includes('trânsito')) {
    return {
      iconBg: 'rgba(236,49,57,0.10)',
      iconColor: trackingPalette.orangeStrong,
      iconBorder: 'rgba(236,49,57,0.25)',
      chip: statusChipSx('Em trânsito'),
    };
  }

  if (label.includes('Pendente')) {
    return {
      iconBg: 'rgba(250,181,25,0.15)',
      iconColor: trackingPalette.text,
      iconBorder: 'rgba(250,181,25,0.40)',
      chip: statusChipSx('Pendente'),
    };
  }

  return {
    iconBg: 'rgba(52,52,52,0.10)',
    iconColor: trackingPalette.text,
    iconBorder: 'rgba(52,52,52,0.20)',
    chip: statusChipSx('Documento emitido'),
  };
}

function stageSx(stage: TrackingStage, index: number) {
  if (!stage.reached) {
    return {
      borderColor: trackingPalette.border,
      bgcolor: '#f8fafc',
      iconBg: '#ffffff',
      iconColor: '#94a3b8',
      chipBg: '#e2e8f0',
      chipColor: '#64748b',
    };
  }

  if (index === 2) {
    return {
      borderColor: '#8fc3ff',
      bgcolor: '#eff7ff',
      iconBg: trackingPalette.blue,
      iconColor: '#ffffff',
      chipBg: trackingPalette.blue,
      chipColor: '#ffffff',
    };
  }

  if (index === 3) {
    return {
      borderColor: '#8dd9a0',
      bgcolor: '#eefbef',
      iconBg: '#27a844',
      iconColor: '#ffffff',
      chipBg: '#27a844',
      chipColor: '#ffffff',
    };
  }

  return {
    borderColor: '#ffb347',
    bgcolor: '#fff7e7',
    iconBg: '#ff7900',
    iconColor: '#ffffff',
    chipBg: '#ff8a00',
    chipColor: '#ffffff',
  };
}

function normalizeTrackingText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function isTransportDocumentIssued(item: TrackingApiItem) {
  const ocorrencia = normalizeTrackingText(item.ocorrencia);
  const descricao = normalizeTrackingText(item.descricao);

  return (
    ocorrencia.includes('DOCUMENTO DE TRANSPORTE EMITIDO') ||
    descricao.includes('CT-E AUTORIZADO')
  );
}

function isDeliveredTrackingItem(item: TrackingApiItem) {
  const ocorrencia = normalizeTrackingText(item.ocorrencia);
  const hasReceiver =
    Boolean(item.nome_recebedor?.trim()) ||
    Boolean(item.nro_doc_recebedor?.trim());

  if (isTransportDocumentIssued(item)) {
    return false;
  }

  return (
    ocorrencia.includes('MERCADORIA ENTREGUE') ||
    ocorrencia.includes('ENTREGA REALIZADA') ||
    ocorrencia.includes('COMPROVANTE DE ENTREGA') ||
    (ocorrencia.includes('ENTREGUE') && !ocorrencia.includes('NAO ENTREGUE')) ||
    hasReceiver
  );
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeItems(data: unknown): TrackingApiItem[] {
  if (!isRecord(data)) return [];

  const response = data as TrackingApiResponse;
  const rawTracking = response.tracking;
  const rawItems = Array.isArray(rawTracking)
    ? rawTracking
    : rawTracking?.items?.item;

  if (!rawItems) return [];
  if (Array.isArray(rawItems)) return rawItems;
  return [rawItems];
}

function parseFlexibleDate(value?: string | null) {
  if (!value) return null;

  const normalizedValue = value.trim();

  // Formato brasileiro:
  // 10/07/2026
  // 10-07-2026
  // 10/07/26
  // 10/07/2026 14:30:00
  const brazilianMatch = normalizedValue.match(
    /^(\d{2})[\/-](\d{2})[\/-](\d{2}|\d{4})(?:[T\s]+(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (brazilianMatch) {
    const [
      ,
      day,
      month,
      year,
      hour = '00',
      minute = '00',
      second = '00',
    ] = brazilianMatch;

    const fullYear =
      year.length === 2
        ? 2000 + Number(year)
        : Number(year);

    const parsed = new Date(
      fullYear,
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    const isValidDate =
      parsed.getFullYear() === fullYear &&
      parsed.getMonth() === Number(month) - 1 &&
      parsed.getDate() === Number(day);

    if (!isValidDate) {
      return null;
    }

    return parsed;
  }

  // Formato ISO retornado pela API:
  // 2026-07-10
  // 2026-07-10T10:32:06
  const isoMatch = normalizedValue.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]+(\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );

  if (isoMatch) {
    const [
      ,
      year,
      month,
      day,
      hour = '00',
      minute = '00',
      second = '00',
    ] = isoMatch;

    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    const isValidDate =
      parsed.getFullYear() === Number(year) &&
      parsed.getMonth() === Number(month) - 1 &&
      parsed.getDate() === Number(day);

    if (!isValidDate) {
      return null;
    }

    return parsed;
  }

  return null;
}

function formatDateTime(date?: string | null) {
  if (!date) return '-';

  const parsed = parseFlexibleDate(date);

  if (!parsed) {
    return date;
  }

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);

  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);

  return `${formattedDate} ${formattedTime}`;
}

function formatDate(date?: string | null) {
  if (!date) return '-';

  const parsed = parseFlexibleDate(date);

  if (!parsed) {
    return date;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
  const explicitValue = findStringByKeys(data, [
    'previsao_entrega',
    'previsaoEntrega',
    'data_previsao_entrega',
    'dataPrevistaEntrega',
    'entrega_prevista',
    'prazo_entrega',
    'prazoEntrega',
    'previsao',
  ]);

  if (explicitValue) {
    return explicitValue;
  }

  const items = normalizeItems(data);

  for (let index = items.length - 1; index >= 0; index -= 1) {
    const match = items[index]?.descricao?.match(
      /previs[aã]o de entrega:\s*(\d{2}\/\d{2}\/\d{2,4})/i,
    );

    if (match) {
      return match[1];
    }
  }

  return null;
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
      label: 'Sem movimentações',
      className: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    };
  }

  const latest = items[items.length - 1];
  const combinedText = getTrackingText(latest);

  if (isDeliveredTrackingItem(latest)) {
    return {
      label: 'Entregue',
      className: deliverySuccessBadgeClass,
    };
  }

  if (isTransportDocumentIssued(latest)) {
    return {
      label: 'Documento emitido',
      className: 'bg-[#343434]/10 text-[#343434] border-[#343434]/20',
    };
  }

  if (normalizeTrackingText(latest.descricao).includes('PREVISAO DE ENTREGA')) {
    return {
      label: 'Pendente',
      className: 'bg-[#fab519]/15 text-[#343434] border-[#fab519]/40',
    };
  }

  if (
    combinedText.includes('TRANSITO') ||
    combinedText.includes('TRÂNSITO') ||
    combinedText.includes('INFORMATIVO')
  ) {
    return {
      label: 'Em trânsito',
      className: 'bg-[#ec3139]/10 text-[#ec3139] border-[#ec3139]/25',
    };
  }

  return {
    label: latest.ocorrencia || latest.tipo || 'Em processamento',
    className: 'bg-[#fab519]/15 text-[#343434] border-[#fab519]/40',
  };
}

function getLatestItem(items: TrackingApiItem[]) {
  if (!items.length) return null;
  return items[items.length - 1];
}

function getTrackingText(item: TrackingApiItem) {
  return normalizeTrackingText(
    `${item.ocorrencia || ''} ${item.tipo || ''} ${item.descricao || ''}`,
  );
}

function splitOccurrenceLabel(ocorrencia?: string) {
  const value = ocorrencia?.trim() || '';
  const match = value.match(/^(\d+)\s*-\s*(.+)$/);

  if (!match) {
    return {
      code: null,
      label: value || 'Movimentação registrada',
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

function findLatestDeliveredDate(items: TrackingApiItem[]) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];

    if (isDeliveredTrackingItem(item)) {
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
    'TRÂNSITO',
    'A CAMINHO',
    'TRANSFERENCIA',
    'TRANSFERÊNCIA',
    'ROTA',
    'SAIU PARA ENTREGA',
    'EM ENTREGA',
    'SAIDA DE UNIDADE',
    'SAÍDA DE UNIDADE',
  ];

  const hasItems = items.length > 0;
  const hasProcessing = items.some((item) =>
    includesAny(getTrackingText(item), processingKeywords),
  );
  const hasTransit = items.some((item) =>
    !isTransportDocumentIssued(item) &&
    includesAny(getTrackingText(item), transitKeywords),
  );
  const hasDelivered = items.some(isDeliveredTrackingItem);

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
      description: 'Carga em trânsito ou em roteiro de entrega.',
      icon: Truck,
      reached: hasTransit || hasDelivered,
      current: currentStageIndex === 2,
      timestamp: findLatestStageDate(items, transitKeywords),
    },
    {
      title: 'Entregue',
      description: 'Recebimento confirmado pelo destinatário.',
      icon: CheckCircle2,
      reached: hasDelivered,
      current: currentStageIndex === 3,
      timestamp: findLatestDeliveredDate(items),
    },
  ];
}

function getLocationLabel(item: TrackingApiItem) {
  const parts = [item.cidade, item.filial, item.dominio].filter(Boolean);
  return parts.join(' • ') || '-';
}

function getMovementVisual(item: TrackingApiItem) {
  const text = getTrackingText(item);

  if (isDeliveredTrackingItem(item)) {
    return {
      icon: CheckCircle2,
      iconWrapClass: deliverySuccessIconClass,
      badgeClass: deliverySuccessBadgeClass,
      label: 'Entregue',
    };
  }

  if (isTransportDocumentIssued(item)) {
    return {
      icon: PackageCheck,
      iconWrapClass: 'bg-[#343434]/10 text-[#343434] border-[#343434]/20',
      badgeClass: 'bg-[#343434]/10 text-[#343434] border-[#343434]/20',
      label: 'Documento emitido',
    };
  }

  if (
    text.includes('RECEBEDOR') ||
    text.includes('ASSINADO') ||
    text.includes('COMPROVANTE')
  ) {
    return {
      icon: UserCheck,
      iconWrapClass: deliverySuccessIconClass,
      badgeClass: deliverySuccessBadgeClass,
      label: 'Recebimento',
    };
  }

  if (
    text.includes('TRANSITO') ||
    text.includes('TRÂNSITO') ||
    text.includes('TRANSPORTE') ||
    text.includes('A CAMINHO') ||
    text.includes('TRANSFERENCIA') ||
    text.includes('TRANSFERÊNCIA') ||
    text.includes('SAIDA DE UNIDADE') ||
    text.includes('SAÍDA DE UNIDADE')
  ) {
    return {
      icon: Truck,
      iconWrapClass: 'bg-[#ec3139]/10 text-[#ec3139] border-[#ec3139]/25',
      badgeClass: 'bg-[#ec3139]/10 text-[#ec3139] border-[#ec3139]/25',
      label: 'Em trânsito',
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
      iconWrapClass: 'bg-[#343434]/10 text-[#343434] border-[#343434]/20',
      badgeClass: 'bg-[#343434]/10 text-[#343434] border-[#343434]/20',
      label: 'Processado',
    };
  }

  if (
    text.includes('PENDENTE') ||
    text.includes('AGUARDANDO') ||
    text.includes('ATRASO') ||
    text.includes('PREVISAO DE ENTREGA')
  ) {
    return {
      icon: Clock3,
      iconWrapClass: 'bg-[#fab519]/15 text-[#343434] border-[#fab519]/40',
      badgeClass: 'bg-[#fab519]/10 text-[#343434] border-[#fab519]/40',
      label: 'Pendente',
    };
  }

  if (
    text.includes('ERRO') ||
    text.includes('RECUSA') ||
    text.includes('DEVOL') ||
    text.includes('OCORRENCIA') ||
    text.includes('OCORRÊNCIA')
  ) {
    return {
      icon: AlertCircle,
      iconWrapClass: 'bg-[#ec3139]/10 text-[#ec3139] border-[#ec3139]/25',
      badgeClass: 'bg-[#ec3139]/10 text-[#ec3139] border-[#ec3139]/25',
      label: 'Atenção',
    };
  }

  return {
    icon: CircleDashed,
    iconWrapClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    badgeClass: 'bg-zinc-50 text-zinc-700 border-zinc-200',
    label: item.tipo || 'Movimentação',
  };
}

function getDeadlineInfo(
  items: TrackingApiItem[],
  estimatedDelivery: string | null,
): DeadlineInfo {
  const latestDeliveredAt = findLatestDeliveredDate(items);
  const estimatedDate = parseFlexibleDate(estimatedDelivery);
  const deliveredDate = parseFlexibleDate(latestDeliveredAt);

  if (deliveredDate) {
    if (estimatedDate && deliveredDate.getTime() > estimatedDate.getTime()) {
      return {
        label: 'Entregue com atraso',
        detail: `Conclusão registrada em ${formatDateTime(latestDeliveredAt)}.`,
        className: 'border-[#fab519]/40 bg-[#fff7df] text-[#343434]',
      };
    }

    return {
      label: 'Entregue no prazo',
      detail: `Baixa confirmada em ${formatDateTime(latestDeliveredAt)}.`,
      className: deliverySuccessCardClass,
    };
  }

  if (!estimatedDate) {
    return {
      label: 'Previsão pendente',
      detail: 'A consulta não retornou data prevista de entrega.',
      className: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    };
  }

  const now = new Date();
  const remainingMs = estimatedDate.getTime() - now.getTime();
  const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));

  if (remainingMs < 0) {
    return {
      label: 'Prazo em atraso',
      detail: `Previsão encerrada em ${formatDate(estimatedDelivery)}.`,
      className: 'border-[#ec3139]/25 bg-[#ec3139]/10 text-[#ec3139]',
    };
  }

  if (remainingHours <= 24) {
    return {
      label: 'Entrega prevista hoje',
      detail: `Janela prevista até ${formatDateTime(estimatedDelivery)}.`,
      className: 'border-[#fab519]/40 bg-[#fff7df] text-[#343434]',
    };
  }

  return {
    label: 'Dentro do prazo',
    detail: `Entrega prevista para ${formatDate(estimatedDelivery)}.`,
    className: 'border-[#fab519]/40 bg-[#fff7df] text-[#343434]',
  };
}

function getDeliveryDisplay(
  items: TrackingApiItem[],
  estimatedDelivery: string | null,
  destinationLabel: string,
): DeliveryDisplay {
  const latestDeliveredAt = findLatestDeliveredDate(items);

  if (latestDeliveredAt) {
    return {
      title: 'Entrega concluída',
      value: formatDateTime(latestDeliveredAt),
      detail:
        destinationLabel !== '-'
          ? `Baixa final registrada para ${destinationLabel}.`
          : 'Baixa final registrada no histórico da carga.',
    };
  }

  return {
    title: 'Previsão de entrega',
    value: formatDate(estimatedDelivery),
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
  const selectedQueryPlaceholder = getValueFieldPlaceholder(
    formData.tipoConsulta,
  );

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
      setErrorMessage('Informe o CNPJ do destinatário.');
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
        ...(formData.siglaEmp?.trim() && {
          siglaEmp: formData.siglaEmp.trim(),
        }),
      };

      const response = await fetch(`${API_BASE_URL}/trackings/public-query`, {
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
      <Box
        sx={{
          mx: 'auto',
          width: '100%',
          maxWidth: 1680,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Paper elevation={0} sx={{ ...paperSx, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={3}
              sx={{
                alignItems: { xs: 'flex-start', lg: 'center' },
                justifyContent: 'space-between',
                pb: 3,
                borderBottom: `1px solid ${trackingPalette.border}`,
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '14px',
                    bgcolor: '#ffe8df',
                    color: trackingPalette.orange,
                  }}
                >
                  <PackageSearch size={30} />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: trackingPalette.orange,
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: '.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Logística
                  </Typography>

                  <Typography
                    component="h1"
                    sx={{
                      mt: 0.5,
                      color: trackingPalette.title,
                      fontSize: { xs: 30, md: 40 },
                      fontWeight: 900,
                      lineHeight: 1.05,
                      letterSpacing: 0,
                    }}
                  >
                    Dados para rastreamento
                  </Typography>

                  <Typography sx={{ mt: 1, color: trackingPalette.muted, fontSize: 15 }}>
                    Informe os dados necessários para localizar a encomenda.
                  </Typography>
                </Box>
              </Stack>

              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #fed7aa',
                  borderRadius: '14px',
                  px: 2.5,
                  py: 1.75,
                  bgcolor: 'rgba(255,247,223,0.75)',
                }}
              >
                <Typography
                  sx={{
                    color: trackingPalette.orange,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Tipo atual
                </Typography>
                <Typography sx={{ mt: 0.5, color: trackingPalette.title, fontSize: 14, fontWeight: 900 }}>
                  {selectedQueryLabel}
                </Typography>
              </Paper>
            </Stack>

            <Box
              sx={{
                mt: 3,
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                size="small"
                label="CNPJ do destinatário"
                value={formData.cnpj}
                onChange={(event) => updateField('cnpj', formatCnpj(event.target.value))}
                placeholder="00.000.000/0000-00"
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <UserRound size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                select
                fullWidth
                size="small"
                label="Tipo de consulta"
                value={formData.tipoConsulta}
                onChange={(event) =>
                  updateField('tipoConsulta', event.target.value as TrackingQueryType)
                }
                sx={fieldSx}
              >
                <MenuItem value="nro_nf">{getQueryTypeLabel('nro_nf')}</MenuItem>
                <MenuItem value="pedido">{getQueryTypeLabel('pedido')}</MenuItem>
                <MenuItem value="chave_nfe">{getQueryTypeLabel('chave_nfe')}</MenuItem>
                <MenuItem value="nro_coleta">{getQueryTypeLabel('nro_coleta')}</MenuItem>
              </TextField>

              <TextField
                fullWidth
                size="small"
                label={selectedQueryLabel}
                value={formData.valor}
                onChange={(event) => updateField('valor', event.target.value)}
                placeholder={selectedQueryPlaceholder}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <FileText size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                size="small"
                label="Sigla da empresa"
                value={formData.siglaEmp}
                onChange={(event) => updateField('siglaEmp', event.target.value)}
                placeholder="Opcional"
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Building2 size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                size="small"
                type="password"
                label="Senha de rastreamento"
                value={formData.senha}
                onChange={(event) => updateField('senha', event.target.value)}
                placeholder="Preencha apenas se a consulta exigir senha"
                sx={{ ...fieldSx, gridColumn: { xs: 'auto', md: '1 / -1' } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <EyeOff size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Alert
              icon={<ShieldCheck size={20} />}
              severity="info"
              sx={{
                mt: 2.5,
                border: '1px solid #fed7aa',
                borderRadius: '14px',
                bgcolor: 'rgba(255,247,223,0.60)',
                color: trackingPalette.text,
                '& .MuiAlert-icon': { color: trackingPalette.orange },
              }}
            >
              Utilizamos apenas as informações necessárias para consultar o rastreamento.
            </Alert>

            {errorMessage ? (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '14px' }}>
                {errorMessage}
              </Alert>
            ) : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
              <MuiButton
                type="button"
                variant="contained"
                disabled={isLoading}
                startIcon={
                  isLoading ? <CircularProgress size={16} color="inherit" /> : <Search size={17} />
                }
                onClick={handleSearchTracking}
                sx={{
                  minHeight: 44,
                  borderRadius: '12px',
                  px: 3,
                  bgcolor: trackingPalette.orange,
                  fontWeight: 900,
                  textTransform: 'none',
                  boxShadow: '0 12px 25px rgba(236,63,18,0.22)',
                  '&:hover': { bgcolor: '#d7350e' },
                }}
              >
                {isLoading ? 'Consultando...' : 'Rastrear encomenda'}
              </MuiButton>

              <MuiButton
                type="button"
                variant="outlined"
                startIcon={<X size={17} />}
                onClick={handleClear}
                sx={{
                  minHeight: 44,
                  borderRadius: '12px',
                  px: 3,
                  borderColor: trackingPalette.border,
                  color: trackingPalette.text,
                  fontWeight: 800,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#fed7aa',
                    bgcolor: '#fff7df',
                  },
                }}
              >
                Limpar dados
              </MuiButton>
            </Stack>
          </Box>
        </Paper>

        {!hasResponseData && !isLoading && !errorMessage ? (
          <Paper elevation={0} sx={{ ...paperSx, overflow: 'hidden' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                px: { xs: 2.5, md: 4 },
                py: 2.5,
                borderBottom: `1px solid ${trackingPalette.border}`,
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '12px',
                    bgcolor: '#ffe8df',
                    color: trackingPalette.orange,
                  }}
                >
                  <PackageOpen size={22} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      color: trackingPalette.orange,
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: '.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Resultado
                  </Typography>
                  <Typography sx={{ mt: 0.25, color: trackingPalette.title, fontSize: 24, fontWeight: 900 }}>
                    Resultado da consulta
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Box sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 4, md: 6 }, textAlign: 'center' }}>
              <Box
                sx={{
                  mx: 'auto',
                  width: 96,
                  height: 96,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  bgcolor: '#fff7df',
                  color: trackingPalette.orange,
                  border: '1px solid #fed7aa',
                }}
              >
                <PackageSearch size={44} />
              </Box>

              <Typography sx={{ mt: 3, color: trackingPalette.title, fontSize: 22, fontWeight: 900 }}>
                Nenhum rastreamento consultado
              </Typography>
              <Typography sx={{ mx: 'auto', mt: 1, maxWidth: 520, color: trackingPalette.muted, fontSize: 14, lineHeight: 1.7 }}>
                Preencha os dados acima para localizar a entrega e visualizar o histórico de movimentações.
              </Typography>

              <Box
                sx={{
                  mt: 3,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1.5,
                }}
              >
                {[
                  { icon: PackageSearch, title: 'Consulte', text: 'Informe CNPJ e documento.', color: trackingPalette.blue, bg: trackingPalette.blueSoft },
                  { icon: Truck, title: 'Acompanhe', text: 'Veja eventos da carga.', color: trackingPalette.orange, bg: '#fff7df' },
                  { icon: CheckCircle2, title: 'Confirme', text: 'Valide a entrega final.', color: trackingPalette.green, bg: trackingPalette.greenSoft },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Paper
                      key={item.title}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `1px solid ${trackingPalette.border}`,
                        borderRadius: '14px',
                        bgcolor: '#ffffff',
                      }}
                    >
                      <Box
                        sx={{
                          mx: 'auto',
                          width: 42,
                          height: 42,
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: '12px',
                          bgcolor: item.bg,
                          color: item.color,
                        }}
                      >
                        <Icon size={20} />
                      </Box>
                      <Typography sx={{ mt: 1.5, color: trackingPalette.text, fontSize: 14, fontWeight: 900 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ mt: 0.5, color: trackingPalette.muted, fontSize: 12, lineHeight: 1.5 }}>
                        {item.text}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          </Paper>
        ) : null}

        {isLoading ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 4 },
              border: '1px solid rgba(250,181,25,0.40)',
              borderRadius: '18px',
              bgcolor: 'rgba(250,181,25,0.10)',
              boxShadow: '0 18px 45px rgba(52,52,52,0.08)',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'flex-start', md: 'center' } }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '14px',
                  bgcolor: trackingPalette.orangeStrong,
                  color: '#ffffff',
                }}
              >
                <Truck size={26} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: trackingPalette.text, fontSize: 18, fontWeight: 900 }}>
                  Consultando rastreamento
                </Typography>
                <Typography sx={{ mt: 0.5, color: 'rgba(52,52,52,0.70)', fontSize: 14, lineHeight: 1.7 }}>
                  Aguarde enquanto buscamos as informações da encomenda e organizamos os eventos retornados.
                </Typography>
              </Box>
            </Stack>
            <LinearProgress sx={{ mt: 3, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.65)', '& .MuiLinearProgress-bar': { bgcolor: trackingPalette.orangeStrong } }} />
          </Paper>
        ) : null}

        {hasResponseData ? (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))',
                  xl: 'repeat(4, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              {[
                {
                  title: 'Consulta monitorada',
                  value: formData.valor || '-',
                  detail: transportDocument ? `Documento ${transportDocument}` : selectedQueryLabel,
                  icon: PackageSearch,
                  color: trackingPalette.orangeStrong,
                  bg: 'rgba(236,49,57,0.10)',
                },
                {
                  title: 'Ocorrência atual',
                  value: currentOccurrence.label,
                  detail: currentOccurrence.code ? `Código ${currentOccurrence.code}` : statusInfo.label,
                  icon: CircleDashed,
                  color: trackingPalette.text,
                  bg: 'rgba(52,52,52,0.10)',
                },
                {
                  title: deliveryDisplay.title,
                  value: deliveryDisplay.value,
                  detail: deliveryDisplay.detail,
                  icon: Truck,
                  color: trackingPalette.text,
                  bg: 'rgba(250,181,25,0.15)',
                },
                {
                  title: 'Monitoramento de prazo',
                  value: deadlineInfo.label,
                  detail: deadlineInfo.detail,
                  icon: Clock3,
                  color: trackingPalette.text,
                  bg: 'rgba(250,181,25,0.15)',
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <Paper
                    key={card.title}
                    elevation={0}
                    sx={{
                      position: 'relative',
                      minHeight: 168,
                      p: 2.5,
                      overflow: 'hidden',
                      border: `1px solid ${trackingPalette.border}`,
                      borderRadius: '18px',
                      bgcolor: '#ffffff',
                      boxShadow: '0 18px 45px rgba(52,52,52,0.06)',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        insetInline: 0,
                        top: 0,
                        height: 4,
                        bgcolor: card.title === 'Monitoramento de prazo' ? trackingPalette.yellow : trackingPalette.orangeStrong,
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: trackingPalette.muted, fontSize: 13, fontWeight: 700 }}>
                          {card.title}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 1.25,
                            color: trackingPalette.text,
                            fontSize: card.title === 'Ocorrência atual' ? 16 : 22,
                            fontWeight: 900,
                            lineHeight: 1.25,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {card.value}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 1,
                            color: trackingPalette.muted,
                            fontSize: 13,
                            lineHeight: 1.55,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {card.detail}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          borderRadius: '50%',
                          bgcolor: card.bg,
                          color: card.color,
                        }}
                      >
                        <Icon size={22} />
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Box>

            <Paper elevation={0} sx={{ ...paperSx, overflow: 'hidden' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  px: { xs: 2.5, md: 4 },
                  py: 3,
                  borderBottom: `1px solid ${trackingPalette.border}`,
                }}
              >
                <Box>
                  <Typography sx={{ color: trackingPalette.orangeStrong, fontSize: 12, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase' }}>
                    Acompanhamento
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: trackingPalette.title, fontSize: { xs: 24, md: 28 }, fontWeight: 900 }}>
                    Etapas da encomenda
                  </Typography>
                  <Typography sx={{ mt: 0.75, color: trackingPalette.muted, fontSize: 14 }}>
                    Acompanhe cada etapa da sua entrega em tempo real.
                  </Typography>
                </Box>

                <MuiChip
                  icon={<Truck size={16} />}
                  label="Fluxo da entrega"
                  variant="outlined"
                  sx={{
                    height: 40,
                    borderRadius: '12px',
                    borderColor: trackingPalette.border,
                    color: trackingPalette.text,
                    fontWeight: 800,
                    '& .MuiChip-icon': { color: trackingPalette.orangeStrong },
                  }}
                />
              </Stack>

              <Box sx={{ px: { xs: 2.5, md: 4 }, py: 4, bgcolor: '#fffdfb' }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, minmax(0, 1fr))' },
                    gap: 2,
                  }}
                >
                  {trackingStages.map((stage, index) => {
                    const Icon = stage.icon;
                    const theme = stageSx(stage, index);
                    const label = stage.current ? 'Atual' : stage.reached ? 'Concluída' : 'Aguardando';

                    return (
                      <Paper
                        key={stage.title}
                        elevation={0}
                        sx={{
                          minHeight: 230,
                          p: 2.5,
                          border: '1px solid',
                          borderColor: theme.borderColor,
                          borderRadius: '16px',
                          bgcolor: theme.bgcolor,
                        }}
                      >
                        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: '50%',
                              bgcolor: theme.iconBg,
                              color: theme.iconColor,
                              boxShadow: stage.reached ? '0 10px 24px rgba(15,23,42,0.16)' : 'none',
                            }}
                          >
                            <Icon size={26} />
                          </Box>

                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: '50%',
                              border: '2px solid',
                              borderColor: theme.borderColor,
                              bgcolor: '#ffffff',
                              color: stage.reached ? theme.iconBg : '#94a3b8',
                              fontSize: 13,
                              fontWeight: 900,
                            }}
                          >
                            {index === 3 && stage.reached ? <CheckCircle2 size={18} /> : index + 1}
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography sx={{ color: trackingPalette.title, fontSize: 18, fontWeight: 900 }}>
                            {stage.title}
                          </Typography>
                          <MuiChip
                            size="small"
                            label={label}
                            sx={{
                              height: 24,
                              bgcolor: theme.chipBg,
                              color: theme.chipColor,
                              fontSize: 11,
                              fontWeight: 900,
                            }}
                          />
                        </Stack>

                        <Typography sx={{ mt: 1.25, minHeight: 48, color: trackingPalette.muted, fontSize: 14, lineHeight: 1.6 }}>
                          {stage.description}
                        </Typography>

                        <Paper
                          elevation={0}
                          sx={{
                            mt: 2,
                            p: 1.5,
                            border: '1px solid',
                            borderColor: stage.reached ? theme.borderColor : trackingPalette.border,
                            borderRadius: '12px',
                            bgcolor: '#ffffff',
                          }}
                        >
                          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                            <FileText size={18} />
                            <Box>
                              <Typography sx={{ color: trackingPalette.muted, fontSize: 10, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
                                Registro
                              </Typography>
                              <Typography sx={{ mt: 0.25, color: trackingPalette.text, fontSize: 13, fontWeight: 900 }}>
                                {stage.timestamp
                                  ? formatDateTime(stage.timestamp)
                                  : stage.reached
                                    ? 'Etapa confirmada'
                                    : 'Aguardando etapa'}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Paper>
                    );
                  })}
                </Box>

                <Alert
                  icon={<ShieldCheck size={20} />}
                  severity="info"
                  action={
                    <MuiButton
                      type="button"
                      size="small"
                      variant="outlined"
                      disabled={isLoading}
                      startIcon={<RefreshCw size={16} />}
                      onClick={handleSearchTracking}
                      sx={{
                        borderRadius: '10px',
                        borderColor: '#ffc2b2',
                        color: trackingPalette.orange,
                        fontWeight: 900,
                        textTransform: 'none',
                        bgcolor: '#ffffff',
                      }}
                    >
                      Atualizar
                    </MuiButton>
                  }
                  sx={{
                    mt: 3,
                    border: '1px solid #ffc7b8',
                    borderRadius: '14px',
                    bgcolor: '#fff8f5',
                    color: trackingPalette.text,
                    '& .MuiAlert-icon': { color: trackingPalette.orangeStrong },
                  }}
                >
                  Informações atualizadas conforme o retorno da consulta de rastreamento.
                </Alert>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...paperSx, overflow: 'hidden' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  px: { xs: 2.5, md: 4 },
                  py: 3,
                  borderBottom: `1px solid ${trackingPalette.border}`,
                }}
              >
                <Box>
                  <Typography sx={{ color: trackingPalette.orangeStrong, fontSize: 12, fontWeight: 900, letterSpacing: '.16em', textTransform: 'uppercase' }}>
                    Movimentações
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: trackingPalette.title, fontSize: 26, fontWeight: 900 }}>
                    Histórico de movimentações
                  </Typography>
                  <Typography sx={{ mt: 0.75, color: trackingPalette.muted, fontSize: 14 }}>
                    Eventos retornados pela consulta de rastreamento.
                  </Typography>
                </Box>

                <MuiButton
                  type="button"
                  variant="outlined"
                  onClick={() => setShowRawJson((prev) => !prev)}
                  sx={{
                    minHeight: 42,
                    borderRadius: '12px',
                    borderColor: trackingPalette.border,
                    color: trackingPalette.text,
                    fontWeight: 800,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#fed7aa', bgcolor: '#fff7df', color: trackingPalette.orange },
                  }}
                >
                  {showRawJson ? 'Ocultar JSON' : 'Ver JSON bruto'}
                </MuiButton>
              </Stack>

              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                {items.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      border: `1px dashed ${trackingPalette.border}`,
                      borderRadius: '16px',
                      bgcolor: '#f8fafc',
                    }}
                  >
                    <CircleDashed size={30} color="#64748b" />
                    <Typography sx={{ mt: 2, color: trackingPalette.text, fontSize: 16, fontWeight: 900 }}>
                      Nenhuma movimentação encontrada
                    </Typography>
                    <Typography sx={{ mx: 'auto', mt: 1, maxWidth: 520, color: trackingPalette.muted, fontSize: 14, lineHeight: 1.7 }}>
                      A consulta foi concluída, mas não retornou eventos de movimentação para esta encomenda.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={1.5}>
                    {items.map((item, index) => {
                      const visual = getMovementVisual(item);
                      const sxVisual = movementSx(visual.label);
                      const occurrence = splitOccurrenceLabel(item.ocorrencia);
                      const Icon = visual.icon;
                      const isCurrentMovement = index === items.length - 1;
                      const isDelivered = isDeliveredTrackingItem(item);

                      return (
                        <Paper
                          key={`${item.data_hora}-${index}`}
                          elevation={0}
                          sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            p: { xs: 2, md: 2.5 },
                            pl: { xs: 2.5, md: 3 },
                            border: '1px solid',
                            borderColor: isDelivered ? '#bbf7d0' : trackingPalette.border,
                            borderRadius: '16px',
                            bgcolor: '#ffffff',
                            transition: 'box-shadow 160ms ease, transform 160ms ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 14px 30px rgba(15,23,42,0.08)',
                            },
                            '&:before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              left: 0,
                              width: 4,
                              bgcolor: isDelivered
                                ? '#22c55e'
                                : isCurrentMovement
                                  ? trackingPalette.orange
                                  : trackingPalette.border,
                            },
                          }}
                        >
                          <Stack spacing={2}>
                            <Stack
                              direction={{ xs: 'column', lg: 'row' }}
                              spacing={2}
                              sx={{ alignItems: { xs: 'stretch', lg: 'flex-start' }, justifyContent: 'space-between' }}
                            >
                              <Stack direction="row" spacing={1.75} sx={{ minWidth: 0, flex: 1 }}>
                                <Box
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                    borderRadius: '50%',
                                    border: '1px solid',
                                    borderColor: sxVisual.iconBorder,
                                    bgcolor: sxVisual.iconBg,
                                    color: sxVisual.iconColor,
                                  }}
                                >
                                  <Icon size={22} />
                                </Box>

                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                    <MuiChip
                                      size="small"
                                      label={visual.label}
                                      variant="outlined"
                                      sx={{ height: 26, fontSize: 11, fontWeight: 900, ...sxVisual.chip }}
                                    />
                                    {isCurrentMovement ? (
                                      <MuiChip size="small" label="Atual" sx={{ height: 26, bgcolor: '#22c55e', color: '#ffffff', fontSize: 11, fontWeight: 900 }} />
                                    ) : null}
                                    {item.tipo ? (
                                      <MuiChip size="small" label={item.tipo} variant="outlined" sx={{ height: 26, borderColor: trackingPalette.border, color: trackingPalette.muted, fontSize: 11, fontWeight: 800 }} />
                                    ) : null}
                                    {occurrence.code ? (
                                      <MuiChip size="small" label={`Código ${occurrence.code}`} variant="outlined" sx={{ height: 26, borderColor: trackingPalette.border, color: trackingPalette.muted, fontSize: 11, fontWeight: 800 }} />
                                    ) : null}
                                  </Stack>

                                  <Typography sx={{ mt: 1.5, color: trackingPalette.title, fontSize: 16, fontWeight: 900, lineHeight: 1.45 }}>
                                    {occurrence.label}
                                  </Typography>
                                  <Typography sx={{ mt: 0.5, color: trackingPalette.muted, fontSize: 14, lineHeight: 1.65 }}>
                                    {item.descricao || 'Sem descrição adicional para esta movimentação.'}
                                  </Typography>
                                </Box>
                              </Stack>

                              <Paper
                                elevation={0}
                                sx={{
                                  minWidth: { lg: 168 },
                                  p: 1.5,
                                  border: `1px solid ${trackingPalette.border}`,
                                  borderRadius: '12px',
                                  bgcolor: '#f8fafc',
                                }}
                              >
                                <Typography sx={{ color: trackingPalette.title, fontSize: 13, fontWeight: 900 }}>
                                  {formatDateTime(item.data_hora_efetiva || item.data_hora)}
                                </Typography>
                                <Typography sx={{ mt: 0.5, color: '#94a3b8', fontSize: 10, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
                                  Atualização
                                </Typography>
                              </Paper>
                            </Stack>

                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                                gap: 1.5,
                                pt: 1.5,
                                borderTop: `1px solid ${trackingPalette.border}`,
                              }}
                            >
                              {[
                                { icon: MapPin, label: 'Local', value: getLocationLabel(item) },
                                { icon: Clock3, label: 'Data original', value: formatDateTime(item.data_hora) },
                              ].map((info) => {
                                const InfoIcon = info.icon;
                                return (
                                  <Paper
                                    key={info.label}
                                    elevation={0}
                                    sx={{
                                      p: 1.5,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1.5,
                                      border: `1px solid ${trackingPalette.border}`,
                                      borderRadius: '12px',
                                      bgcolor: '#f8fafc',
                                      minWidth: 0,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        display: 'grid',
                                        placeItems: 'center',
                                        flexShrink: 0,
                                        borderRadius: '50%',
                                        bgcolor: '#ffffff',
                                        color: trackingPalette.muted,
                                        border: `1px solid ${trackingPalette.border}`,
                                      }}
                                    >
                                      <InfoIcon size={16} />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography sx={{ color: '#94a3b8', fontSize: 10, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
                                        {info.label}
                                      </Typography>
                                      <Typography noWrap sx={{ mt: 0.35, color: trackingPalette.text, fontSize: 13, fontWeight: 900 }}>
                                        {info.value}
                                      </Typography>
                                    </Box>
                                  </Paper>
                                );
                              })}
                            </Box>

                            {item.nome_recebedor ? (
                              <Alert
                                icon={<UserCheck size={18} />}
                                severity="success"
                                sx={{
                                  border: '1px solid #bbf7d0',
                                  borderRadius: '12px',
                                  bgcolor: '#ecfdf5',
                                  color: trackingPalette.title,
                                  '& .MuiAlert-icon': { color: trackingPalette.green },
                                }}
                              >
                                <Typography sx={{ fontSize: 12, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: trackingPalette.green }}>
                                  Recebedor
                                </Typography>
                                <Typography sx={{ mt: 0.35, fontSize: 14, fontWeight: 900 }}>
                                  {item.nome_recebedor}
                                </Typography>
                                {item.nro_doc_recebedor ? (
                                  <Typography sx={{ mt: 0.25, fontSize: 12, color: trackingPalette.muted }}>
                                    Documento: {item.nro_doc_recebedor}
                                  </Typography>
                                ) : null}
                              </Alert>
                            ) : null}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}

                {showRawJson ? (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 3,
                      overflow: 'hidden',
                      border: `1px solid ${trackingPalette.border}`,
                      borderRadius: '16px',
                      bgcolor: trackingPalette.text,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2,
                        py: 1.5,
                        borderBottom: '1px solid rgba(255,255,255,0.10)',
                        bgcolor: 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <Typography sx={{ color: '#ffffff', fontSize: 14, fontWeight: 900 }}>
                        JSON retornado
                      </Typography>
                      <MuiChip label="Debug" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.10)', color: '#cbd5e1', fontWeight: 800 }} />
                    </Stack>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 2,
                        maxHeight: 420,
                        overflow: 'auto',
                        color: '#f8fafc',
                        fontSize: 13,
                        lineHeight: 1.7,
                      }}
                    >
                      {formattedResponse}
                    </Box>
                  </Paper>
                ) : null}
              </Box>
            </Paper>
          </>
        ) : null}
      </Box>
    </AppLayout>
  );
}
