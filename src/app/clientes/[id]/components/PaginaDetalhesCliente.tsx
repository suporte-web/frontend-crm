"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

import {
  CrmPageShell,
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";

import { ArrowLeft, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { TimelineSection } from "@/components/crm/timeline-section";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import { API_BASE_URL } from "@/services/api";
import {
  addClientContact as createClientContactRecord,
  createOpportunity,
  deleteOpportunity,
  deleteClientContact,
  deleteOpportunityProposalDocument,
  getCrmLeadById,
  updateClient,
  updateClientContactRecord,
  updateOpportunity,
  uploadClientDocuments,
  uploadOpportunityProposalDocuments,
} from "@/services/crm.service";
import type { LeadDetail, LeadStatus } from "@/types/crm";
import { AbaCadastroCliente } from "./detalhes-cliente/AbaCadastroCliente";
import { AbaCondicoesComerciaisCliente } from "./detalhes-cliente/AbaCondicoesComerciaisCliente";
import { AbaContatosCliente } from "./detalhes-cliente/AbaContatosCliente";
import { CabecalhoDetalhesCliente } from "./detalhes-cliente/CabecalhoDetalhesCliente";
import { AbasDetalhesCliente } from "./detalhes-cliente/AbasDetalhesCliente";
import { AbaDocumentosCliente } from "./detalhes-cliente/AbaDocumentosCliente";
import { AbaOportunidadePropostaCliente } from "./detalhes-cliente/AbaOportunidadePropostaCliente";
import { AbaVisaoGeralCliente } from "./detalhes-cliente/AbaVisaoGeralCliente";
import {
  OPPORTUNITY_PROPOSAL_DOCUMENT_CATEGORY,
  montarEnderecoCliente,
  clienteParaFormularioCondicoesComerciais,
  clienteParaFormularioCliente,
  contatoClienteVazio,
  formularioCondicoesComerciaisVazio,
  novoContatoClienteVazio,
  formularioPropostaOportunidadeVazio,
  contatosClienteParaFormulario,
  extrairCampoDasObservacoesContato,
  formatarListaDadosBancarios,
  formatarFormasPagamento,
  limparObservacoesContato,
  secondaryButtonSx,
  temDadosBancarios,
  textFieldSx,
  propostaParaFormulario,
  montarObservacoesProposta,
} from "./detalhes-cliente/detalhes-cliente-compartilhado";
import type {
  FormularioContatoCliente,
  PropriedadesAbaDetalhesCliente,
  FormularioCondicoesComerciais,
  FormularioNovoContatoCliente,
  FormularioPropostaOportunidade,
} from "./detalhes-cliente/detalhes-cliente-compartilhado";

export default function PaginaDetalhesCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const abaRecebida = searchParams.get("aba");
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [savingClient, setSavingClient] = useState(false);
  const [clientFormError, setFormularioClienteError] = useState("");
  const [clientForm, setFormularioCliente] = useState({
    email: "",
    companyName: "",
    phone: "",
    document: "",
    legalName: "",
    tradeName: "",
    cnae: "",
    stateRegistration: "",
    businessActivity: "",
    taxRegime: "",
    taxation: "",
    address: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    bankDetails: "",
    modality: "",
    registrationDate: "",
    segment: "",
    status: "PENDENTE" as LeadStatus,
    notes: "",
  });
  const [clientContacts, setClientContacts] = useState<FormularioContatoCliente[]>([
    contatoClienteVazio(),
  ]);
  const [isEditingCommercialTerms, setIsEditingCommercialTerms] =
    useState(false);
  const [savingCommercialTerms, setSavingCommercialTerms] = useState(false);
  const [commercialTermsFormError, setFormularioCondicoesComerciaisError] = useState("");
  const [commercialTermsForm, setFormularioCondicoesComerciais] =
    useState<FormularioCondicoesComerciais>(formularioCondicoesComerciaisVazio());
  const [opportunityProposalForm, setFormularioPropostaOportunidade] =
    useState<FormularioPropostaOportunidade>(formularioPropostaOportunidadeVazio());
  const [savingOpportunityProposal, setSavingOpportunityProposal] =
    useState(false);
  const [opportunityProposalError, setOpportunityProposalError] = useState("");
  const [editingOpportunityId, setEditingOpportunityId] = useState<string | null>(
    null,
  );

  const [editingOpportunityForm, setEditingOpportunityForm] =
    useState<FormularioPropostaOportunidade>(
      formularioPropostaOportunidadeVazio(),
    );

  const [savingEditingOpportunityId, setSavingEditingOpportunityId] =
    useState<string | null>(null);
  const [deletingOpportunityId, setDeletingOpportunityId] =
    useState<string | null>(null);
  const [newContactForm, setNewContactForm] = useState<FormularioNovoContatoCliente>(
    novoContatoClienteVazio(),
  );
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingContactForm, setEditingContactForm] =
    useState<FormularioContatoCliente>(contatoClienteVazio());
  const [savingEditingContactId, setSavingEditingContactId] = useState<
    string | null
  >(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null,
  );
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [proposalFiles, setProposalFiles] = useState<Record<string, File[]>>({});

  const [documentToDelete, setDocumentToDelete] = useState<
    LeadDetail["documents"][number] | null
  >(null);

  const [documentDeleteJustification, setDocumentDeleteJustification] =
    useState("");

  const [deletingDocument, setDeletingDocument] = useState(false);

  const [documentDeleteError, setDocumentDeleteError] = useState("");
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [uploadingProposalOpportunityId, setUploadingProposalOpportunityId] =
    useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const canEditCommercialData = user?.role
    ? ["ADMIN", "GESTAO", "COMERCIAL"].includes(user.role)
    : false;
  const canEditClient = canEditCommercialData;
  const cadastralDocuments = useMemo(
    () =>
      lead?.documents.filter(
        (document) =>
          document.category !== OPPORTUNITY_PROPOSAL_DOCUMENT_CATEGORY,
      ) ?? [],
    [lead?.documents],
  );
  const opportunityProposalDocuments = useMemo(
    () =>
      lead?.documents.filter(
        (document) =>
          document.category === OPPORTUNITY_PROPOSAL_DOCUMENT_CATEGORY,
      ) ?? [],
    [lead?.documents],
  );

  useEffect(() => {
    if (abaRecebida === "propostas") {
      setActiveTab(4);
    }
  }, [abaRecebida]);

  useEffect(() => {
    let active = true;

    async function loadLead() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const { id } = await params;
        setClientId(id);
        const nextLead = await getCrmLeadById(id, token);

        if (!active) {
          return;
        }

        if (!nextLead) {
          setError("Cliente não encontrado.");
          setLead(null);
          return;
        }

        setLead(nextLead);
        setFormularioCliente(clienteParaFormularioCliente(nextLead));
        setClientContacts(contatosClienteParaFormulario(nextLead));
        setFormularioCondicoesComerciais(clienteParaFormularioCondicoesComerciais(nextLead));
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Erro ao carregar o detalhe do cliente.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLead();

    return () => {
      active = false;
    };
  }, [params, token]);

  async function reloadClient() {
    if (!token || !clientId) {
      return;
    }

    const nextLead = await getCrmLeadById(clientId, token);
    setLead(nextLead);
    if (nextLead) {
      setFormularioCliente(clienteParaFormularioCliente(nextLead));
      setClientContacts(contatosClienteParaFormulario(nextLead));
      setFormularioCondicoesComerciais(clienteParaFormularioCondicoesComerciais(nextLead));
    }
  }

  async function handleUpdateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    if (!clientForm.companyName.trim()) {
      setFormularioClienteError("Informe o nome da empresa.");
      setToast({
        title: "Campo obrigatório",
        message: "Informe o nome da empresa.",
        variant: "error",
      });
      return;
    }

    const validContacts = clientContacts
      .map((contact) => ({
        name: contact.name.trim(),
        role: contact.role.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        notes: contact.notes.trim(),
      }))
      .filter(
        (contact) =>
          contact.name ||
          contact.role ||
          contact.email ||
          contact.phone ||
          contact.notes,
      )
      .map((contact, index) => ({
        name: contact.name || undefined,
        role: contact.role || undefined,
        cargo: contact.role || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        telefone: contact.phone || undefined,
        notes: contact.notes || undefined,
        isPrimary: index === 0,
      }));

    try {
      setSavingClient(true);
      setFormularioClienteError("");
      const fullAddress = montarEnderecoCliente(clientForm);

      await updateClient(
        lead.id,
        {
          name: clientForm.companyName.trim(),
          companyName: clientForm.companyName.trim(),
          phone: clientForm.phone.trim() || undefined,
          document: clientForm.document.trim() || undefined,
          legalName: clientForm.legalName.trim() || undefined,
          tradeName: clientForm.tradeName.trim() || undefined,
          cnae: clientForm.cnae.trim() || undefined,
          stateRegistration: clientForm.stateRegistration.trim() || undefined,
          businessActivity: clientForm.businessActivity.trim() || undefined,
          taxRegime: clientForm.taxRegime.trim() || undefined,
          address: fullAddress || clientForm.address.trim() || undefined,
          city: clientForm.city.trim() || undefined,
          bankDetails: clientForm.bankDetails.trim() || undefined,
          modality: clientForm.modality.trim() || undefined,
          registrationDate: clientForm.registrationDate || undefined,
          segment: clientForm.segment.trim() || undefined,
          status: clientForm.status,
          notes: clientForm.notes.trim() || undefined,
          contacts: validContacts,
        },
        token,
      );
      await reloadClient();
      setIsEditingClient(false);
      setToast({
        title: "Cliente atualizado",
        message: "Cadastro salvo com sucesso.",
        variant: "success",
      });
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Erro ao atualizar cliente.";
      setFormularioClienteError(message);
      setToast({
        title: "Falha ao atualizar cliente",
        message,
        variant: "error",
      });
    } finally {
      setSavingClient(false);
    }
  }

  async function handleCreateContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    const nomeContato = newContactForm.nomeContato.trim();

    if (!nomeContato) {
      setToast({
        title: "Nome obrigatório",
        message: "Informe o nome do contato.",
        variant: "error",
      });
      return;
    }

    try {
      setSavingContact(true);
      await createClientContactRecord(
        lead.id,
        {
          nomeContato,
          cargo: newContactForm.cargo.trim() || undefined,
          email: newContactForm.email.trim() || undefined,
          telefone: newContactForm.telefone.trim() || undefined,
          whatsapp: newContactForm.whatsapp.trim() || undefined,
          linkedin: newContactForm.linkedin.trim() || undefined,
        },
        token,
      );
      setNewContactForm(novoContatoClienteVazio());
      setShowNewContactForm(false);
      await reloadClient();
      setToast({
        title: "Contato adicionado",
        message: "Contato cadastrado no cliente com sucesso.",
        variant: "success",
      });
    } catch (contactError) {
      setToast({
        title: "Falha ao adicionar contato",
        message:
          contactError instanceof Error
            ? contactError.message
            : "Erro ao adicionar contato.",
        variant: "error",
      });
    } finally {
      setSavingContact(false);
    }
  }

  async function handleUpdateCommercialTerms(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    try {
      setSavingCommercialTerms(true);
      setFormularioCondicoesComerciaisError("");
      await updateClient(
        lead.id,
        {
          paymentMethod:
            formatarFormasPagamento(commercialTermsForm.paymentMethods) ||
            undefined,
          paymentTerm: commercialTermsForm.paymentTerm.trim() || undefined,
          contractValidity:
            commercialTermsForm.contractValidity.trim() || undefined,
          priceAdjustment:
            commercialTermsForm.priceAdjustment.trim() || undefined,
          invoiceContactName:
            commercialTermsForm.invoiceContactName.trim() || undefined,
          invoiceContactEmail:
            commercialTermsForm.invoiceContactEmail.trim() || undefined,
          invoiceContactPhone:
            commercialTermsForm.invoiceContactPhone.trim() || undefined,
          bankDetails:
            formatarListaDadosBancarios([
              ...commercialTermsForm.bankAccounts,
              ...(temDadosBancarios(commercialTermsForm)
                ? [commercialTermsForm]
                : []),
            ]) || undefined,
          commercialTermsNotes:
            commercialTermsForm.commercialTermsNotes.trim() || undefined,
        },
        token,
      );
      await reloadClient();
      setIsEditingCommercialTerms(false);
      setToast({
        title: "Condições comerciais atualizadas",
        message: "As informações foram salvas e registradas no histórico.",
        variant: "success",
      });
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Erro ao atualizar condições comerciais.";
      setFormularioCondicoesComerciaisError(message);
      setToast({
        title: "Falha ao salvar condições",
        message,
        variant: "error",
      });
    } finally {
      setSavingCommercialTerms(false);
    }
  }

  function startEditingContact(contact: LeadDetail["contacts"][number]) {
    setEditingContactId(contact.id);
    setEditingContactForm({
      id: contact.id,
      name: contact.name ?? contact.nomeContato ?? "",
      role: contact.role ?? contact.cargo ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? contact.telefone ?? "",
      whatsapp:
        contact.whatsapp ??
        extrairCampoDasObservacoesContato(contact.notes, "WhatsApp"),
      linkedin:
        contact.linkedin ??
        extrairCampoDasObservacoesContato(contact.notes, "LinkedIn"),
      notes: limparObservacoesContato(contact.notes),
    });
  }

  function updateEditingContactForm(
    field: keyof FormularioContatoCliente,
    value: string,
  ) {
    setEditingContactForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleUpdateContact(contactId: string) {
    if (!token || !lead) {
      return;
    }

    const nomeContato = editingContactForm.name.trim();

    if (!nomeContato) {
      setToast({
        title: "Nome obrigatório",
        message: "Informe o nome do contato.",
        variant: "error",
      });
      return;
    }

    try {
      setSavingEditingContactId(contactId);
      await updateClientContactRecord(
        lead.id,
        contactId,
        {
          nomeContato,
          cargo: editingContactForm.role.trim() || undefined,
          email: editingContactForm.email.trim() || undefined,
          telefone: editingContactForm.phone.trim() || undefined,
          whatsapp: editingContactForm.whatsapp.trim() || undefined,
          linkedin: editingContactForm.linkedin.trim() || undefined,
          notes: editingContactForm.notes.trim() || undefined,
        },
        token,
      );
      setEditingContactId(null);
      setEditingContactForm(contatoClienteVazio());
      await reloadClient();
      setToast({
        title: "Contato atualizado",
        message: "Contato salvo com sucesso.",
        variant: "success",
      });
    } catch (contactError) {
      setToast({
        title: "Falha ao atualizar contato",
        message:
          contactError instanceof Error
            ? contactError.message
            : "Erro ao atualizar contato.",
        variant: "error",
      });
    } finally {
      setSavingEditingContactId(null);
    }
  }

  async function handleDeleteContact(contactId: string) {
    if (!token || !lead) {
      return;
    }

    try {
      setDeletingContactId(contactId);
      await deleteClientContact(lead.id, contactId, token);
      if (editingContactId === contactId) {
        setEditingContactId(null);
        setEditingContactForm(contatoClienteVazio());
      }
      await reloadClient();
      setToast({
        title: "Contato removido",
        message: "Contato removido do cliente com sucesso.",
        variant: "success",
      });
    } catch (deleteError) {
      setToast({
        title: "Falha ao remover contato",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Erro ao remover contato.",
        variant: "error",
      });
    } finally {
      setDeletingContactId(null);
    }
  }

  async function handleUploadDocuments() {
    if (!token || !lead) {
      return;
    }

    if (documentFiles.length === 0) {
      setToast({
        title: "Nenhum documento selecionado",
        message: "Selecione um ou mais arquivos para anexar ao cliente.",
        variant: "error",
      });
      return;
    }

    try {
      setUploadingDocuments(true);
      await uploadClientDocuments(
        lead.id,
        documentFiles,
        token,
        "Documento cadastral",
      );
      setDocumentFiles([]);
      await reloadClient();
      setToast({
        title: "Documentos anexados",
        message:
          documentFiles.length === 1
            ? "Documento anexado ao cliente com sucesso."
            : `${documentFiles.length} documentos anexados ao cliente com sucesso.`,
        variant: "success",
      });
    } catch (uploadError) {
      setToast({
        title: "Falha ao anexar documentos",
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "Erro ao anexar documentos ao cliente.",
        variant: "error",
      });
    } finally {
      setUploadingDocuments(false);
    }
  }

  async function handleUploadProposalDocuments(opportunityId: string) {
    if (!token || !lead) {
      return;
    }

    const selectedProposalFiles = proposalFiles[opportunityId] ?? [];

    if (selectedProposalFiles.length === 0) {
      setToast({
        title: "Nenhum arquivo selecionado",
        message: "Selecione um ou mais arquivos para anexar nesta proposta.",
        variant: "error",
      });
      return;
    }

    try {
      setUploadingProposalOpportunityId(opportunityId);
      await uploadOpportunityProposalDocuments(
        lead.id,
        selectedProposalFiles,
        token,
        `Oportunidade/Proposta | oportunidade:${opportunityId}`,
      );
      setProposalFiles((current) => {
        const nextFiles = { ...current };
        delete nextFiles[opportunityId];
        return nextFiles;
      });
      await reloadClient();
      setToast({
        title: "Propostas anexadas",
        message:
          selectedProposalFiles.length === 1
            ? "Arquivo anexado nesta proposta com sucesso."
            : `${selectedProposalFiles.length} arquivos anexados nesta proposta com sucesso.`,
        variant: "success",
      });
    } catch (uploadError) {
      setToast({
        title: "Falha ao anexar proposta",
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "Erro ao anexar arquivo nesta proposta.",
        variant: "error",
      });
    } finally {
      setUploadingProposalOpportunityId(null);
    }
  }

  function toggleProposalOption(option: string) {
    setFormularioPropostaOportunidade((current) => {
      const field =
        current.proposalType === "ARMAZENAGEM"
          ? "storageOptions"
          : "transportOptions";
      const currentOptions = current[field];
      const nextOptions = currentOptions.includes(option)
        ? currentOptions.filter((item) => item !== option)
        : [...currentOptions, option];

      return {
        ...current,
        [field]: nextOptions,
      };
    });
  }

  function addCustomProposalOption() {
    const option = opportunityProposalForm.customOption.trim();

    if (!option || !opportunityProposalForm.proposalType) {
      return;
    }

    setFormularioPropostaOportunidade((current) => {
      const field =
        current.proposalType === "ARMAZENAGEM"
          ? "storageOptions"
          : "transportOptions";

      if (current[field].includes(option)) {
        return {
          ...current,
          customOption: "",
        };
      }

      return {
        ...current,
        [field]: [...current[field], option],
        customOption: "",
      };
    });
  }

  async function handleCreateOpportunityProposal(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    const title = opportunityProposalForm.title.trim();
    const selectedOptions =
      opportunityProposalForm.proposalType === "ARMAZENAGEM"
        ? opportunityProposalForm.storageOptions
        : opportunityProposalForm.transportOptions;

    if (!title) {
      setOpportunityProposalError("Informe o título da proposta.");
      return;
    }

    if (!opportunityProposalForm.proposalType) {
      setOpportunityProposalError("Selecione o tipo de proposta.");
      return;
    }

    if (selectedOptions.length === 0) {
      setOpportunityProposalError("Selecione ao menos uma opção da proposta.");
      return;
    }

    if (opportunityProposalForm.proposalType === "TRANSPORTE_RODOVIARIO") {
      if (
        !opportunityProposalForm.origin.trim() ||
        !opportunityProposalForm.destination.trim() ||
        !opportunityProposalForm.vehicleType ||
        !opportunityProposalForm.cargoType.trim() ||
        !opportunityProposalForm.averageWeight.trim() ||
        !opportunityProposalForm.aggregateValue.trim() ||
        !opportunityProposalForm.dangerousGoods
      ) {
        setOpportunityProposalError(
          "Preencha origem, destino, veículo, tipo de carga, peso médio, valor agregado e produto perigoso.",
        );
        return;
      }

      if (
        opportunityProposalForm.dangerousGoods === "SIM" &&
        !opportunityProposalForm.dangerousGoodsInfo.trim()
      ) {
        setOpportunityProposalError(
          "Informe os dados de FDS/Ficha de Emergência para produto perigoso.",
        );
        return;
      }
    }

    const proposalTypeLabel =
      opportunityProposalForm.proposalType === "ARMAZENAGEM"
        ? "Armazenagem"
        : "Transporte rodoviário";
    const transportValueNotes = Object.entries(
      opportunityProposalForm.transportValues,
    )
      .filter(([, value]) => value.trim())
      .map(([item, value]) => `${item}: ${value.trim()}`);
    const transportDetails =
      opportunityProposalForm.proposalType === "TRANSPORTE_RODOVIARIO"
        ? [
          `Origem: ${opportunityProposalForm.origin.trim()}`,
          `Destino: ${opportunityProposalForm.destination.trim()}`,
          `Tipo de veículo: ${opportunityProposalForm.vehicleType}`,
          `Tipo de carga: ${opportunityProposalForm.cargoType.trim()}`,
          `Peso médio: ${opportunityProposalForm.averageWeight.trim()}`,
          `Valor agregado: ${opportunityProposalForm.aggregateValue.trim()}`,
          opportunityProposalForm.cubage.trim()
            ? `Cubagem: ${opportunityProposalForm.cubage.trim()}`
            : null,
          opportunityProposalForm.monthlyShipments.trim()
            ? `Quantidade de embarques/mês: ${opportunityProposalForm.monthlyShipments.trim()}`
            : null,
          `Produto perigoso: ${opportunityProposalForm.dangerousGoods === "SIM" ? "Sim" : "Não"
          }`,
          opportunityProposalForm.dangerousGoods === "SIM"
            ? `FDS/Ficha de Emergência: ${opportunityProposalForm.dangerousGoodsInfo.trim()}`
            : null,
          transportValueNotes.length > 0
            ? `Valores: ${transportValueNotes.join(" | ")}`
            : null,
        ]
        : [];

    try {
      setSavingOpportunityProposal(true);
      setOpportunityProposalError("");
      await createOpportunity(
        {
          clientId: lead.id,
          title,
          stage: "PROPOSTA",
          preContract: true,
          preContractNotes: [
            `Tipo de proposta: ${proposalTypeLabel}`,
            `Opções: ${selectedOptions.join(", ")}`,
            ...transportDetails,
          ]
            .filter(Boolean)
            .join("\n"),
        },
        token,
      );
      setFormularioPropostaOportunidade(formularioPropostaOportunidadeVazio());
      await reloadClient();
      setToast({
        title: "Proposta cadastrada",
        message: "A proposta foi registrada na oportunidade e no histórico.",
        variant: "success",
      });
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Erro ao cadastrar proposta.";
      setOpportunityProposalError(message);
      setToast({
        title: "Falha ao cadastrar proposta",
        message,
        variant: "error",
      });
    } finally {
      setSavingOpportunityProposal(false);
    }
  }

  function startEditingOpportunity(
    opportunity: LeadDetail["opportunities"][number],
  ) {
    setEditingOpportunityId(opportunity.id);
    setEditingOpportunityForm(propostaParaFormulario(opportunity));
  }

  function updateEditingOpportunityForm<
    K extends keyof FormularioPropostaOportunidade,
  >(
    field: K,
    value: FormularioPropostaOportunidade[K],
  ) {
    setEditingOpportunityForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleUpdateOpportunity(
    opportunityId: string,
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    const title = editingOpportunityForm.title.trim();

    const selectedOptions =
      editingOpportunityForm.proposalType === "ARMAZENAGEM"
        ? editingOpportunityForm.storageOptions
        : editingOpportunityForm.transportOptions;

    if (!title) {
      setToast({
        title: "Campo obrigatório",
        message: "Informe o título da proposta.",
        variant: "error",
      });

      return;
    }

    if (!editingOpportunityForm.proposalType) {
      setToast({
        title: "Tipo obrigatório",
        message: "Selecione o tipo da proposta.",
        variant: "error",
      });

      return;
    }

    if (selectedOptions.length === 0) {
      setToast({
        title: "Serviço obrigatório",
        message: "Selecione pelo menos um serviço da proposta.",
        variant: "error",
      });

      return;
    }

    if (
      editingOpportunityForm.proposalType ===
      "TRANSPORTE_RODOVIARIO"
    ) {
      if (
        !editingOpportunityForm.origin.trim() ||
        !editingOpportunityForm.destination.trim() ||
        !editingOpportunityForm.vehicleType ||
        !editingOpportunityForm.cargoType.trim() ||
        !editingOpportunityForm.averageWeight.trim() ||
        !editingOpportunityForm.aggregateValue.trim() ||
        !editingOpportunityForm.dangerousGoods
      ) {
        setToast({
          title: "Campos obrigatórios",
          message:
            "Preencha origem, destino, veículo, tipo de carga, peso médio, valor agregado e produto perigoso.",
          variant: "error",
        });

        return;
      }

      if (
        editingOpportunityForm.dangerousGoods === "SIM" &&
        !editingOpportunityForm.dangerousGoodsInfo.trim()
      ) {
        setToast({
          title: "Informação obrigatória",
          message:
            "Informe os dados da FDS/Ficha de Emergência.",
          variant: "error",
        });

        return;
      }
    }

    try {
      setSavingEditingOpportunityId(opportunityId);

      await updateOpportunity(
        opportunityId,
        {
          title,
          preContractNotes: montarObservacoesProposta(
            editingOpportunityForm,
          ),
        },
        token,
      );

      setEditingOpportunityId(null);

      setEditingOpportunityForm(
        formularioPropostaOportunidadeVazio(),
      );

      await reloadClient();

      setToast({
        title: "Proposta atualizada",
        message: "Os dados da proposta foram salvos.",
        variant: "success",
      });
    } catch (updateError) {
      setToast({
        title: "Falha ao atualizar proposta",
        message:
          updateError instanceof Error
            ? updateError.message
            : "Erro ao atualizar proposta.",
        variant: "error",
      });
    } finally {
      setSavingEditingOpportunityId(null);
    }
  }

  async function handleDeleteOpportunity(opportunityId: string) {
    if (!token || !lead) {
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta proposta?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingOpportunityId(opportunityId);

      await deleteOpportunity(opportunityId, token);

      if (editingOpportunityId === opportunityId) {
        setEditingOpportunityId(null);

        setEditingOpportunityForm(
          formularioPropostaOportunidadeVazio(),
        );
      }
      await reloadClient();
      setToast({
        title: "Proposta excluída",
        message: "A oportunidade foi removida do cliente.",
        variant: "success",
      });
    } catch (deleteError) {
      setToast({
        title: "Falha ao excluir proposta",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Erro ao excluir proposta.",
        variant: "error",
      });
    } finally {
      setDeletingOpportunityId(null);
    }
  }

  async function handleOpenDocument(
    clientDocument: LeadDetail["documents"][number],
  ) {
    if (!token || !lead) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/clients/${lead.id}/documents/${clientDocument.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || data?.error || "Erro ao abrir documento.",
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = url;
      link.download = clientDocument.originalName || clientDocument.fileName;
      link.rel = "noreferrer";

      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (openError) {
      setToast({
        title: "Falha ao abrir documento",
        message:
          openError instanceof Error
            ? openError.message
            : "Erro ao abrir documento.",
        variant: "error",
      });
    }
  }

  function openDeleteDocumentDialog(
    clientDocument: LeadDetail["documents"][number],
  ) {
    setDocumentToDelete(clientDocument);
    setDocumentDeleteJustification("");
    setDocumentDeleteError("");
  }

  function closeDeleteDocumentDialog() {
    if (deletingDocument) {
      return;
    }

    setDocumentToDelete(null);
    setDocumentDeleteJustification("");
    setDocumentDeleteError("");
  }

  async function handleDeleteDocument() {
    if (!token || !lead || !documentToDelete) {
      return;
    }

    const justification = documentDeleteJustification.trim();

    if (!justification) {
      setDocumentDeleteError(
        "Informe a justificativa para excluir o documento.",
      );
      return;
    }

    try {
      setDeletingDocument(true);
      setDocumentDeleteError("");

      const data =
        documentToDelete.category === OPPORTUNITY_PROPOSAL_DOCUMENT_CATEGORY
          ? await deleteOpportunityProposalDocument(
            lead.id,
            documentToDelete.id,
            token,
            justification,
          )
          : await fetch(
            `${API_BASE_URL}/clients/${lead.id}/documents/${documentToDelete.id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                justification,
              }),
            },
          ).then(async (response) => {
            const responseData = await response.json().catch(() => null);

            if (!response.ok) {
              throw new Error(
                responseData?.message ||
                responseData?.error ||
                "Não foi possível excluir o documento.",
              );
            }

            return responseData as { message?: string };
          });

      await reloadClient();

      setDocumentToDelete(null);
      setDocumentDeleteJustification("");
      setDocumentDeleteError("");

      setToast({
        title: "Documento excluído",
        message: data?.message || "Documento excluído com sucesso.",
        variant: "success",
      });
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Erro ao excluir documento.";

      setDocumentDeleteError(message);

      setToast({
        title: "Falha ao excluir documento",
        message,
        variant: "error",
      });
    } finally {
      setDeletingDocument(false);
    }
  }

  // function startEditingClient(nextLead: LeadDetail) {
  //   setActiveTab(1);
  //   setIsEditingClient(true);
  //   setFormularioCliente(clienteParaFormularioCliente(nextLead));
  //   setClientContacts(contatosClienteParaFormulario(nextLead));
  //   setFormularioClienteError("");
  // }

  function startEditingCommercialTerms(nextLead: LeadDetail) {
    setActiveTab(3);
    setIsEditingCommercialTerms(true);
    setFormularioCondicoesComerciais(clienteParaFormularioCondicoesComerciais(nextLead));
    setFormularioCondicoesComerciaisError("");
  }

  function renderActiveTab(currentLead: LeadDetail) {
    const tabProps: PropriedadesAbaDetalhesCliente = {
      currentLead,
      canEditClient,
      canEditCommercialData,
      clientForm,
      setFormularioCliente,
      clientFormError,
      setFormularioClienteError,
      isEditingClient,
      setIsEditingClient,
      savingClient,
      handleUpdateClient,
      setClientContacts,
      commercialTermsForm,
      setFormularioCondicoesComerciais,
      commercialTermsFormError,
      setFormularioCondicoesComerciaisError,
      isEditingCommercialTerms,
      setIsEditingCommercialTerms,
      savingCommercialTerms,
      handleUpdateCommercialTerms,
      startEditingCommercialTerms,
      newContactForm,
      setNewContactForm,
      showNewContactForm,
      setShowNewContactForm,
      savingContact,
      handleCreateContact,
      editingContactId,
      setEditingContactId,
      editingContactForm,
      setEditingContactForm,
      savingEditingContactId,
      deletingContactId,
      startEditingContact,
      updateEditingContactForm,
      handleUpdateContact,
      handleDeleteContact,
      documentFiles,
      setDocumentFiles,
      uploadingDocuments,
      handleUploadDocuments,
      handleOpenDocument,
      openDeleteDocumentDialog,
      cadastralDocuments,
      proposalFiles,
      setProposalFiles,
      uploadingProposalOpportunityId,
      handleUploadProposalDocuments,
      opportunityProposalDocuments,
      opportunityProposalForm,
      setFormularioPropostaOportunidade,
      opportunityProposalError,
      savingOpportunityProposal,
      editingOpportunityId,
      editingOpportunityForm,
      setEditingOpportunityForm,
      savingEditingOpportunityId,
      deletingOpportunityId,
      handleCreateOpportunityProposal,
      startEditingOpportunity,
      setEditingOpportunityId,
      updateEditingOpportunityForm,
      handleUpdateOpportunity,
      handleDeleteOpportunity,
      toggleProposalOption,
      addCustomProposalOption,
    };

    if (activeTab === 0) {
      return <AbaVisaoGeralCliente {...tabProps} />;
    }

    if (activeTab === 1) {
      return <AbaCadastroCliente {...tabProps} />;
    }

    if (activeTab === 3) {
      return <AbaCondicoesComerciaisCliente {...tabProps} />;
    }

    if (activeTab === 2) {
      return <AbaContatosCliente {...tabProps} />;
    }

    if (activeTab === 4) {
      return <AbaOportunidadePropostaCliente {...tabProps} />;
    }

    if (activeTab === 5) {
      return <AbaDocumentosCliente {...tabProps} />;
    }

    return <TimelineSection events={currentLead.timeline} darkMode={false} />;
  }

  return (
    <AppLayout>
      <CrmPageShell>
        <CabecalhoDetalhesCliente lead={lead} loading={loading} error={error} />
        <AbasDetalhesCliente lead={lead} activeTab={activeTab} setActiveTab={setActiveTab} />

        {lead ? (
          renderActiveTab(lead)
        ) : loading || error ? null : (
          <CrmSection sx={{ p: 5, textAlign: "center" }}>
            <Typography sx={{ color: crmPalette.muted, fontSize: 14 }}>
              Não foi possível carregar os dados deste cliente.
            </Typography>

            <Button
              component={Link}
              href={`/clientes/${clientId}?aba=propostas`}
              variant="outlined"
              startIcon={<ArrowLeft size={16} />}
              sx={{
                ...secondaryButtonSx,
                width: "fit-content",
                minHeight: 34,
                px: 1.6,
                borderRadius: "999px",
                fontSize: 12,
              }}
            >
              Voltar para propostas
            </Button>
          </CrmSection>
        )}
      </CrmPageShell>

      <Dialog
        open={!!documentToDelete}
        onClose={closeDeleteDocumentDialog}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "14px",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: crmPalette.text,
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          Excluir documento
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              mb: 2,
              color: crmPalette.muted,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Você está excluindo o documento{" "}
            <strong>
              {documentToDelete?.originalName || documentToDelete?.fileName}
            </strong>
            . Essa ação removerá o arquivo armazenado no servidor.
          </Typography>

          {documentDeleteError ? (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: "10px",
              }}
            >
              {documentDeleteError}
            </Alert>
          ) : null}

          <TextField
            autoFocus
            fullWidth
            required
            multiline
            minRows={3}
            label="Justificativa da exclusão"
            placeholder="Exemplo: documento anexado incorretamente."
            value={documentDeleteJustification}
            onChange={(event) => {
              setDocumentDeleteJustification(event.target.value);

              if (documentDeleteError) {
                setDocumentDeleteError("");
              }
            }}
            slotProps={{
              htmlInput: {
                maxLength: 500,
              },
            }}
            helperText={`${documentDeleteJustification.length}/500 caracteres`}
            disabled={deletingDocument}
            sx={textFieldSx}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: 1,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            onClick={closeDeleteDocumentDialog}
            disabled={deletingDocument}
            sx={secondaryButtonSx}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="contained"
            startIcon={
              deletingDocument ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Trash2 size={16} />
              )
            }
            disabled={deletingDocument || !documentDeleteJustification.trim()}
            onClick={handleDeleteDocument}
            sx={{
              minHeight: 40,
              px: 2,
              borderRadius: "10px",
              bgcolor: "#dc2626",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 900,
              textTransform: "none",
              boxShadow: "none",

              "&:hover": {
                bgcolor: "#b91c1c",
                boxShadow: "none",
              },

              "&.Mui-disabled": {
                bgcolor: "#fecaca",
                color: "#ffffff",
              },
            }}
          >
            {deletingDocument ? "Excluindo..." : "Confirmar exclusão"}
          </Button>
        </DialogActions>
      </Dialog>

      <FeedbackToast
        open={!!toast}
        title={toast?.title ?? ""}
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "success"}
        onClose={() => setToast(null)}
      />
    </AppLayout>
  );
}
