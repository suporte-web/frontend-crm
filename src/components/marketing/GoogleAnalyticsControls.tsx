"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  conectarGoogleAnalytics,
  desconectarGoogleAnalytics,
  listarPropriedadesGoogleAnalytics,
  selecionarPropriedadeGoogleAnalytics,
  testarGoogleAnalytics,
} from "@/services/marketing-integrations.service";
import type {
  GoogleAnalyticsProperty,
  MarketingIntegration,
} from "@/types/marketing-integrations";

export function GoogleAnalyticsControls({
  integration,
  token,
  onChanged,
}: {
  integration: MarketingIntegration;
  token: string | null;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [properties, setProperties] = useState<GoogleAnalyticsProperty[]>([]);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [propertyId, setPropertyId] = useState("");

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("google");
    if (outcome) {
      params.delete("google");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${params.size ? `?${params}` : ""}`,
      );
    }
    async function load() {
      try {
        const result = await listarPropriedadesGoogleAnalytics(
          token!,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setPending(result.pending);
        setProperties(result.properties);
        setOpen(result.pending);
        if (outcome === "erro" || outcome === "cancelado")
          setError(
            outcome === "cancelado"
              ? "Autorização cancelada. Você pode conectar novamente."
              : "Não foi possível autorizar o Google Analytics. Tente conectar novamente.",
          );
      } catch {
        if (!controller.signal.aborted)
          setError(
            "Não foi possível verificar as propriedades disponíveis. Atualize a página e tente novamente.",
          );
      }
    }
    void load();
    return () => controller.abort();
  }, [token]);

  async function action(run: () => Promise<void>) {
    if (busy || !token) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await run();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a operação. Tente novamente.",
      );
      await onChanged().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={1.5}>
      <Alert severity="info">
        Para consultar relatórios sem Google Cloud, importe um CSV do GA4 em
        Métricas. A conexão automática abaixo exige credenciais.
      </Alert>
      <Button component={Link} href="/marketing/metricas" variant="outlined">
        Importar relatório do GA4
      </Button>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {message ? <Alert severity="success">{message}</Alert> : null}
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button
          variant="contained"
          disabled={busy || !token}
          onClick={() =>
            void action(async () => {
              const result = await conectarGoogleAnalytics(token!);
              window.location.assign(result.url);
            })
          }
        >
          {busy ? "Aguarde..." : integration.ativo ? "Reconectar" : "Conectar"}
        </Button>
        {pending ? (
          <Button
            variant="outlined"
            disabled={busy}
            onClick={() => setOpen(true)}
          >
            Selecionar propriedade
          </Button>
        ) : null}
        {integration.ativo ? (
          <Button
            variant="outlined"
            disabled={busy}
            onClick={() =>
              void action(async () => {
                const result = await testarGoogleAnalytics(token!);
                await onChanged();
                setMessage(result.message);
              })
            }
          >
            Testar conexão
          </Button>
        ) : null}
        {integration.id ? (
          <Button
            color="error"
            disabled={busy}
            onClick={() => setConfirmDisconnect(true)}
          >
            Desconectar
          </Button>
        ) : null}
      </Stack>
      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Selecionar propriedade GA4</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Selecione a propriedade da Pizzattolog para consultar as métricas.
          </Typography>
          {properties.length ? (
            <TextField
              fullWidth
              select
              label="Propriedade"
              value={propertyId}
              disabled={busy}
              onChange={(event) => setPropertyId(event.target.value)}
            >
              {properties.map((property) => (
                <MenuItem key={property.propertyId} value={property.propertyId}>
                  {property.accountName} / {property.propertyName} (
                  {property.propertyId})
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Alert severity="warning">
              Nenhuma propriedade GA4 disponível. Verifique se a conta
              autorizada tem acesso à propriedade da Pizzattolog e conecte
              novamente.
            </Alert>
          )}
          {error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setOpen(false)}>
            Agora não
          </Button>
          <Button
            variant="contained"
            disabled={busy || !propertyId}
            onClick={() =>
              void action(async () => {
                const result = await selecionarPropriedadeGoogleAnalytics(
                  token!,
                  propertyId,
                );
                setPending(false);
                setOpen(false);
                await onChanged();
                setMessage(result.message);
              })
            }
          >
            {busy ? "Conectando..." : "Salvar e conectar"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmDisconnect}
        onClose={() => !busy && setConfirmDisconnect(false)}
      >
        <DialogTitle>Desconectar Google Analytics?</DialogTitle>
        <DialogContent>
          A autorização será removida do CRM. Para voltar a consultar as
          métricas, será necessário conectar novamente.
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setConfirmDisconnect(false)}>
            Cancelar
          </Button>
          <Button
            color="error"
            disabled={busy}
            onClick={() =>
              void action(async () => {
                const result = await desconectarGoogleAnalytics(token!);
                setPending(false);
                setOpen(false);
                setConfirmDisconnect(false);
                await onChanged();
                setMessage(result.message);
              })
            }
          >
            Desconectar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
