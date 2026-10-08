"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { AppLayout } from "@/components/layout/app-layout";
import {
  liderSac,
  SecaoSac,
} from "@/components/atendimento-sac/ComponentesSac";
import { useAuth } from "@/context/auth-context";
import { requisitarVisitas } from "@/services/visitas.api";
import type { Visita } from "@/types/visitas";
import { FormularioVisita } from "./FormularioVisita";
export default function PaginaNovaVisita() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const lider = liderSac(user?.roles?.length ? user.roles : user?.role);
  return (
    <AppLayout>
      <Stack spacing={3}>
        <Button
          component={Link}
          href="/atendimento/visitas"
          size="small"
          sx={{ alignSelf: "flex-start" }}
        >
          Voltar para visitas
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Nova visita
        </Typography>
        <Typography color="text.secondary">
          Organize a visita ao cliente e acompanhe cada etapa até a avaliação
          final.
        </Typography>
        {!lider ? (
          <Alert severity="warning">
            A criação de visitas é restrita à liderança e gestão.
          </Alert>
        ) : (
          token && (
            <SecaoSac titulo="Dados do agendamento">
              <FormularioVisita
                token={token}
                ocupado={ocupado}
                salvar={async (dados) => {
                  if (ocupado) return;
                  setOcupado(true);
                  try {
                    const v = await requisitarVisitas<Visita>(
                      token,
                      "",
                      "POST",
                      dados,
                    );
                    router.push("/atendimento/visitas/" + v.id);
                  } finally {
                    setOcupado(false);
                  }
                }}
              />
            </SecaoSac>
          )
        )}
      </Stack>
    </AppLayout>
  );
}
