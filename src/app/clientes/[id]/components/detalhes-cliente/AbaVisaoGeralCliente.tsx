"use client";

import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  Badge,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Tag,
  UserRound,

} from "lucide-react";

import { CrmSection, crmPalette } from "@/components/mui/crm-primitives";
import { formatLeadStatus } from "@/services/crm.service";

import {
  CabecalhoSecao,
  formatarData,
  statusStyles,
} from "./detalhes-cliente-compartilhado";
import type { PropriedadesAbaDetalhesCliente } from "./detalhes-cliente-compartilhado";

type DetailRow = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
};

function emptyToNotInformed(value?: string | null) {
  return value?.trim() || "Não informado";
}

function DetailList({
  icon,
  title,
  rows,
  headerBg = "#f8fafc",
  headerColor = crmPalette.text,
  iconBg = "#fff3ed",
  iconColor = crmPalette.orangeDark,
}: {
  icon: ReactNode;
  title: string;
  rows: DetailRow[];

  headerBg?: string;
  headerColor?: string;
  iconBg?: string;
  iconColor?: string;
}) {

  return (
    <Box
      sx={{
        minWidth: 0,
        border: `1px solid ${crmPalette.border}`,
        borderRadius: "12px",
        overflow: "hidden",
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          px: {
            xs: 1.75,
            md: 2,
          },

          py: 1.5,

          borderBottom: `1px solid ${crmPalette.border}`,

          bgcolor: headerBg,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", minWidth: 0 }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,

              display: "grid",
              placeItems: "center",

              flexShrink: 0,

              borderRadius: "10px",

              bgcolor: iconBg,
              color: iconColor,

              "& svg": {
                width: 18,
                height: 18,
                strokeWidth: 2.2,
              },
            }}
          >
            {icon}
          </Box>

          <Typography
            sx={{
              color: headerColor,
              fontSize: 13,
              fontWeight: 900,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
        </Stack>
      </Box>

      <Stack divider={<Divider flexItem />}>
        {rows.map((row) => (
          <Stack
            key={row.label}
            direction="row"
            spacing={1.5}
            sx={{
              px: { xs: 1.75, md: 2 },
              py: { xs: 1.35, md: 1.5 },
              alignItems: "flex-start",
              transition: "background-color 160ms ease",
              "&:hover": {
                bgcolor: "#fffaf7",
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "flex-start", minWidth: 0 }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  borderRadius: "9px",
                  bgcolor: "#fff3ed",
                  color: crmPalette.orangeDark,
                  "& svg": {
                    width: 17,
                    height: 17,
                    strokeWidth: 2.2,
                  },
                }}
              >
                {row.icon}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: crmPalette.muted,
                    fontSize: 11,
                    fontWeight: 900,
                    lineHeight: 1.25,
                  }}
                >
                  {row.label}
                </Typography>

                <Typography
                  component="div"
                  sx={{
                    mt: 0.35,
                    color: crmPalette.text,
                    fontSize: 13.5,
                    fontWeight: 850,
                    lineHeight: 1.45,
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.value || "Não informado"}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export function AbaVisaoGeralCliente(props: PropriedadesAbaDetalhesCliente) {
  const { currentLead } = props;
  const registrationDate = formatarData(
    currentLead.registrationDate ?? currentLead.createdAt,
  );

  return (
    <CrmSection
      sx={{
        p: {
          xs: 2,
          md: 2.5,
        },

        borderRadius: "14px",

        border: `1px solid ${crmPalette.border}`,

        bgcolor: "#ffffff",

        boxShadow:
          "0 8px 24px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack spacing={2.5}>
        {/* CABEÇALHO */}
        <CabecalhoSecao
          title="Resumo do cliente"
          description="Informações cadastrais, contato e situação atual do cliente."
        />

        {/* CONTEÚDO */}
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",

              lg: "repeat(2, minmax(0, 1fr))",
            },

            gap: 2,

            alignItems: "start",
          }}
        >
          {/* =====================================
          COLUNA ESQUERDA
      ====================================== */}
          <DetailList
            icon={<IdCard />}
            title="Identificação"

            headerBg="#fff7ed"
            headerColor="#c2410c"
            iconBg="#ffedd5"
            iconColor="#ea580c"
            rows={[
              {
                icon: <Building2 />,

                label: "Empresa",

                value: emptyToNotInformed(
                  currentLead.company,
                ),
              },

              {
                icon: <ClipboardList />,

                label: "CNPJ",

                value: emptyToNotInformed(
                  currentLead.document,
                ),
              },

              {
                icon: <Badge />,

                label: "Razão social",

                value: emptyToNotInformed(
                  currentLead.legalName,
                ),
              },

              {
                icon: <UserRound />,

                label: "Nome fantasia",

                value: emptyToNotInformed(
                  currentLead.tradeName,
                ),
              },

              {
                icon: <Tag />,

                label: "Segmento",

                value: emptyToNotInformed(
                  currentLead.segment,
                ),
              },
            ]}
          />

          {/* =====================================
          COLUNA DIREITA
      ====================================== */}
          <Stack spacing={2}>
            <DetailList
              icon={<Phone />}
              title="Contato e localização"
              headerBg="#eff6ff"
              headerColor="#1d4ed8"
              iconBg="#dbeafe"
              iconColor="#2563eb"
              rows={[
                {
                  icon: <Phone />,

                  label: "Telefone",

                  value: emptyToNotInformed(
                    currentLead.phone,
                  ),
                },

                {
                  icon: <Mail />,

                  label: "E-mail",

                  value: emptyToNotInformed(
                    currentLead.email,
                  ),
                },

                {
                  icon: <MapPin />,

                  label: "Cidade",

                  value: emptyToNotInformed(
                    currentLead.city,
                  ),
                },
              ]}
            />
            <DetailList
              icon={<CalendarDays />}
              title="Cadastro"
              headerBg="#ecfdf5"
              headerColor="#047857"
              iconBg="#d1fae5"
              iconColor="#059669"
              rows={[
                {
                  icon: <CalendarDays />,

                  label: "Data do cadastro",

                  value: registrationDate,
                },

                {
                  icon: <CheckCircle2 />,

                  label: "Status",

                  value: (
                    <Chip
                      label={formatLeadStatus(
                        currentLead.status,
                      )}
                      size="small"
                      variant="outlined"
                      sx={{
                        ...statusStyles[
                        currentLead.status
                        ],

                        width: "fit-content",

                        height: 26,

                        borderRadius: "8px",

                        fontSize: 11,

                        fontWeight: 900,
                      }}
                    />
                  ),
                },
              ]}
            />
          </Stack>
        </Box>
      </Stack>
    </CrmSection>
  );
}
