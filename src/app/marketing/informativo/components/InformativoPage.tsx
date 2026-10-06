"use client";

import { hasAnyRole } from "@/lib/user-roles";
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AppLayout } from "@/components/layout/app-layout";
import {
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
} from "@/components/mui/crm-primitives";
import { appScreens, isScreenEnabledForRole } from "@/config/screens";
import { useAuth } from "@/context/auth-context";
import { listarAssinantesInformativo } from "@/services/informativo.service";
import type {
  InformativoAssinante,
  ListagemInformativo,
  StatusInformativo,
} from "@/types/informativo";
import { Mail } from "lucide-react";

const screen = appScreens.find((item) => item.key === "informativo")!;
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function dataCadastro(value: string) {
  return dateFormatter.format(new Date(value)).replace(", ", " ");
}

function StatusChip({ status }: { status: StatusInformativo }) {
  return (
    <Chip
      size="small"
      label={status === "ATIVO" ? "Ativo" : "Descadastrado"}
      color={status === "ATIVO" ? "success" : "default"}
    />
  );
}

function origem(assinante: InformativoAssinante) {
  return assinante.origem === "SITE_PIZZATTOLOG"
    ? "Site Pizzattolog"
    : assinante.origem;
}

export default function InformativoPage() {
  const { token, user, loading: authLoading } = useAuth();
  const isAllowed = Boolean(
    user &&
    hasAnyRole(user, ["ADMIN", "MARKETING"]) &&
    isScreenEnabledForRole(screen, user.roles?.length ? user.roles : user.role, user.screenPermissions),
  );
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusInformativo | "">("");
  const [data, setData] = useState<ListagemInformativo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token || !isAllowed) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await listarAssinantesInformativo(
          token,
          { q, status: status || undefined },
          controller.signal,
        );
        if (!controller.signal.aborted) setData(result);
      } catch {
        if (!controller.signal.aborted)
          setError("Não foi possível carregar os inscritos. Tente novamente.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [token, isAllowed, q, status, reload]);

  return (
    <AppLayout>
      {authLoading ? (
        <CircularProgress aria-label="Carregando" />
      ) : !isAllowed ? (
        <Alert severity="warning">
          Esta área é restrita aos perfis de Marketing e Administração com
          acesso ao informativo.
        </Alert>
      ) : (
        <CrmPageShell>
          <CrmPageHeader
            eyebrow="Marketing"
            title="Informativo Pizzattolog"
            description="Pessoas cadastradas para receber conteúdos e novidades da Pizzattolog."
            icon={<Mail size={24} />}
            aside={
              <Button
                onClick={() => setReload((value) => value + 1)}
                disabled={loading}
              >
                Atualizar
              </Button>
            }
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            {[
              { label: "Total de inscritos", value: data?.totais.total },
              { label: "Ativos", value: data?.totais.ativos },
              { label: "Descadastrados", value: data?.totais.descadastrados },
            ].map((card) => (
              <CrmSection key={card.label} sx={{ p: 3 }}>
                <Typography color="text.secondary">{card.label}</Typography>
                <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                  {card.value ?? "—"}
                </Typography>
              </CrmSection>
            ))}
          </Box>
          <CrmSection sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                alignItems: "center",
              }}
            >
              <TextField
                label="Buscar por nome ou e-mail"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                sx={{
                  width: {
                    xs: "100%",
                    sm: 450,
                  },
                  "& .MuiOutlinedInput-root": {
                    height: 52,
                  },
                }}
              />

              <TextField
                select
                label="Status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusInformativo | "")
                }
                sx={{
                  width: {
                    xs: "100%",
                    sm: 450,
                  },
                  "& .MuiOutlinedInput-root": {
                    height: 52,
                  },
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ATIVO">Ativos</MenuItem>
                <MenuItem value="DESCADASTRADO">
                  Descadastrados
                </MenuItem>
              </TextField>
            </Stack>
          </CrmSection>
          {error ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  onClick={() => setReload((value) => value + 1)}
                >
                  Tentar novamente
                </Button>
              }
            >
              {error}
            </Alert>
          ) : null}
          <CrmSection>
            {loading ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <CircularProgress aria-label="Carregando inscritos" />
              </Box>
            ) : error ? null : !data?.assinantes.length ? (
              <Typography sx={{ p: 4, textAlign: "center" }}>
                Nenhum inscrito encontrado.
              </Typography>
            ) : (
              <>
                <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
                  <Table aria-label="Inscritos no Informativo Pizzattolog">
                    <TableHead>
                      <TableRow>
                        {[
                          "Nome",
                          "E-mail",
                          "Status",
                          "Origem",
                          "Data de cadastro",
                        ].map((label) => (
                          <TableCell key={label}>{label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.assinantes.map((assinante) => (
                        <TableRow key={assinante.id} hover>
                          <TableCell>{assinante.nome}</TableCell>
                          <TableCell>{assinante.email}</TableCell>
                          <TableCell>
                            <StatusChip status={assinante.status} />
                          </TableCell>
                          <TableCell>{origem(assinante)}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {dataCadastro(assinante.criadoEm)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack
                  sx={{ display: { xs: "flex", md: "none" } }}
                  divider={
                    <Box
                      sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                    />
                  }
                >
                  {data.assinantes.map((assinante) => (
                    <Box
                      key={assinante.id}
                      sx={{ p: 2, overflowWrap: "anywhere" }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: "space-between", mb: 1 }}
                      >
                        <Typography sx={{ fontWeight: 700 }}>
                          {assinante.nome}
                        </Typography>
                        <StatusChip status={assinante.status} />
                      </Stack>
                      <Typography>{assinante.email}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {origem(assinante)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cadastro: {dataCadastro(assinante.criadoEm)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </>
            )}
          </CrmSection>
        </CrmPageShell>
      )}
    </AppLayout>
  );
}
