'use client';

import type {
  ChangeEvent,
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
} from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  Building2,
  FileText,
  MapPin,
  PlusCircle,
  Search,
  Trash2,
  UploadCloud,
  UsersRound,
} from 'lucide-react';

import { crmPalette } from '@/components/mui/crm-primitives';
import type { LeadStatus } from '@/types/crm';

export type ClientFormData = {
  companyName: string;
  legalName: string;
  tradeName: string;
  phone: string;
  document: string;
  cnae: string;
  stateRegistration: string;
  businessActivity: string;
  taxRegime: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  address: string;
  bankDetails: string;
  modality: string;
  registrationDate: string;
  segment: string;
  notes: string;
  status: LeadStatus;
};

export type ClientContactForm = {
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
};

type ClientFormProps = {
  form: ClientFormData;
  setForm: Dispatch<SetStateAction<ClientFormData>>;
  contacts: ClientContactForm[];
  setContacts: Dispatch<SetStateAction<ClientContactForm[]>>;
  documentFiles: File[];
  setDocumentFiles: Dispatch<SetStateAction<File[]>>;
  loading: boolean;
  searchingCnpj: boolean;
  onSearchCnpj: () => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitLabel?: string;
  camposIniciais?: ReactNode;
};

const brazilianStates = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

export const campoCadastroSx = {
  minWidth: 0,
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    bgcolor: '#fff',
    fontWeight: 400,
    '& fieldset': { borderColor: '#cbd5e1' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused fieldset': { borderColor: '#ff5805' },
  },
  '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': { height: 44 },
  '& .MuiInputBase-input, & .MuiSelect-select': { fontSize: 14, fontWeight: 400 },
  '& .MuiInputLabel-root': { fontSize: 14, fontWeight: 400 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#ea580c' },
};

export const emptyClientContact = (): ClientContactForm => ({
  name: '',
  role: '',
  email: '',
  phone: '',
  notes: '',
});

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function ClientFormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        border: '1px solid',
        borderColor: '#e2e8f0',
        borderRadius: '12px',
        bgcolor: '#ffffff',
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          mb: 2,
          alignItems: 'flex-start',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            borderRadius: '12px',
            bgcolor: '#f8fafc',
            color: '#64748b',
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: '#1f2937', fontSize: 15, fontWeight: 700 }}>
            {title}
          </Typography>
          {description ? (
            <Typography sx={{ mt: 0.35, color: '#64748b', fontSize: 13 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      {children}
    </Paper>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
      }}
    >
      {children}
    </Box>
  );
}

