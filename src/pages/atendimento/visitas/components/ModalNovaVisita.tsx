import { useId, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography,
} from "@mui/material";
import { X } from "lucide-react";
import { liderSac } from "@/components/atendimento-sac/ComponentesSac";
import { FormularioVisita, type DadosFormularioVisita } from "@/components/visitas/FormularioVisita";
import { notificarCrm } from "@/lib/feedback-crm";
import { VisitasService } from "@/stores/visitas/service";
import { useUser } from "@/UserContext";

type ModalNovaVisitaProps = {
  setFlushHook: Dispatch<SetStateAction<boolean>>;
};

export function ModalNovaVisita({ setFlushHook }: ModalNovaVisitaProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const salvando = useRef(false);
  const formId = useId();
  const titleId = useId();
  const permitido = liderSac(user?.roles?.length ? user.roles : user?.role);

  const handleOpen = () => {
    if (!salvando.current) setOpen(true);
  };
  const handleClose = () => {
    if (!salvando.current) setOpen(false);
  };

  const handleCreate = async (dados: DadosFormularioVisita) => {
    if (salvando.current || !permitido) return;
    salvando.current = true;
    setOcupado(true);
    try {
      await VisitasService.criarVisita(dados);
      notificarCrm("Visita cadastrada com sucesso.");
      setOpen(false);
      setFlushHook(prev => !prev);
    } finally {
      salvando.current = false;
      setOcupado(false);
    }
  };

  if (!permitido) return null;

  return (
    <>
      <Button
        onClick={handleOpen}
        aria-haspopup="dialog"
        variant="contained"
        size="small"
        sx={{ textTransform: "none", borderRadius: "10px" }}
      >
        Nova Visita
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="lg"
        aria-labelledby={titleId}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              m: { xs: 2, sm: 4 },
              width: { xs: "calc(100% - 32px)", sm: "calc(100% - 64px)" },
            },
          },
        }}
      >
        <DialogTitle id={titleId} sx={{ pr: 7, fontWeight: 700 }}>
          Nova Visita
          <IconButton
            aria-label="Fechar nova visita"
            disabled={ocupado}
            onClick={handleClose}
            sx={{ position: "absolute", top: 12, right: 12 }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Organize a visita ao cliente e acompanhe cada etapa até a avaliação final.
          </Typography>
          {open && (
            <FormularioVisita
              id={formId}
              exibirAcaoSalvar={false}
              permitido={permitido}
              ocupado={ocupado}
              salvar={handleCreate}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          <Button disabled={ocupado} onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="contained"
            size="small"
            disabled={ocupado}
            sx={{ minHeight: 40, minWidth: 140, borderRadius: "8px" }}
          >
            {ocupado ? "Salvando…" : "Criar visita"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
