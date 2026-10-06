"use client";
import { useRef, useState } from "react";
import { Alert, Button, Stack, TextField } from "@mui/material";

export function UploadAnexos({
  enviarArquivo,
  concluido,
  erro,
}: {
  enviarArquivo: (arquivo: File, comentario: string) => Promise<unknown>;
  concluido: () => Promise<void>;
  erro: (m: string) => void;
}) {
  const [arquivos, setArquivos] = useState<
    Array<{ arquivo: File; comentario: string }>
  >([]);
  const [ocupado, setOcupado] = useState(false);
  const enviando = useRef(false);
  async function enviar() {
    if (enviando.current) return;
    enviando.current = true;
    setOcupado(true);
    try {
      const pendentes = [...arquivos];
      while (pendentes.length) {
        const a = pendentes[0];
        await enviarArquivo(a.arquivo, a.comentario);
        pendentes.shift();
        setArquivos([...pendentes]);
      }
      await concluido();
    } catch (e) {
      erro(e instanceof Error ? e.message : "Erro no envio.");
    } finally {
      enviando.current = false;
      setOcupado(false);
    }
  }
  return (
    <Stack spacing={1}>
      <Alert severity="info">
        Sem limite de quantidade. PDF, JPG ou PNG, até 10 MB cada. Adicione um
        comentário a cada arquivo, se desejar.
      </Alert>
      <Button
        component="label"
        variant="outlined"
        disabled={ocupado}
        sx={{
          width: "fit-content",
          minWidth: 0,

          px: 1.75,
          py: 0.5,

          color: "#ff5805",
          borderColor: "#ff5805",

          fontSize: 13,
          fontWeight: 700,
          textTransform: "none",

          "&:hover": {
            borderColor: "#e94f00",
            backgroundColor: "#fff3ee",
          },

          "&.Mui-disabled": {
            borderColor: "#ffb89c",
            color: "#ffb89c",
          },
        }}
      >
        Adicionar anexos

        <input
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png"
          hidden
          onChange={(e) => {
            const selecionados = Array.from(e.target.files || []);

            if (selecionados.some((f) => f.size > 10 * 1024 * 1024)) {
              erro("Cada anexo deve ter até 10 MB.");
              return;
            }

            setArquivos((a) => [
              ...a,
              ...selecionados.map((arquivo) => ({
                arquivo,
                comentario: "",
              })),
            ]);

            e.target.value = "";
          }}
        />
      </Button>
      {arquivos.map((a, i) => (
        <Stack
          key={`${a.arquivo.name}-${i}`}
          direction={{ xs: "column", md: "row" }}
          sx={{
            gap: 1,
            alignItems: {
              xs: "stretch",
              md: "center",
            },
          }}
        >
          <TextField
            label={`Comentário: ${a.arquivo.name}`}
            size="small"
            value={a.comentario}
            disabled={ocupado}
            slotProps={{
              htmlInput: {
                maxLength: 1000,
              },
            }}
            onChange={(e) =>
              setArquivos(
                arquivos.map((item, j) =>
                  j === i
                    ? {
                      ...item,
                      comentario: e.target.value,
                    }
                    : item,
                ),
              )
            }
            sx={{
              width: {
                xs: "100%",
                md: 800,
              },
            }}
          />

          <Button
            variant="outlined"
            disabled={ocupado}
            onClick={() =>
              setArquivos(
                arquivos.filter((_, j) => i !== j),
              )
            }
            sx={{
              width: {
                xs: "100%",
                md: "fit-content",
              },
              minWidth: {
                md: 80,
              },

              px: 1.5,
              py: 0.5,

              color: "#d32f2f",
              borderColor: "#d32f2f",

              fontSize: 12,
              fontWeight: 700,
              textTransform: "none",

              "&:hover": {
                borderColor: "#b71c1c",
                backgroundColor: "#fff5f5",
              },
            }}
          >
            Excluir
          </Button>
        </Stack>
      ))}
      {!!arquivos.length && (
        <Button
          variant="contained"
          disabled={ocupado}
          onClick={enviar}
          sx={{
            width: "fit-content",
            minWidth: 0,

            px: 2,
            py: 0.6,

            backgroundColor: "#ff5805",
            color: "#ffffff",

            fontSize: 13,
            fontWeight: 700,
            textTransform: "none",

            "&:hover": {
              backgroundColor: "#e94f00",
            },

            "&.Mui-disabled": {
              backgroundColor: "#ffb89c",
              color: "#ffffff",
            },
          }}
        >
          {ocupado ? "Enviando…" : "Enviar anexos"}
        </Button>
      )}
    </Stack>
  );
}
