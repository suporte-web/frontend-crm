"use client";

import type { ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Building2, FileText, MapPin, ReceiptText, Save, StickyNote } from "lucide-react";
import { CrmSection } from "@/components/mui/crm-primitives";
import { formatLeadStatus } from "@/services/crm.service";
import type { LeadStatus } from "@/types/crm";
import {
  CabecalhoSecao,
  UF_OPTIONS,
  clienteParaFormularioCliente,
  contatosClienteParaFormulario,
  formatarData,
} from "./detalhes-cliente-compartilhado";
import type { FormularioCliente, PropriedadesAbaDetalhesCliente } from "./detalhes-cliente-compartilhado";

const laranja = "#ff5805";
const gradeCamposSx = {
  display: "grid",
  gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" },
  gap: 2,
  alignItems: "start",
};
const campoSx = {
  minWidth: 0,
  "& .MuiOutlinedInput-root": {
    minHeight: 40,
    borderRadius: "8px",
    bgcolor: "#fff",
    "&:not(.MuiInputBase-multiline)": { height: 40 },
    "&.Mui-focused fieldset": { borderColor: laranja },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: laranja },
  "& .MuiInputBase-input": { fontSize: 14 },
  "& .MuiFormHelperText-root": { mx: 0, fontSize: 12 },
};
const botaoPrincipalSx = {
  minHeight: 40,
  px: 2,
  borderRadius: "8px",
  bgcolor: laranja,
  color: "#fff",
  fontWeight: 700,
  textTransform: "none",
  boxShadow: "none",
  "&:hover": { bgcolor: "#e94f00", boxShadow: "none" },
};

type OpcaoCampo = { valor: string; rotulo: string };
type CampoFormulario = {
  chave: keyof FormularioCliente;
  rotulo: string;
  tipo?: "date" | "tel";
  opcoes?: OpcaoCampo[];
  multiline?: boolean;
};
const regimes: OpcaoCampo[] = [
  { valor: "", rotulo: "Selecione" },
  { valor: "SIMPLES_NACIONAL", rotulo: "Simples Nacional" },
  { valor: "SIMPLES_NACIONAL_EXCESSO_SUBLIMITE", rotulo: "Simples Nacional — excesso de sublimite" },
  { valor: "REGIME_NORMAL", rotulo: "Regime Normal" },
  { valor: "MEI", rotulo: "MEI" },
];
const tributacoes: OpcaoCampo[] = [
  { valor: "", rotulo: "Selecione" },
  { valor: "LUCRO_PRESUMIDO", rotulo: "Lucro Presumido" },
  { valor: "LUCRO_REAL", rotulo: "Lucro Real" },
  { valor: "SIMPLES_NACIONAL", rotulo: "Simples Nacional" },
];
const identificacao: CampoFormulario[] = [
  { chave: "companyName", rotulo: "Empresa" },
  { chave: "document", rotulo: "CNPJ" },
  { chave: "legalName", rotulo: "Razão social" },
  { chave: "tradeName", rotulo: "Nome fantasia" },
];
const fiscal: CampoFormulario[] = [
  { chave: "cnae", rotulo: "CNAE" },
  { chave: "stateRegistration", rotulo: "Inscrição estadual" },
  { chave: "businessActivity", rotulo: "Atividade comercial" },
  { chave: "taxRegime", rotulo: "Regime tributário", opcoes: regimes },
  { chave: "taxation", rotulo: "Tributação", opcoes: tributacoes },
];
const comercial: CampoFormulario[] = [
  { chave: "segment", rotulo: "Segmento" },
  { chave: "phone", rotulo: "Telefone", tipo: "tel" },
  { chave: "registrationDate", rotulo: "Data do cadastro", tipo: "date" },
  { chave: "status", rotulo: "Status", opcoes: [
    { valor: "PENDENTE", rotulo: "Pendente" },
    { valor: "ATIVO", rotulo: "Ativo" },
    { valor: "INATIVO", rotulo: "Inativo" },
  ] },
];
const endereco: CampoFormulario[] = [
  { chave: "zipCode", rotulo: "CEP" },
  { chave: "street", rotulo: "Rua / Logradouro" },
  { chave: "number", rotulo: "Número" },
  { chave: "complement", rotulo: "Complemento" },
  { chave: "neighborhood", rotulo: "Bairro" },
  { chave: "city", rotulo: "Cidade" },
  { chave: "state", rotulo: "UF", opcoes: UF_OPTIONS.map(uf => ({ valor: uf, rotulo: uf })) },
];

