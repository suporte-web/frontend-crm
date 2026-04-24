'use client';

import { useMemo, useState } from 'react';
import { FileDown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LeadImportJob } from '@/types/leads';

type LeadImportPanelProps = {
  loading: boolean;
  jobs: LeadImportJob[];
  onImport: (payload: {
    file: File;
    defaultSource?: string;
    defaultStatus?: string;
  }) => Promise<boolean>;
};

const sampleCsv = [
  'name,email,phone,company,source,status,notes',
  'Maria Oliveira,maria@empresa.com,11999999999,Empresa Alfa,import_csv,new,Lead vindo da feira',
  'Joao Souza,,21999999999,Logistica Beta,,qualified,Contato inicial por telefone',
].join('\n');

function getJobStatusLabel(status: LeadImportJob['status']) {
  const labels: Record<LeadImportJob['status'], string> = {
    PROCESSING: 'Processando',
    COMPLETED: 'Concluida',
    COMPLETED_WITH_ERRORS: 'Concluida com alertas',
    FAILED: 'Falhou',
  };

  return labels[status];
}

function getJobStatusClass(status: LeadImportJob['status']) {
  const classes: Record<LeadImportJob['status'], string> = {
    PROCESSING: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    COMPLETED_WITH_ERRORS: 'bg-blue-100 text-blue-700',
    FAILED: 'bg-rose-100 text-rose-700',
  };

  return classes[status];
}

export function LeadImportPanel({
  loading,
  jobs,
  onImport,
}: LeadImportPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [defaultSource, setDefaultSource] = useState('import_csv');
  const [defaultStatus, setDefaultStatus] = useState('new');
  const [error, setError] = useState('');

  const sampleHref = useMemo(() => {
    return `data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsv)}`;
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError('Selecione um arquivo CSV.');
      return;
    }

    setError('');
    const success = await onImport({
      file,
      defaultSource,
      defaultStatus,
    });

    if (success) {
      setFile(null);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Arquivo CSV
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Origem padrao
              </label>
              <input
                type="text"
                value={defaultSource}
                onChange={(event) => setDefaultSource(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status padrao
              </label>
              <input
                type="text"
                value={defaultStatus}
                onChange={(event) => setDefaultStatus(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={sampleHref}
            download="exemplo-leads.csv"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <FileDown className="h-4 w-4" />
            Baixar exemplo CSV
          </a>

          <Button type="submit" disabled={loading} className="rounded-2xl px-5">
            <Upload className="h-4 w-4" />
            {loading ? 'Importando...' : 'Importar leads'}
          </Button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </form>

      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Importacoes recentes</h3>
          <p className="mt-1 text-sm text-slate-500">
            Resumo das ultimas cargas para conferir duplicados e falhas.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Nenhuma importacao registrada ainda.
          </div>
        ) : (
          jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{job.fileName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.totalRows} linha(s) • {job.successCount} importada(s) •{' '}
                    {job.ignoredCount} ignorada(s)
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getJobStatusClass(
                    job.status,
                  )}`}
                >
                  {getJobStatusLabel(job.status)}
                </span>
              </div>

              {job.rowResults?.length ? (
                <div className="mt-4 space-y-2">
                  {job.rowResults.slice(0, 4).map((row) => (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    >
                      Linha {row.rowNumber}: {row.reason || row.status}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