export function ClientForm({
  form,
  setForm,
  contacts,
  setContacts,
  documentFiles,
  setDocumentFiles,
  loading,
  searchingCnpj,
  onSearchCnpj,
  onCancel,
  onSubmit,
  submitLabel = 'Salvar cadastro',
  camposIniciais,
}: ClientFormProps) {
  const disabled = loading || searchingCnpj;

  function updateContact(
    index: number,
    field: keyof ClientContactForm,
    value: string,
  ) {
    setContacts((current) =>
      current.map((contact, currentIndex) =>
        currentIndex === index ? { ...contact, [field]: value } : contact,
      ),
    );
  }

  function addContact() {
    setContacts((current) => [...current, emptyClientContact()]);
  }

  function removeContact(index: number) {
    setContacts((current) =>
      current.length === 1
        ? [emptyClientContact()]
        : current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#f8fafc' }}>
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ color: '#1f2937', fontSize: 14, fontWeight: 700 }}>Preenchimento por CNPJ</Typography>
              <Typography sx={{ mt: 0.5, color: '#64748b', fontSize: 12.5 }}>Consulte os dados da empresa ou preencha os campos abaixo manualmente.</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) auto' }, gap: 1.5, alignItems: 'start' }}>
              <TextField
              size="small"
                label="CNPJ (opcional)"
                value={form.document}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    document: formatCnpj(event.target.value),
                  }))
                }
                placeholder="00.000.000/0000-00"
                sx={campoCadastroSx}
              />

              <Button
                type="button"
                variant="contained"
                disabled={disabled}
                startIcon={
                  searchingCnpj ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Search size={17} />
                  )
                }
                onClick={onSearchCnpj}
                sx={{
                  minHeight: 44,
                  px: 2.25,
                  borderRadius: '8px',
                  bgcolor: crmPalette.orange,
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: crmPalette.orangeDark,
                    boxShadow: 'none',
                  },
                }}
              >
                {searchingCnpj ? 'Buscando...' : 'Buscar CNPJ'}
              </Button>
            </Box>
          </Stack>
        </Paper>

        {camposIniciais}

        <ClientFormSection
          title="Dados fiscais e cadastrais"
          description="Informações principais da empresa."
          icon={<Building2 size={20} />}
        >
          <FieldGrid>
            <TextField
              size="small"
              label="Razão social"
              value={form.legalName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  legalName: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Nome fantasia"
              value={form.tradeName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tradeName: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Empresa / Grupo"
              value={form.companyName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyName: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="CNAE"
              value={form.cnae}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cnae: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Inscrição estadual"
              value={form.stateRegistration}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  stateRegistration: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Atividade comercial"
              value={form.businessActivity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  businessActivity: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Segmento"
              value={form.segment}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  segment: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Regime tributário"
              value={form.taxRegime}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  taxRegime: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              type="date"
              label="Data de cadastro"
              value={form.registrationDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  registrationDate: event.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              select
              label="Status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as LeadStatus,
                }))
              }
              sx={campoCadastroSx}
            >
              <MenuItem value="PENDENTE">Pendente</MenuItem>
              <MenuItem value="ATIVO">Ativo</MenuItem>
              <MenuItem value="INATIVO">Inativo</MenuItem>
            </TextField>
          </FieldGrid>
        </ClientFormSection>

        <ClientFormSection
          title="Endereço"
          description="Localização fiscal ou operacional."
          icon={<MapPin size={20} />}
        >
          <FieldGrid>
            <TextField
              size="small"
              label="CEP"
              value={form.zipCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  zipCode: event.target.value,
                }))
              }
              placeholder="00000-000"
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Rua / Logradouro"
              value={form.street}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  street: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Número"
              value={form.number}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  number: event.target.value,
                }))
              }
              placeholder="Número ou S/N"
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Complemento"
              value={form.complement}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  complement: event.target.value,
                }))
              }
              placeholder="Sala, bloco, galpão..."
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Bairro"
              value={form.neighborhood}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  neighborhood: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              label="Cidade"
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  city: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            />

            <TextField
              size="small"
              select
              label="Estado"
              value={form.state}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  state: event.target.value,
                }))
              }
              sx={campoCadastroSx}
            >
              {brazilianStates.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </TextField>
          </FieldGrid>
        </ClientFormSection>

        <ClientFormSection
          title="Contatos"
          description="O primeiro contato será tratado como principal."
          icon={<UsersRound size={20} />}
        >
          <Stack spacing={2}>
            {contacts.map((contact, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: index === 0 ? '#fed7aa' : 'divider',
                  borderRadius: '14px',
                  bgcolor: index === 0 ? '#fffaf7' : '#ffffff',
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{
                    mb: 1.75,
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                  }}
                >
                  <Chip
                    label={index === 0 ? 'Contato principal' : `Contato ${index + 1}`}
                    size="small"
                    sx={{
                      width: 'fit-content',
                      borderRadius: '8px',
                      bgcolor: index === 0 ? '#ffedd5' : '#f1f5f9',
                      color: index === 0 ? crmPalette.orangeDark : '#475569',
                      fontWeight: 700,
                    }}
                  />

                  <Button
                    type="button"
                    variant="text"
                    color="error"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => removeContact(index)}
                    disabled={
                      contacts.length === 1 &&
                      !Object.values(contact).some(Boolean)
                    }
                    sx={{
                      alignSelf: { xs: 'flex-start', sm: 'center' },
                      borderRadius: '10px',
                      fontWeight: 800,
                      textTransform: 'none',
                    }}
                  >
                    Remover
                  </Button>
                </Stack>

                <FieldGrid>
                  <TextField
              size="small"
                    label="Nome do contato"
                    value={contact.name}
                    onChange={(event) =>
                      updateContact(index, 'name', event.target.value)
                    }
                    sx={campoCadastroSx}
                  />

                  <TextField
              size="small"
                    label="Cargo / Função"
                    value={contact.role}
                    onChange={(event) =>
                      updateContact(index, 'role', event.target.value)
                    }
                    sx={campoCadastroSx}
                  />

                  <TextField
              size="small"
                    type="email"
                    label="E-mail"
                    value={contact.email}
                    onChange={(event) =>
                      updateContact(index, 'email', event.target.value)
                    }
                    sx={campoCadastroSx}
                  />

                  <TextField
              size="small"
                    label="Telefone"
                    value={contact.phone}
                    onChange={(event) =>
                      updateContact(index, 'phone', event.target.value)
                    }
                    sx={campoCadastroSx}
                  />

                  <TextField
              size="small"
                    label="Observações do contato"
                    multiline
                    minRows={2}
                    value={contact.notes}
                    onChange={(event) =>
                      updateContact(index, 'notes', event.target.value)
                    }
                    sx={{
                      ...campoCadastroSx,
                      gridColumn: { xs: 'auto', md: '1 / -1' },
                    }}
                  />
                </FieldGrid>
              </Paper>
            ))}

            <Button
              type="button"
              variant="outlined"
              startIcon={<PlusCircle size={17} />}
              onClick={addContact}
              sx={{
                minHeight: 42,
                width: 'fit-content',
                borderRadius: '10px',
                borderColor: '#fed7aa',
                color: '#9a3412',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { borderColor: '#f97316', bgcolor: '#ffedd5' },
              }}
            >
              Adicionar contato
            </Button>
          </Stack>
        </ClientFormSection>

        <ClientFormSection
          title="Documentos"
          description="Contratos, cartões CNPJ, comprovantes ou planilhas."
          icon={<FileText size={20} />}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px dashed #cbd5e1',
              borderRadius: '14px',
              bgcolor: '#f8fafc',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: '#334155', fontSize: 14, fontWeight: 700 }}>
                  Inserir documentos
                </Typography>
                <Typography sx={{ mt: 0.35, color: '#64748b', fontSize: 13 }}>
                  {documentFiles.length > 0
                    ? `${documentFiles.length} arquivo(s) selecionado(s).`
                    : 'Nenhum arquivo selecionado.'}
                </Typography>
              </Box>

              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadCloud size={17} />}
                sx={{
                  minHeight: 42,
                  borderRadius: '10px',
                  borderColor: '#fed7aa',
                  color: '#9a3412',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { borderColor: '#f97316', bgcolor: '#ffedd5' },
                }}
              >
                Selecionar arquivos
                <Box
                  component="input"
                  type="file"
                  multiple
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setDocumentFiles(Array.from(event.target.files ?? []))
                  }
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
            </Stack>

            {documentFiles.length > 0 ? (
              <>
                <Divider sx={{ my: 1.75 }} />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {documentFiles.map((file) => (
                    <Chip
                      key={`${file.name}-${file.size}`}
                      label={file.name}
                      size="small"
                      onDelete={() =>
                        setDocumentFiles((current) =>
                          current.filter(
                            (currentFile) =>
                              !(
                                currentFile.name === file.name &&
                                currentFile.size === file.size
                              ),
                          ),
                        )
                      }
                      sx={{
                        maxWidth: '100%',
                        borderRadius: '8px',
                        bgcolor: '#ffffff',
                        color: '#334155',
                        fontSize: 12,
                        fontWeight: 700,
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        },
                      }}
                    />
                  ))}
                </Stack>
              </>
            ) : null}
          </Paper>
        </ClientFormSection>

        <TextField
              size="small"
          label="Observações"
          multiline
          minRows={4}
          value={form.notes}
          onChange={(event) =>
            setForm((current) => ({ ...current, notes: event.target.value }))
          }
          placeholder="Observações cadastrais, histórico ou contexto comercial."
          sx={campoCadastroSx}
        />

        <Alert
          severity="info"
          sx={{
            borderRadius: '12px',
            bgcolor: '#f8fafc',
            color: '#475569',
            '& .MuiAlert-icon': { color: crmPalette.orange },
          }}
        >
          Revise os dados da empresa e os contatos antes de salvar o cadastro.
        </Alert>

        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={1.25}
          sx={{ justifyContent: 'flex-end' }}
        >
          <Button
            type="button"
            variant="outlined"
            disabled={disabled}
            onClick={onCancel}
            sx={{
              minHeight: 44,
              borderRadius: '10px',
              fontWeight: 800,
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={disabled}
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PlusCircle size={17} />
              )
            }
            sx={{
              minHeight: 44,
              px: 2.5,
              borderRadius: '10px',
              bgcolor: crmPalette.orange,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: crmPalette.orangeDark,
                boxShadow: 'none',
              },
            }}
          >
            {loading ? 'Salvando...' : submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
