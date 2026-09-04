"use client";

import {
  Avatar,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AltRouteRounded,
  BusinessRounded,
  CheckCircleRounded,
  DescriptionRounded,
  EventAvailableRounded,
  EventBusyRounded,
  InfoOutlined,
  LocalShippingRounded,
  PersonRounded,
  PlaceRounded,
  ScheduleRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import {
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";

import {
  criarChaveEntrega,
  formatarData,
  formatarDestino,
  formatarTexto,
  obterStatusEntrega,
} from "@/lib/entrega-por-placa.utils";

import type {
  EntregaPorPlaca,
  StatusEntrega,
} from "@/types/entregas-por-placas";

type PropriedadesTabelaEntregasPlaca = {
  rows: EntregaPorPlaca[];
};

/**
 * Estilização padrão dos títulos das colunas.
 */
const headCellSx = {
  bgcolor: "#0f172a",
  color: "#cbd5e1",
  borderBottom: 0,
  py: 1.5,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

/**
 * Estilização padrão das células da tabela.
 */
const bodyCellSx = {
  py: 1.7,
  borderBottom: "1px solid #eef2f7",
  verticalAlign: "middle",
};

/**
 * Retorna a configuração visual do status.
 */
function getStatusConfig(status: StatusEntrega) {
  if (status === "Entregue") {
    return {
      icon: <CheckCircleRounded />,
      sx: {
        borderColor: "#a7f3d0",
        bgcolor: "#ecfdf5",
        color: "#047857",
      },
    };
  }

  if (status === "Em atraso") {
    return {
      icon: <WarningAmberRounded />,
      sx: {
        borderColor: "#fecaca",
        bgcolor: "#fef2f2",
        color: "#b91c1c",
      },
    };
  }

  return {
    icon: <ScheduleRounded />,
    sx: {
      borderColor: "#fde68a",
      bgcolor: "#fffbeb",
      color: "#b45309",
    },
  };
}

export function TabelaEntregasPlaca({
  rows,
}: PropriedadesTabelaEntregasPlaca) {
  return (
    <CrmSection>
      {/* Cabeçalho da seção */}
      <Box
        sx={{
          px: {
            xs: 2,
            md: 3,
          },
          py: {
            xs: 2,
            md: 2.5,
          },
          borderBottom: `1px solid ${crmPalette.border}`,
          bgcolor: "#ffffff",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
          sx={{
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            justifyContent: "space-between",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
            }}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 46,
                height: 46,
                borderRadius: "14px",
                bgcolor: "#fff7ed",
                color: crmPalette.orangeDark,
                border: "1px solid #fed7aa",
              }}
            >
              <LocalShippingRounded />
            </Avatar>

            <Box>
              <Typography
                sx={{
                  color: crmPalette.orangeDark,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                }}
              >
                Detalhamento
              </Typography>

              <Typography
                component="h2"
                sx={{
                  mt: 0.25,
                  color: crmPalette.text,
                  fontSize: {
                    xs: 19,
                    md: 23,
                  },
                  fontWeight: 900,
                  lineHeight: 1.2,
                }}
              >
                Entregas vinculadas à placa
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color: crmPalette.muted,
                  fontSize: 13,
                }}
              >
                Consulte os documentos, destinos, ocorrências e prazos.
              </Typography>
            </Box>
          </Stack>

          <Chip
            icon={<AltRouteRounded />}
            label={`${new Intl.NumberFormat("pt-BR").format(
              rows.length,
            )} registro(s)`}
            sx={{
              height: 36,
              px: 0.5,
              borderRadius: "10px",
              bgcolor: "#fff7ed",
              color: crmPalette.orangeDark,
              border: "1px solid #fed7aa",
              fontSize: 13,
              fontWeight: 800,

              "& .MuiChip-icon": {
                color: "inherit",
                fontSize: 19,
              },
            }}
          />
        </Stack>
      </Box>

      {/* Área da tabela */}
      <Box
        sx={{
          bgcolor: "#f8fafc",
          p: {
            xs: 1.25,
            md: 2,
          },
        }}
      >
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            maxHeight: 680,
            border: `1px solid ${crmPalette.border}`,
            borderRadius: "16px",
            overflow: "auto",
            bgcolor: "#ffffff",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",

            "&::-webkit-scrollbar": {
              height: 8,
              width: 8,
            },

            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#cbd5e1",
              borderRadius: 999,
            },

            "&::-webkit-scrollbar-thumb:hover": {
              bgcolor: "#94a3b8",
            },

            "&::-webkit-scrollbar-track": {
              bgcolor: "#f8fafc",
            },
          }}
        >
          <Table
            stickyHeader
            size="small"
            aria-label="Tabela de entregas vinculadas à placa"
            sx={{
              minWidth: 1380,
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headCellSx, minWidth: 160 }}>
                  CT-e
                </TableCell>

                <TableCell sx={{ ...headCellSx, minWidth: 200 }}>
                  Motorista
                </TableCell>

                <TableCell sx={{ ...headCellSx, minWidth: 270 }}>
                  Destinatário
                </TableCell>

                <TableCell sx={{ ...headCellSx, minWidth: 180 }}>
                  Origem
                </TableCell>

                <TableCell sx={{ ...headCellSx, minWidth: 180 }}>
                  Destino
                </TableCell>

                <TableCell sx={{ ...headCellSx, minWidth: 135 }}>
                  Previsão
                </TableCell>

                <TableCell sx={{ ...headCellSx, minWidth: 135 }}>
                  Entrega
                </TableCell>

                <TableCell sx={{ ...headCellSx, minWidth: 300 }}>
                  Ocorrência
                </TableCell>

                <TableCell sx={{ ...headCellSx, minWidth: 150 }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Mensagem apresentada quando não houver registros */}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    sx={{
                      py: 8,
                      borderBottom: 0,
                      textAlign: "center",
                    }}
                  >
                    <InfoOutlined
                      sx={{
                        mb: 1,
                        color: "#94a3b8",
                        fontSize: 42,
                      }}
                    />

                    <Typography
                      sx={{
                        color: crmPalette.text,
                        fontSize: 16,
                        fontWeight: 800,
                      }}
                    >
                      Nenhuma entrega encontrada
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.5,
                        color: crmPalette.muted,
                        fontSize: 13,
                      }}
                    >
                      Não existem entregas vinculadas à placa selecionada.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {rows.map((entrega, index) => {
                const status = obterStatusEntrega(entrega);
                const statusConfig = getStatusConfig(status);

                return (
                  <TableRow
                    hover
                    key={criarChaveEntrega(entrega, index)}
                    sx={{
                      bgcolor: index % 2 === 0 ? "#ffffff" : "#fbfdff",
                      transition: "background-color 0.2s ease",

                      "&:hover": {
                        bgcolor: "#fff8eb !important",
                        boxShadow: `inset 4px 0 0 ${crmPalette.orangeDark}`,
                      },
                    }}
                  >
                    {/* CT-e */}
                    <TableCell sx={bodyCellSx}>
                      <Stack
                        direction="row"
                        spacing={1.2}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            bgcolor: "#0f172a",
                            color: "#ffffff",
                          }}
                        >
                          <DescriptionRounded
                            sx={{
                              fontSize: 19,
                            }}
                          />
                        </Avatar>

                        <Box>
                          <Typography
                            sx={{
                              color: crmPalette.text,
                              fontSize: 13,
                              fontWeight: 900,
                              lineHeight: 1.2,
                            }}
                          >
                            {formatarTexto(entrega.nro_ctrc)}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              color: crmPalette.muted,
                              fontSize: 11.5,
                            }}
                          >
                            Série: {formatarTexto(entrega.ser_ctrc)}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Motorista */}
                    <TableCell sx={bodyCellSx}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <PersonRounded
                          sx={{
                            color: "#94a3b8",
                            fontSize: 18,
                          }}
                        />

                        <Typography
                          sx={{
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {formatarTexto(entrega.nome_motorista)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Destinatário */}
                    <TableCell sx={bodyCellSx}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <BusinessRounded
                          sx={{
                            flexShrink: 0,
                            color: crmPalette.orangeDark,
                            fontSize: 18,
                          }}
                        />

                        <Typography
                          sx={{
                            color: crmPalette.text,
                            fontSize: 13,
                            fontWeight: 800,
                          }}
                        >
                          {formatarTexto(entrega.nome_cli_dest)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Origem */}
                    <TableCell sx={bodyCellSx}>
                      <Stack
                        direction="row"
                        spacing={0.8}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <PlaceRounded
                          sx={{
                            color: "#94a3b8",
                            fontSize: 17,
                          }}
                        />

                        <Typography
                          sx={{
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {formatarTexto(entrega.cidade_origem)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Destino */}
                    <TableCell sx={bodyCellSx}>
                      <Stack
                        direction="row"
                        spacing={0.8}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <PlaceRounded
                          sx={{
                            color: crmPalette.orangeDark,
                            fontSize: 17,
                          }}
                        />

                        <Typography
                          sx={{
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {formatarDestino(entrega)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Previsão */}
                    <TableCell sx={bodyCellSx}>
                      <Stack
                        direction="row"
                        spacing={0.8}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <EventBusyRounded
                          sx={{
                            color: "#d97706",
                            fontSize: 17,
                          }}
                        />

                        <Typography
                          sx={{
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatarData(entrega.data_prev_ent)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Entrega */}
                    <TableCell sx={bodyCellSx}>
                      <Stack
                        direction="row"
                        spacing={0.8}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <EventAvailableRounded
                          sx={{
                            color: entrega.data_entrega
                              ? "#059669"
                              : "#94a3b8",
                            fontSize: 17,
                          }}
                        />

                        <Typography
                          sx={{
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatarData(entrega.data_entrega)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Ocorrência */}
                    <TableCell
                      sx={{
                        ...bodyCellSx,
                        maxWidth: 320,
                      }}
                    >
                      <Tooltip
                        arrow
                        placement="top"
                        title={
                          entrega.ocorrencia
                            ? entrega.ocorrencia
                            : "Nenhuma ocorrência informada"
                        }
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems: "center",
                            cursor: entrega.ocorrencia
                              ? "help"
                              : "default",
                          }}
                        >
                          <InfoOutlined
                            sx={{
                              flexShrink: 0,
                              color: "#94a3b8",
                              fontSize: 17,
                            }}
                          />

                          <Typography
                            sx={{
                              minWidth: 0,
                              overflow: "hidden",
                              color: "#475569",
                              fontSize: 13,
                              fontWeight: 700,
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatarTexto(entrega.ocorrencia)}
                          </Typography>
                        </Stack>
                      </Tooltip>
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={bodyCellSx}>
                      <Chip
                        size="small"
                        icon={statusConfig.icon}
                        label={status}
                        variant="outlined"
                        sx={{
                          ...statusConfig.sx,
                          height: 30,
                          borderRadius: "9px",
                          fontSize: 12,
                          fontWeight: 900,

                          "& .MuiChip-icon": {
                            color: "inherit",
                            fontSize: 17,
                          },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </CrmSection>
  );
}