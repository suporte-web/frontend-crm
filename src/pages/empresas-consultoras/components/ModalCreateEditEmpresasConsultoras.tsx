import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

export type FormularioEmpresaConsultora = {
  id?: string;
  nome: string;
  cnpj: string;
};

type ModalCreateEditEmpresasConsultorasProps = {
  formulario: FormularioEmpresaConsultora | null;
  ocupado: boolean;
  erro: string;
  onChange: (formulario: FormularioEmpresaConsultora) => void;
  onClose: () => void;
  onSave: (formulario: FormularioEmpresaConsultora) => void;
};

export function ModalCreateEditEmpresasConsultoras({
  formulario,
  ocupado,
  erro,
  onChange,
  onClose,
  onSave,
}: ModalCreateEditEmpresasConsultorasProps) {
  return (
    <Dialog
      open={Boolean(formulario)}
      onClose={() => {
        if (!ocupado) onClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {formulario?.id
          ? "Editar empresa consultora"
          : "Nova empresa consultora"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {erro && <Alert severity="error">{erro}</Alert>}
          <TextField
            autoFocus
            label="Nome da empresa"
            required
            value={formulario?.nome || ""}
            disabled={ocupado}
            onChange={(e) => {
              if (formulario) onChange({ ...formulario, nome: e.target.value });
            }}
          />
          <TextField
            label="CNPJ (opcional)"
            value={formulario?.cnpj || ""}
            disabled={ocupado}
            onChange={(e) => {
              if (formulario) onChange({ ...formulario, cnpj: e.target.value });
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={ocupado} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={ocupado || !formulario || formulario.nome.trim().length < 2}
          onClick={() => {
            if (formulario) onSave(formulario);
          }}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
