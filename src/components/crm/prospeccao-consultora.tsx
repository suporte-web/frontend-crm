"use client";
import { Chip, Stack, Typography } from "@mui/material";
import { useAuth } from "@/context/auth-context";
import { hasAnyRole } from "@/lib/user-roles";
export function IdentificacaoProspeccao({
  registro,
}: {
  registro: { prospectedByName?: string | null };
}) {
  const { user } = useAuth();
  if (
    !user ||
    user.role === "CONSULTORA" ||
    user.roles?.includes("CONSULTORA") ||
    !hasAnyRole(user, ["ADMIN", "GESTAO", "COMERCIAL"]) ||
    !registro.prospectedByName
  ) return null;
  return (
    <Stack spacing={0.5} sx={{ mt: 1, alignItems: "flex-start" }}>
      <Chip
        size="small"
        variant="outlined"
        label="Prospecção da consultora"
        sx={{ color: "#0288d1", borderColor: "#81d4fa", bgcolor: "#e1f5fe" }}
      />
      <Typography variant="caption" color="text.secondary">
        {registro.prospectedByName}
      </Typography>
    </Stack>
  );
}

