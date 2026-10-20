"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Alert, Avatar, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { ImagePlus } from "lucide-react";
import { atualizarFotoCadastro } from "@/services/cadastros.service";

export function FotoCadastro({ valor, aoAlterar, desabilitado = false }: {
  valor: string; aoAlterar: (foto: string) => void; desabilitado?: boolean;
}) {
  const [erro, setErro] = useState("");
  const [lendo, setLendo] = useState(false);
  function selecionar(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(arquivo.type)) {
      setErro("Selecione uma imagem PNG, JPG, WebP ou GIF.");
      return;
    }
    if (arquivo.size > 1.5 * 1024 * 1024) {
      setErro("A imagem precisa ter até 1,5 MB.");
      return;
    }
    setErro("");
    setLendo(true);
    const leitor = new FileReader();
    leitor.onload = () => { if (typeof leitor.result === "string") aoAlterar(leitor.result); setLendo(false); };
    leitor.onerror = () => { setErro("Não foi possível ler a imagem. Tente novamente."); setLendo(false); };
    leitor.readAsDataURL(arquivo);
  }
  return <Stack spacing={1.5}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
      <Avatar src={valor || undefined} alt="Foto ou logo do cadastro" variant="rounded" sx={{ width: 72, height: 72, borderRadius: "12px", bgcolor: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0", "& img": { objectFit: "contain" } }}><ImagePlus size={26} /></Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>Foto ou logo do cliente ou lead</Typography>
        <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 12 }}>PNG, JPG, WebP ou GIF. Até 1,5 MB.</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
          <Button component="label" variant="outlined" disabled={desabilitado || lendo} startIcon={<ImagePlus size={16} />} sx={{ minHeight: 36, borderRadius: "8px", textTransform: "none", borderColor: "#fed7aa", color: "#c2410c", fontSize: 12, fontWeight: 600 }}>
            {lendo ? "Carregando..." : valor ? "Trocar imagem" : "Enviar imagem"}
            <input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selecionar} disabled={desabilitado || lendo} />
          </Button>
          {valor && <Button disabled={desabilitado || lendo} onClick={() => { aoAlterar(""); setErro(""); }} sx={{ textTransform: "none", color: "#64748b", fontSize: 12 }}>Remover</Button>}
        </Stack>
      </Box>
    </Stack>
    {erro && <Alert severity="error">{erro}</Alert>}
  </Stack>;
}

export function FotoCadastroSalvo({ id, foto, token, aoSalvar }: { id: string; foto?: string | null; token: string; aoSalvar: () => Promise<void> }) {
  const [valor, setValor] = useState(foto || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  useEffect(() => { setValor(foto || ""); setErro(""); }, [id, foto]);
  async function salvar() {
    setSalvando(true); setErro("");
    try { await atualizarFotoCadastro(id, valor, token); await aoSalvar(); }
    catch (erro) { setErro(erro instanceof Error ? erro.message : "Não foi possível salvar a imagem."); }
    finally { setSalvando(false); }
  }
  return <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: "14px", borderColor: "#e2e8f0" }}>
    <Stack spacing={2}>
      <FotoCadastro valor={valor} aoAlterar={setValor} desabilitado={salvando} />
      {erro && <Alert severity="error">{erro}</Alert>}
      {valor !== (foto || "") && <Button variant="contained" onClick={salvar} disabled={salvando} sx={{ alignSelf: "flex-start", bgcolor: "#ff5805", textTransform: "none", borderRadius: "8px", boxShadow: "none", "&:hover": { bgcolor: "#e94f00", boxShadow: "none" } }}>{salvando ? "Salvando..." : "Salvar imagem"}</Button>}
    </Stack>
  </Paper>;
}
