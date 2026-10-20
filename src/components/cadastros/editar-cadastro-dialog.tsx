"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography } from "@mui/material";
import { X } from "lucide-react";
import { ClientForm, emptyClientContact, type ClientFormData, type ClientContactForm } from "@/components/clientes/client-form";
import { CamposComplementaresCadastro, type CamposComerciaisCadastro } from "./campos-complementares-cadastro";
import { alterarModalidade, atualizarEtapaCadastro, obterDadosLead, type ModalidadeCadastro } from "@/services/cadastros.service";
import { updateClient, uploadClientDocuments } from "@/services/crm.service";
import { normalizeLeadFunnelStage, type LeadFunnelStage } from "@/constants/lead-funnel";
import type { LeadDetail } from "@/types/crm";
import { clienteParaFormularioCliente, montarEnderecoCliente } from "@/app/clientes/[id]/components/detalhes-cliente/detalhes-cliente-compartilhado";

export function EditarCadastroDialog({ cadastro, token, aoFechar, aoSalvar }: {
  cadastro: LeadDetail; token: string; aoFechar: () => void; aoSalvar: () => Promise<void>;
}) {
  const [form, setForm] = useState<ClientFormData>(() => clienteParaFormularioCliente(cadastro));
  const [contatos, setContatos] = useState<ClientContactForm[]>(() => cadastro.contacts.length ? cadastro.contacts.map(contato => ({ name: contato.name || contato.nomeContato || "", role: contato.role || contato.cargo || "", email: contato.email || "", phone: contato.phone || contato.telefone || "", notes: contato.notes || "" })) : [emptyClientContact()]);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [modalidade, setModalidade] = useState<ModalidadeCadastro>(cadastro.modalidadeCadastro || "CLIENTE");
  const [etapa, setEtapa] = useState<LeadFunnelStage>(modalidade === "CLIENTE" ? "venda_efetivada" : "entrada_leads");
  const [comerciais, setComerciais] = useState<CamposComerciaisCadastro>({ proximaAcao: cadastro.proximaAcao || "", responsavel: cadastro.responsavel || "", volumeMensalEstimado: cadastro.volumeMensalEstimado || "" });
  const [foto, setFoto] = useState(cadastro.fotoUrl || "");
  const [fotoOriginal, setFotoOriginal] = useState(cadastro.fotoUrl || "");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let ativo = true;
    obterDadosLead(cadastro.id, token).then(lead => {
      if (!ativo) return;
      if (lead) {
        setEtapa(normalizeLeadFunnelStage(lead.status));
        setComerciais({ proximaAcao: String(lead.metadata?.nextAction ?? ""), responsavel: String(lead.metadata?.responsible ?? ""), volumeMensalEstimado: String(lead.metadata?.monthlyEstimatedValue ?? "") });
        const imagem = String(lead.metadata?.logoUrl ?? "");
        setFoto(imagem); setFotoOriginal(imagem);
      }
      setCarregando(false);
    }).catch(erro => { if (ativo) setErro(erro instanceof Error ? erro.message : "Não foi possível carregar o cadastro."); });
    return () => { ativo = false; };
  }, [cadastro.id, token]);

  async function buscarCnpj() {
    const cnpj = form.document.replace(/\D/g, "");
    if (cnpj.length !== 14) { setErro("Informe os 14 números do CNPJ para consultar."); return; }
    setBuscando(true); setErro("");
    try {
      const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      const dados = await resposta.json() as Record<string, unknown>;
      if (!resposta.ok) throw new Error(typeof dados.message === "string" ? dados.message : "Não foi possível consultar o CNPJ.");
      const texto = (chave: string) => dados[chave] == null ? "" : String(dados[chave]);
      setForm(atual => ({ ...atual,
        legalName: texto("razao_social") || atual.legalName, tradeName: texto("nome_fantasia") || atual.tradeName,
        companyName: texto("nome_fantasia") || texto("razao_social") || atual.companyName,
        cnae: texto("cnae_fiscal") || atual.cnae, businessActivity: texto("cnae_fiscal_descricao") || atual.businessActivity,
        segment: texto("cnae_fiscal_descricao") || atual.segment,
        taxRegime: dados.opcao_pelo_simples === true ? "Simples Nacional" : atual.taxRegime,
        zipCode: texto("cep") || atual.zipCode, street: [texto("descricao_tipo_logradouro"), texto("logradouro")].filter(Boolean).join(" ") || atual.street,
        number: texto("numero") || atual.number, complement: texto("complemento") || atual.complement,
        neighborhood: texto("bairro") || atual.neighborhood, city: texto("municipio") || atual.city, state: texto("uf") || atual.state,
      }));
    } catch (erro) { setErro(erro instanceof Error ? erro.message : "Erro ao consultar CNPJ."); }
    finally { setBuscando(false); }
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro("");
    const nome = form.companyName.trim() || form.tradeName.trim() || form.legalName.trim();
    if (!nome) { setErro("Informe o nome da empresa."); return; }
    if (modalidade === "CLIENTE" && !form.document.replace(/\D/g, "")) { setErro("Informe o documento do cliente."); return; }
    const volume = comerciais.volumeMensalEstimado.trim();
    if (volume && !/^(?:\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[,.]\d{1,2})?)$/.test(volume)) { setErro("Informe um volume mensal válido, por exemplo 12.500,00."); return; }
    setSalvando(true);
    let alteracoesSalvas = false;
    try {
      if (modalidade !== (cadastro.modalidadeCadastro || "CLIENTE")) {
        await alterarModalidade(cadastro.id, modalidade, form.document, token);
        alteracoesSalvas = true;
      }
      await updateClient(cadastro.id, {
        name: nome, companyName: nome, legalName: form.legalName, tradeName: form.tradeName, document: form.document,
        phone: form.phone, cnae: form.cnae, stateRegistration: form.stateRegistration, businessActivity: form.businessActivity,
        taxRegime: form.taxRegime, address: montarEnderecoCliente(form) || form.address, city: form.city,
        bankDetails: form.bankDetails, modality: form.modality, registrationDate: form.registrationDate || undefined,
        segment: form.segment, status: form.status, notes: form.notes,
        contacts: contatos.filter(contato => Object.values(contato).some(valor => valor.trim())).map((contato, indice) => ({ ...contato, isPrimary: indice === 0 })),
      }, token);
      alteracoesSalvas = true;
      await atualizarEtapaCadastro(cadastro.id, etapa, token, { ...comerciais, ...(foto !== fotoOriginal ? { fotoUrl: foto } : {}) });
      if (arquivos.length) await uploadClientDocuments(cadastro.id, arquivos, token, "Documento cadastral");
      await aoSalvar(); aoFechar();
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Não foi possível salvar o cadastro.";
      setErro(mensagem + (alteracoesSalvas ? " Algumas alterações já foram salvas. Revise os dados antes de tentar novamente." : ""));
    } finally { setSalvando(false); }
  }
  const ocupado = salvando || buscando;
  return <Dialog open fullWidth maxWidth="md" scroll="paper" onClose={() => { if (!ocupado) aoFechar(); }} slotProps={{ paper: { sx: { borderRadius: "20px" } } }}>
    <DialogTitle component="div" sx={{ px: 3, py: 2.5 }}><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Stack spacing={0.5}><Typography component="h2" sx={{ fontSize: 22, fontWeight: 700 }}>Editar cadastro</Typography><Typography sx={{ fontSize: 13, color: "#64748b" }}>Dados fiscais, cadastrais, contatos e documentos.</Typography></Stack><IconButton aria-label="Fechar edição" onClick={aoFechar} disabled={ocupado}><X size={20} /></IconButton></Stack></DialogTitle>
    <Divider />
    <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f8fafc" }}>
      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
      {carregando ? (!erro && <CircularProgress aria-label="Carregando cadastro para editar" />) : <ClientForm
        form={form} setForm={setForm} contacts={contatos} setContacts={setContatos}
        documentFiles={arquivos} setDocumentFiles={setArquivos} loading={salvando} searchingCnpj={buscando}
        onSearchCnpj={buscarCnpj} onCancel={aoFechar} onSubmit={salvar} submitLabel="Salvar alterações"
        camposIniciais={<Stack spacing={2}>
          <CamposComplementaresCadastro modalidade={modalidade} setModalidade={setModalidade} etapa={etapa} setEtapa={setEtapa} comerciais={comerciais} setComerciais={setComerciais} foto={foto} setFoto={setFoto} desabilitado={ocupado} />
          {!!cadastro.documents.length && <Alert severity="info">{cadastro.documents.length} documento(s) já anexado(s). Os arquivos existentes serão mantidos.</Alert>}
        </Stack>}
      />}
    </DialogContent>
  </Dialog>;
}