function SecaoCadastro({ titulo, descricao, icone, ampla = false, children }: {
  titulo: string; descricao: string; icone: ReactNode; ampla?: boolean; children: ReactNode;
}) {
  return (
    <Paper component="section" elevation={0} sx={{
      p: { xs: 2, md: 2.5 }, minWidth: 0, border: "1px solid #e2e8f0",
      borderRadius: "14px", bgcolor: "#fff", boxShadow: "none",
      ...(ampla ? { gridColumn: "1 / -1" } : {}),
    }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", color: "#64748b", "& svg": { width: 20, height: 20, strokeWidth: 1.8 } }}>{icone}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h3" sx={{ color: "#1f2937", fontSize: 16, fontWeight: 700 }}>{titulo}</Typography>
          <Typography sx={{ color: "#64748b", fontSize: 12.5, mt: 0.25 }}>{descricao}</Typography>
        </Box>
      </Stack>
      <Divider sx={{ mb: 2, borderColor: "#f1f5f9" }} />
      {children}
    </Paper>
  );
}

export function AbaCadastroCliente(props: PropriedadesAbaDetalhesCliente) {
  const {
    currentLead, canEditClient, clientForm, setFormularioCliente, clientFormError,
    setFormularioClienteError, isEditingClient, setIsEditingClient, savingClient,
    handleUpdateClient, setClientContacts,
  } = props;
  const dadosCadastro = clienteParaFormularioCliente(currentLead);

  function atualizarCampo(chave: keyof FormularioCliente, valor: string) {
    setFormularioCliente(current => {
      if (chave === "taxRegime") return {
        ...current, taxRegime: valor, taxation: valor === "REGIME_NORMAL" ? current.taxation : "",
      };
      if (chave === "status") return { ...current, status: valor as LeadStatus };
      return { ...current, [chave]: valor };
    });
  }

  function renderizarCampos(campos: CampoFormulario[], ampla = false) {
    return (
      <Box sx={{ ...gradeCamposSx, ...(ampla ? { gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" } } : {}) }}>
        {campos.filter(campo => !isEditingClient || campo.chave !== "taxation" || clientForm.taxRegime === "REGIME_NORMAL").map(campo => {
          const { chave, rotulo, opcoes, tipo, multiline } = campo;
          if (isEditingClient) return (
            <TextField
              key={chave} fullWidth size="small" label={rotulo}
              value={clientForm[chave]} type={tipo} select={!!opcoes}
              required={chave === "taxation" && clientForm.taxRegime === "REGIME_NORMAL"}
              disabled={savingClient} multiline={multiline} minRows={multiline ? 3 : undefined}
              onChange={event => atualizarCampo(chave, event.target.value)}
              slotProps={tipo === "date" ? { inputLabel: { shrink: true } } : undefined}
              helperText={chave === "taxation" ? "Obrigatório para empresas do Regime Normal." : undefined}
              sx={{ ...campoSx, ...(multiline ? { gridColumn: "1 / -1" } : {}) }}
            >
              {opcoes?.map(opcao => <MenuItem key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</MenuItem>)}
            </TextField>
          );
          let valor: string = dadosCadastro[chave] || "";
          if (chave === "registrationDate") valor = formatarData(currentLead.registrationDate ?? currentLead.createdAt);
          else if (chave === "status") valor = formatLeadStatus(currentLead.status);
          else if (opcoes) valor = opcoes.find(opcao => opcao.valor === valor)?.rotulo || valor;
          return (
            <Box key={chave} sx={{ minWidth: 0, ...(multiline ? { gridColumn: "1 / -1" } : {}) }}>
              <Typography sx={{ color: "#64748b", fontSize: 12, mb: 0.5 }}>{rotulo}</Typography>
              <Typography sx={{ color: "#1f2937", fontSize: 14, fontWeight: 500, overflowWrap: "anywhere", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {valor.trim() || "Não informado"}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <CrmSection sx={{ p: { xs: 2, md: 2.5 }, border: "1px solid #e2e8f0", borderRadius: "14px", bgcolor: "#fff", boxShadow: "none" }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between" }}>
          <CabecalhoSecao title="Dados do cliente" description="Informações cadastrais, fiscais e comerciais organizadas em um só lugar." />
          {canEditClient && (
            <Button type="button" variant={isEditingClient ? "outlined" : "contained"}
              disabled={savingClient}
              startIcon={isEditingClient ? <CloseRoundedIcon /> : <EditRoundedIcon />}
              onClick={() => {
                setIsEditingClient(current => !current);
                setFormularioCliente(clienteParaFormularioCliente(currentLead));
                setClientContacts(contatosClienteParaFormulario(currentLead));
                setFormularioClienteError("");
              }}
              sx={isEditingClient ? {
                minHeight: 40, px: 2, borderRadius: "8px", borderColor: "#cbd5e1",
                color: "#475569", bgcolor: "#fff", textTransform: "none", fontWeight: 700,
                whiteSpace: "nowrap", "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
              } : { ...botaoPrincipalSx, whiteSpace: "nowrap" }}
            >{isEditingClient ? "Cancelar edição" : "Editar cadastro"}</Button>
          )}
        </Stack>
        <Box component={isEditingClient ? "form" : "div"} onSubmit={isEditingClient ? handleUpdateClient : undefined}>
          {isEditingClient && clientFormError && <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>{clientFormError}</Alert>}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 2, alignItems: "start" }}>
            <SecaoCadastro titulo="Identificação" descricao="Dados da empresa e identificação cadastral." icone={<Building2 />}>
              {renderizarCampos(identificacao)}
            </SecaoCadastro>
            <SecaoCadastro titulo="Fiscal" descricao="Inscrição, atividade e enquadramento tributário." icone={<ReceiptText />}>
              {renderizarCampos(fiscal)}
            </SecaoCadastro>
            <SecaoCadastro titulo="Comercial" descricao="Segmento, contato e situação do cadastro." icone={<FileText />} ampla>
              {renderizarCampos(comercial, true)}
            </SecaoCadastro>
            <SecaoCadastro titulo="Endereço" descricao="Localização e endereço da empresa." icone={<MapPin />} ampla>
              {renderizarCampos(endereco, true)}
              {!isEditingClient && !dadosCadastro.street && currentLead.address && (
                <Typography sx={{ mt: 2, color: "#475569", fontSize: 14, overflowWrap: "anywhere" }}>{currentLead.address}</Typography>
              )}
            </SecaoCadastro>
            <SecaoCadastro titulo="Informações complementares" descricao="Observações e informações adicionais do cadastro." icone={<StickyNote />} ampla>
              {renderizarCampos([{ chave: "notes", rotulo: "Observações cadastrais", multiline: true }])}
            </SecaoCadastro>
          </Box>
          {isEditingClient && (
            <Stack direction="row" sx={{ mt: 2.5, justifyContent: "flex-end" }}>
              <Button type="submit" variant="contained" disabled={savingClient}
                startIcon={savingClient ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                sx={{ ...botaoPrincipalSx, width: { xs: "100%", sm: "auto" } }}
              >{savingClient ? "Salvando..." : "Salvar cadastro"}</Button>
            </Stack>
          )}
        </Box>
      </Stack>
    </CrmSection>
  );
}
