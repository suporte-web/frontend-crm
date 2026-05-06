export type AuditLogCategory =
  | 'ACCESS'
  | 'AUTH'
  | 'USER'
  | 'CLIENT'
  | 'QUOTE'
  | 'TICKET'
  | 'TRACKING'
  | 'SYSTEM';

export type AuditLog = {
  id: string;
  category: AuditLogCategory;
  action: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  route?: string | null;
  method?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  success: boolean;
  userId?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export type AuditLogFilters = {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  userId?: string;
  q?: string;
};

export type AuditLogSummary = {
  total: number;
  successCount: number;
  errorCount: number;
  byCategory: Array<{
    category: AuditLogCategory;
    count: number;
  }>;
};
