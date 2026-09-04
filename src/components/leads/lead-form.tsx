'use client';

import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { ImageUp } from 'lucide-react';

import { LEAD_FUNNEL_STAGES } from '@/constants/lead-funnel';
import type { CreateLeadPayload } from '@/types/leads';

type LeadFormProps = {
  loading: boolean;
  onSubmit: (payload: CreateLeadPayload) => Promise<boolean>;
  initialValues?: Partial<CreateLeadPayload>;
  submitLabel?: string;
};

const initialState: CreateLeadPayload = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: 'manual',
  status: 'entrada_leads',
  notes: '',
  logoUrl: '',
  segment: '',
  transport: '',
  storage: '',
  entryDate: '',
  lastInteractionDate: '',
  monthlyEstimatedValue: '',
  responsible: '',
  currentStatus: '',
  nextAction: '',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: '#fff',
  },
};

export function LeadForm({
  loading,
  onSubmit,
  initialValues,
  submitLabel = 'Criar lead',
}: LeadFormProps) {
  const [form, setForm] = useState<CreateLeadPayload>({
    ...initialState,
    ...initialValues,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      ...initialState,
      ...initialValues,
    });
  }, [initialValues]);

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Envie uma imagem para a logo/foto do lead.');
      event.target.value = '';
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setError('A imagem precisa ter até 1,5 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        logoUrl: typeof reader.result === 'string' ? reader.result : prev.logoUrl,
      }));
      setError('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Informe o nome do lead.');
      return;
    }

    setError('');
    const success = await onSubmit({
      name: form.name.trim(),
      email: form.email?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      company: form.company?.trim() || undefined,
      source: form.source?.trim() || 'manual',
      status: form.status?.trim() || 'entrada_leads',
      notes: form.notes?.trim() || undefined,
      logoUrl: form.logoUrl?.trim() || undefined,
      segment: form.segment?.trim() || undefined,
      transport: form.transport?.trim() || undefined,
      storage: form.storage?.trim() || undefined,
      entryDate: form.entryDate?.trim() || undefined,
      lastInteractionDate: form.lastInteractionDate?.trim() || undefined,
      monthlyEstimatedValue: form.monthlyEstimatedValue?.trim() || undefined,
      responsible: form.responsible?.trim() || undefined,
      currentStatus: form.currentStatus?.trim() || undefined,
      nextAction: form.nextAction?.trim() || undefined,
    });

    if (success) {
      setForm(initialState);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            bgcolor: '#fffaf7',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
          >
            <Avatar
              src={form.logoUrl}
              variant="rounded"
              sx={{
                width: 72,
                height: 72,
                borderRadius: '16px',
                bgcolor: '#ffedd5',
                color: '#f97316',
                border: '1px solid #fed7aa',
              }}
            >
              <ImageUp size={28} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: '#1f2937', fontSize: 15, fontWeight: 900 }}>
                Logo ou foto do lead
              </Typography>
              <Typography sx={{ mt: 0.25, color: '#64748b', fontSize: 13.5 }}>
                Envie uma imagem para aparecer no detalhe do lead e no BI comercial.
              </Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<ImageUp size={17} />}
                sx={{
                  mt: 1.5,
                  borderRadius: '10px',
                  borderColor: '#fed7aa',
                  color: '#9a3412',
                  fontWeight: 900,
                  textTransform: 'none',
                  '&:hover': { borderColor: '#f97316', bgcolor: '#ffedd5' },
                }}
              >
                Upload da imagem
                <Box
                  component="input"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  sx={{
                    clip: 'rect(0 0 0 0)',
                    clipPath: 'inset(50%)',
                    height: 1,
                    overflow: 'hidden',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    whiteSpace: 'nowrap',
                    width: 1,
                  }}
                />
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <TextField
            label="Nome"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Ex: Maria Oliveira"
            required
            sx={fieldSx}
          />

          <TextField
            label="Empresa"
            value={form.company}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, company: event.target.value }))
            }
            placeholder="Ex: Transportes Exemplo"
            sx={fieldSx}
          />

          <TextField
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="contato@empresa.com"
            sx={fieldSx}
          />

          <TextField
            label="Telefone"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
            placeholder="(11) 99999-9999"
            sx={fieldSx}
          />

          <TextField
            select
            label="Origem"
            value={form.source}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, source: event.target.value }))
            }
            sx={fieldSx}
          >
            <MenuItem value="manual">Manual</MenuItem>
            <MenuItem value="site">Site</MenuItem>
          </TextField>

          <TextField
            select
            label="Etapa do funil"
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, status: event.target.value }))
            }
            sx={fieldSx}
          >
            {LEAD_FUNNEL_STAGES.map((stage) => (
              <MenuItem key={stage.value} value={stage.value}>
                {stage.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Segmento"
            value={form.segment}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, segment: event.target.value }))
            }
            placeholder="Ex: Varejo"
            sx={fieldSx}
          />

          <TextField
            select
            label="Transporte"
            value={form.transport}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, transport: event.target.value }))
            }
            sx={fieldSx}
          >
            <MenuItem value="">Não informado</MenuItem>
            <MenuItem value="Sim">Sim</MenuItem>
            <MenuItem value="Não">Não</MenuItem>
          </TextField>

          <TextField
            select
            label="Armazenagem"
            value={form.storage}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, storage: event.target.value }))
            }
            sx={fieldSx}
          >
            <MenuItem value="">Não informado</MenuItem>
            <MenuItem value="Sim">Sim</MenuItem>
            <MenuItem value="Não">Não</MenuItem>
          </TextField>

          <TextField
            label="Data de entrada"
            type="date"
            value={form.entryDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, entryDate: event.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
            sx={fieldSx}
          />

          <TextField
            label="Última interação"
            type="date"
            value={form.lastInteractionDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, lastInteractionDate: event.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
            sx={fieldSx}
          />

          <TextField
            label="Volume mensal estimado (R$)"
            value={form.monthlyEstimatedValue}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, monthlyEstimatedValue: event.target.value }))
            }
            placeholder="Ex: 57900"
            sx={fieldSx}
          />

          <TextField
            label="Responsável"
            value={form.responsible}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, responsible: event.target.value }))
            }
            placeholder="Ex: Interno"
            sx={fieldSx}
          />

          <TextField
            label="Status atual"
            value={form.currentStatus}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, currentStatus: event.target.value }))
            }
            placeholder="Ex: Homologação finalizada"
            sx={fieldSx}
          />

          <TextField
            label="Próxima ação"
            value={form.nextAction}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, nextAction: event.target.value }))
            }
            placeholder="Ex: Realizar follow-up com cliente"
            sx={fieldSx}
          />
        </Box>

        <TextField
          label="Observações"
          multiline
          minRows={4}
          value={form.notes}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, notes: event.target.value }))
          }
          placeholder="Contexto inicial do lead."
          sx={fieldSx}
        />

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              minHeight: 44,
              borderRadius: '10px',
              px: 2.5,
              fontWeight: 900,
              textTransform: 'none',
            }}
          >
            {loading ? 'Salvando...' : submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
