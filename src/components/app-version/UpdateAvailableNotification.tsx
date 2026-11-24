import { Box, Button, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { RefreshCw } from 'lucide-react';

export function UpdateAvailableNotification({ open, onUpdate, onLater }: { open: boolean; onUpdate: () => void; onLater: () => void }) {
  return <Snackbar open={open} autoHideDuration={null} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    sx={{ bottom: { xs: 176, sm: 176 }, right: { xs: 16, sm: 24 }, left: { xs: 16, sm: 'auto' }, maxWidth: 'calc(100vw - 32px)' }}>
    <Paper role="status" aria-live="polite" elevation={6} sx={{ p: 2.5, width: { xs: '100%', sm: 420 }, maxWidth: '100%', boxSizing: 'border-box', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}><RefreshCw size={24} aria-hidden="true" /></Box>
        <Box><Typography component="h2" sx={{ fontWeight: 700 }}>Nova versão disponível</Typography><Typography variant="caption" color="text.secondary">Tecnologia da Informação</Typography></Box>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>Uma nova versão do CRM foi disponibilizada pela equipe de Tecnologia da Informação. Atualize o sistema para acessar as melhorias mais recentes.</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'flex-end' }}>
        <Button onClick={onLater}>Atualizar depois</Button>
        <Button onClick={onUpdate} variant="contained">Atualizar agora</Button>
      </Stack>
    </Paper>
  </Snackbar>;
}
