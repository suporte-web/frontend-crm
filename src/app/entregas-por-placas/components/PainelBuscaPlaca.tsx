"use client";

import type { FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  ManageSearchRounded,
  SearchRounded,
  TuneRounded,
} from "@mui/icons-material";
import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";
import { placaValida } from "@/lib/entrega-por-placa.utils";

type PropriedadesPainelBuscaPlaca = {
  placa: string;
  placaFormatada: string;
  loading: boolean;
  onPlacaChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 48,
    borderRadius: "12px",
    bgcolor: "#fff",
    fontWeight: 800,
  },
  "& .MuiInputLabel-root": {
    fontWeight: 800,
  },
};

export function PainelBuscaPlaca({
  placa,
  placaFormatada,
  loading,
  onPlacaChange,
  onSubmit,
}: PropriedadesPainelBuscaPlaca) {
  const hasInvalidPlate = Boolean(placa) && !placaValida(placaFormatada);

  return (
    <CrmSection sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            borderRadius: "12px",
            bgcolor: "#fff0e8",
            color: crmPalette.orangeDark,
            border: "1px solid #fed7c3",
          }}
        >
          <TuneRounded sx={{ fontSize: 21 }} />
        </Box>

        <Box>
          <Typography
            component="h2"
            sx={{ color: "#020617", fontSize: 19, fontWeight: 900 }}
          >
            Consulta por placa
          </Typography>
          <Typography sx={{ color: crmPalette.muted, fontSize: 14 }}>
            Informe a placa do veiculo para localizar CTRCs, motorista e status.
          </Typography>
        </Box>
      </Stack>

      <Box component="form" onSubmit={onSubmit} sx={{ mt: 2.25 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{ alignItems: { xs: "stretch", sm: "flex-start" } }}
        >
          <TextField
            label="Placa do veiculo"
            size="small"
            placeholder="Ex.: ABC1D23"
            value={placa}
            onChange={(event) => onPlacaChange(event.target.value.toUpperCase())}
            disabled={loading}
            error={hasInvalidPlate}
            helperText={
              hasInvalidPlate
                ? "Digite uma placa como ABC1234 ou ABC1D23."
                : "Voce pode digitar a placa com ou sem hifen."
            }
            slotProps={{
              htmlInput: {
                maxLength: 8,
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ManageSearchRounded
                      sx={{ color: "#94a3b8", fontSize: 21 }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              ...fieldSx,
              width: {
                xs: "100%",
                sm: 260,
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SearchRounded sx={{ fontSize: 20 }} />
              )
            }
            sx={{
              minWidth: { xs: "100%", sm: 150 },
              minHeight: 48,
              borderRadius: "12px",
              bgcolor: crmPalette.orange,
              boxShadow: "0 12px 24px rgba(255,77,0,0.22)",
              fontWeight: 900,
              textTransform: "none",
              "&:hover": { bgcolor: crmPalette.orangeDark },
            }}
          >
            {loading ? "Consultando..." : "Buscar entregas"}
          </Button>
        </Stack>
      </Box>
    </CrmSection>
  );
}
