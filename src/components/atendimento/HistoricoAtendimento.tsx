"use client";
import { Box, Typography } from "@mui/material";
export type EventoAtendimento = {
  id: string;
  descricao: string;
  criadoEm: string;
  usuario?: { name: string } | null;
  statusAnterior?: string | null;
  statusNovo?: string | null;
  observacao?: string | null;
  tarefaId?: string | null;
  dados?: Record<string, unknown> | null;
};
export function HistoricoAtendimento({
  eventos,
  rotulos,
}: {
  eventos: EventoAtendimento[];
  rotulos: Record<string, string>;
}) {
  if (!eventos.length)
    return (
      <Typography color="text.secondary">
        Nenhuma movimentação registrada.
      </Typography>
    );
  return (
    <Box sx={{ borderLeft: "2px solid", borderColor: "divider", pl: 3 }}>
      {eventos.map((h) => (
        <Box
          key={h.id}
          sx={{
            position: "relative",
            pb: 3,
            "&:before": {
              content: '""',
              position: "absolute",
              left: -31,
              top: 6,
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "primary.main",
            },
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {h.descricao}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(h.criadoEm).toLocaleString("pt-BR")} ·{" "}
            {h.usuario?.name || "Site / sistema"}
            {h.tarefaId ? " · Tarefa " + h.tarefaId.slice(0, 8) : ""}
          </Typography>
          {h.statusAnterior &&
            h.statusNovo &&
            h.statusAnterior !== h.statusNovo && (
              <Typography variant="body2">
                {rotulos[h.statusAnterior] || h.statusAnterior} →{" "}
                {rotulos[h.statusNovo] || h.statusNovo}
              </Typography>
            )}
          {h.observacao && (
            <Typography
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {h.observacao}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
