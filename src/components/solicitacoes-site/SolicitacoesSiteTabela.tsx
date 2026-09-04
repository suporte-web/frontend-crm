'use client';

import Link from 'next/link';

import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import type { SolicitacaoSite } from '@/types/solicitacao-site';

interface SolicitacoesSiteTabelaProps {
  solicitacoes: SolicitacaoSite[];
}

function formatarTipo(tipo: string) {
  switch (tipo) {
    case 'COTACAO':
      return 'Cotação';

    case 'AGREGADO':
      return 'Agregado';

    case 'FALE_CONOSCO':
      return 'Fale conosco';

    default:
      return tipo;
  }
}

function formatarStatus(status: string) {
  switch (status) {
    case 'NOVO':
      return 'Novo';

    case 'EM_ATENDIMENTO':
      return 'Em atendimento';

    case 'CONCLUIDO':
      return 'Concluído';

    case 'CANCELADO':
      return 'Cancelado';

    default:
      return status;
  }
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data));
}

function obterCategoria(solicitacao: SolicitacaoSite) {
  if (solicitacao.tipo === 'COTACAO') {
    return solicitacao.solucao ?? '-';
  }

  if (solicitacao.tipo === 'AGREGADO') {
    return solicitacao.cidade ?? '-';
  }

  if (solicitacao.tipo === 'FALE_CONOSCO') {
    return solicitacao.departamento ?? '-';
  }

  return '-';
}

export function SolicitacoesSiteTabela({
  solicitacoes,
}: SolicitacoesSiteTabelaProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Data</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {solicitacoes.map((solicitacao) => (
            <TableRow
              key={solicitacao.id}
              hover
            >
              <TableCell>
                {formatarData(solicitacao.criadoEm)}
              </TableCell>

              <TableCell>
                <Typography
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {solicitacao.nome}
                </Typography>

                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 12,
                  }}
                >
                  {solicitacao.email}
                </Typography>
              </TableCell>

              <TableCell>
                {formatarTipo(solicitacao.tipo)}
              </TableCell>

              <TableCell>
                {obterCategoria(solicitacao)}
              </TableCell>

              <TableCell>
                <Chip
                  size="small"
                  label={formatarStatus(
                    solicitacao.status,
                  )}
                  color={
                    solicitacao.status === 'NOVO'
                      ? 'warning'
                      : solicitacao.status ===
                          'CONCLUIDO'
                        ? 'success'
                        : 'default'
                  }
                />
              </TableCell>

              <TableCell align="right">
                <Button
                  component={Link}
                  href={`/solicitacoes-site/${solicitacao.id}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: 'none',
                  }}
                >
                  Abrir
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {solicitacoes.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                align="center"
                sx={{
                  py: 6,
                  color: 'text.secondary',
                }}
              >
                Nenhuma solicitação encontrada.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
