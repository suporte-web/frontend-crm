import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@/context/auth-context";
import { hasAnyRole } from "@/lib/user-roles";
import { LEAD_FUNNEL_STAGES } from "@/constants/lead-funnel";
import { SegmentosService, type Segmento } from "@/stores/segmentos/service";
import { ImportacoesCadastrosService, type ImportacaoCadastro, type ResponsavelImportacao } from "@/stores/importacoes-cadastros/service";

type Escolha = {
  selecionada: boolean;
  etapa: string;
  segmentoId: string | null;
  segmentoAutomatico: boolean;
};
const etapas = LEAD_FUNNEL_STAGES.filter(
  (item) => !["venda_efetivada", "pos_venda"].includes(item.value),
);
const mensagem = (erro: unknown) =>
  erro instanceof Error
    ? erro.message
    : "Não foi possível concluir a importação.";

export function ImportarCadastrosDialog({
  aoFechar,
  aoImportar,
}: {
  aoFechar: () => void;
  aoImportar: () => Promise<void>;
}) {
  const { user } = useAuth();
  const consultora = hasAnyRole(user, ["CONSULTORA"]);
  const [opcoes, setOpcoes] = useState<ResponsavelImportacao[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [empresa, setEmpresa] = useState(
    consultora ? user?.empresaConsultoraId || "" : "",
  );
  const [responsavel, setResponsavel] = useState(
    consultora ? user?.id || "" : "",
  );
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [job, setJob] = useState<ImportacaoCadastro | null>(null);
  const [escolhas, setEscolhas] = useState<Record<number, Escolha>>({});
  const [historico, setHistorico] = useState<
    Array<
      Pick<
        ImportacaoCadastro,
        "id" | "arquivo" | "status" | "createdAt" | "resultado"
      >
    >
  >([]);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [confirmacao, setConfirmacao] = useState(false);
  const [pagina, setPagina] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      ImportacoesCadastrosService.listarOpcoesImportacao(controller.signal),
      SegmentosService.listarSegmentos(controller.signal),
      ImportacoesCadastrosService.listarImportacoesCadastros(),
    ])
      .then(([pessoas, catalogo, anteriores]) => {
        if (!controller.signal.aborted) {
          setOpcoes(pessoas);
          setSegmentos(catalogo);
          setHistorico(anteriores);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setErro(mensagem(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });
    return () => controller.abort();
  }, []);
  const empresas = [
    ...new Map(
      opcoes
        .filter((item) => item.empresaConsultora)
        .map((item) => [item.empresaConsultora!.id, item.empresaConsultora!]),
    ).values(),
  ];
  const responsaveis = opcoes.filter(
    (item) => (item.empresaConsultoraId || "") === empresa,
  );
  const linhas = job?.linhas?.linhas || [];
  const selecionadas = linhas.filter(
    (item) => escolhas[item.numero]?.selecionada,
  );
  const incompletas = selecionadas.some(
    (item) => !escolhas[item.numero]?.etapa,
  );
  function alterar(numero: number, dados: Partial<Escolha>) {
    setEscolhas((atual) => ({
      ...atual,
      [numero]: { ...atual[numero], ...dados },
    }));
    setConfirmacao(false);
  }
  function carregarJob(dados: ImportacaoCadastro) {
    setJob(dados);
    setPagina(0);
    setConfirmacao(false);
    let disponiveis = 0;
    setEscolhas(
      Object.fromEntries(
        (dados.linhas?.linhas || []).map((item) => [
          item.numero,
          {
            selecionada: item.selecionavel && disponiveis++ < 200,
            etapa: item.etapaSugerida || "",
            segmentoId: item.segmentoId,
            segmentoAutomatico: item.segmentoPorCnae === true,
          },
        ]),
      ),
    );
  }
  async function executar(acao: () => Promise<ImportacaoCadastro>) {
    setOcupado(true);
    setErro("");
    try {
      const dados = await acao();
      carregarJob(dados);
      if (dados.status === "CONCLUIDA") await aoImportar();
    } catch (error) {
      setErro(mensagem(error));
    } finally {
      setOcupado(false);
    }
  }
  function confirmar() {
    if (
      !job ||
      incompletas ||
      !selecionadas.length ||
      selecionadas.length > 200
    )
      return;
    void executar(() =>
      ImportacoesCadastrosService.confirmarImportacaoCadastro(
        job.id,
        selecionadas.map((item) => ({
          numero: item.numero,
          etapa: escolhas[item.numero].etapa,
          segmentoId: escolhas[item.numero].segmentoId,
          segmentoAutomatico: escolhas[item.numero].segmentoAutomatico,
        })),
      ),
    );
  }
  return (
    <Dialog
      open
      fullWidth
      maxWidth="xl"
      onClose={() => {
        if (!ocupado) aoFechar();
      }}
    >
      <DialogTitle>Importar planilha de cadastros</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1, minWidth: 0 }}>
          <Alert severity="info">
            Novos registros serão Leads. Cadastros existentes não serão
            alterados. Os textos originais serão preservados. A prévia vale por
            uma hora.
          </Alert>
          {erro && (
            <Alert severity="error" onClose={() => setErro("")}>
              {erro}
            </Alert>
          )}
          {job && (
            <Typography variant="body2">
              Destino:{" "}
              {opcoes.find((item) => item.id === job.responsavelId)
                ?.empresaConsultora?.nome ||
                (job.empresaConsultoraId
                  ? job.empresaConsultoraId
                  : "Carteira interna")}{" "}
              · Responsável:{" "}
              {opcoes.find((item) => item.id === job.responsavelId)?.name ||
                job.responsavelId}
            </Typography>
          )}
          {job && job.linhas.prioridadesNaoAssociadas.length > 0 && (
            <Box component="details">
              <Box component="summary" sx={{ cursor: "pointer" }}>
                Conferir prioridades sem associação automática
              </Box>
              {job.linhas.prioridadesNaoAssociadas.map((item, i) => (
                <Typography key={i} variant="body2" sx={{ my: 1 }}>
                  {Object.entries(item)
                    .filter(([, valor]) => valor)
                    .map(([chave, valor]) => `${chave}: ${valor}`)
                    .join(" · ")}
                </Typography>
              ))}
            </Box>
          )}
          {carregando ? (
            <CircularProgress size={24} />
          ) : !job ? (
            <>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Empresa consultora"
                  value={empresa}
                  disabled={ocupado || consultora}
                  onChange={(e) => {
                    setEmpresa(e.target.value);
                    setResponsavel("");
                  }}
                >
                  {!consultora && (
                    <MenuItem value="">Carteira interna</MenuItem>
                  )}
                  {empresas.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.nome}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Responsável pelos novos cadastros"
                  value={responsavel}
                  disabled={ocupado}
                  onChange={(e) => setResponsavel(e.target.value)}
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {responsaveis.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Button
                variant="outlined"
                component="label"
                disabled={ocupado}
                sx={{ alignSelf: "flex-start" }}
              >
                Selecionar planilha XLSX
                <input
                  hidden
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setErro("");
                    if (
                      file &&
                      (file.size > 5 * 1024 * 1024 ||
                        !/\.xlsx$/i.test(file.name))
                    ) {
                      setArquivo(null);
                      setErro("Selecione um XLSX de até 5 MB.");
                    } else setArquivo(file || null);
                  }}
                />
              </Button>
              <Typography variant="body2">
                {arquivo?.name ||
                  "A aba principal deve conter CLIENTE e EMAIL ou TELEFONE na primeira linha."}
              </Typography>
              <Button
                variant="contained"
                disabled={!arquivo || !responsavel || ocupado}
                onClick={() => {
                  if (arquivo)
                    void executar(() =>
                      ImportacoesCadastrosService.prepararImportacaoCadastro(
                        arquivo,
                        responsavel,
                        empresa || null,
                      ),
                    );
                }}
                sx={{ alignSelf: "flex-start" }}
              >
                {ocupado ? "Preparando…" : "Gerar prévia"}
              </Button>
              {historico.length > 0 && (
                <Box>
                  <Typography component="h2" variant="subtitle1">
                    Minhas últimas importações
                  </Typography>
                  {historico.map((item) => (
                    <Button
                      key={item.id}
                      disabled={ocupado}
                      onClick={() =>
                        void executar(() => ImportacoesCadastrosService.obterImportacaoCadastro(item.id))
                      }
                    >
                      {item.arquivo} · {item.status} ·{" "}
                      {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                    </Button>
                  ))}
                </Box>
              )}
            </>
          ) : job.status === "CONCLUIDA" ? (
            <>
              <Alert severity="success">
                Importação concluída: {job.resultado?.criados.length || 0} novos
                Leads e {job.resultado?.ignorados.length || 0} linhas ignoradas.
              </Alert>
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Linha</TableCell>
                      <TableCell>Cadastro</TableCell>
                      <TableCell>Resultado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {job.resultado?.criados.map((item) => (
                      <TableRow key={item.numero}>
                        <TableCell>{item.numero}</TableCell>
                        <TableCell>
                          <Link to={`/cadastros/${item.id}`}>{item.nome}</Link>
                        </TableCell>
                        <TableCell>Criado</TableCell>
                      </TableRow>
                    ))}
                    {job.resultado?.ignorados.map((item) => (
                      <TableRow key={item.numero}>
                        <TableCell>{item.numero}</TableCell>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{item.motivo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <>
              <Typography>
                {job.arquivo} · Aba {job.aba} · {linhas.length} empresas ·{" "}
                {selecionadas.length} selecionadas
              </Typography>
              <Alert severity="warning">
                Revise etapas e segmentos. Linhas inválidas ou com possíveis
                duplicidades ficam bloqueadas. Para corrigir os dados de origem,
                ajuste o arquivo e gere outra prévia.
              </Alert>
              {job.linhas.prioridadesNaoAssociadas.length > 0 && (
                <Alert severity="warning">
                  Prioridades sem correspondência exata:{" "}
                  {job.linhas.prioridadesNaoAssociadas
                    .map((item) => item.empresa)
                    .join(", ")}
                  . Os dados estão preservados no relatório.
                </Alert>
              )}
              <Stack direction="row" spacing={1}>
                <Button
                  disabled={ocupado}
                  onClick={() => {
                    setEscolhas((atual) => {
                      let n = 0;
                      return Object.fromEntries(
                        linhas.map((item) => [
                          item.numero,
                          {
                            ...atual[item.numero],
                            selecionada: item.selecionavel && n++ < 200,
                          },
                        ]),
                      );
                    });
                    setConfirmacao(false);
                  }}
                >
                  Selecionar disponíveis
                </Button>
                <Button
                  disabled={ocupado}
                  onClick={() => {
                    setEscolhas((atual) =>
                      Object.fromEntries(
                        linhas.map((item) => [
                          item.numero,
                          { ...atual[item.numero], selecionada: false },
                        ]),
                      ),
                    );
                    setConfirmacao(false);
                  }}
                >
                  Desmarcar todas
                </Button>
              </Stack>
              <TableContainer sx={{ overflowX: "auto", maxHeight: 470 }}>
                <Table stickyHeader size="small" sx={{ minWidth: 1100 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell>Linha / empresa</TableCell>
                      <TableCell>Contato</TableCell>
                      <TableCell>Funil / etapa no CRM</TableCell>
                      <TableCell>Segmento</TableCell>
                      <TableCell>Conferência</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {linhas.slice(pagina * 20, pagina * 20 + 20).map((item) => (
                      <TableRow key={item.numero}>
                        <TableCell>
                          <Checkbox
                            checked={Boolean(
                              escolhas[item.numero]?.selecionada,
                            )}
                            disabled={!item.selecionavel || ocupado}
                            onChange={(_, checked) =>
                              alterar(item.numero, { selecionada: checked })
                            }
                            slotProps={{
                              input: {
                                "aria-label": `Importar linha ${item.numero}`,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {item.numero} · {item.nome}
                          {item.prioridade && (
                            <Typography
                              variant="caption"
                              sx={{ display: "block" }}
                            >
                              Prioridade {item.prioridade}: {item.proximaAcao}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.contato || "Não informado"}
                          <Typography
                            variant="caption"
                            sx={{ display: "block" }}
                          >
                            {item.emails.join("; ") ||
                              item.emailOriginal ||
                              "Sem e-mail"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ display: "block" }}
                          >
                            {item.telefone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            Original: {item.funilOriginal || "Não informado"}
                          </Typography>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={escolhas[item.numero]?.etapa || ""}
                            disabled={ocupado || !item.selecionavel}
                            onChange={(e) =>
                              alterar(item.numero, { etapa: e.target.value })
                            }
                            slotProps={{ select: { displayEmpty: true } }}
                          >
                            <MenuItem value="">Revisar etapa</MenuItem>
                            {etapas.map((etapa) => (
                              <MenuItem key={etapa.value} value={etapa.value}>
                                {etapa.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            Original: {item.segmentoOriginal || "Não informado"}
                          </Typography>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={escolhas[item.numero]?.segmentoId || ""}
                            disabled={ocupado || !item.selecionavel}
                            onChange={(e) =>
                              alterar(item.numero, {
                                segmentoId: e.target.value || null,
                                segmentoAutomatico: false,
                              })
                            }
                            slotProps={{ select: { displayEmpty: true } }}
                          >
                            <MenuItem value="">Não classificado</MenuItem>
                            {segmentos.map((segmento) => (
                              <MenuItem key={segmento.id} value={segmento.id}>
                                {segmento.nome}
                              </MenuItem>
                            ))}
                          </TextField>
                          {item.cnae && (
                            <Button
                              size="small"
                              disabled={ocupado}
                              onClick={() => {
                                setOcupado(true);
                                setErro("");
                                void SegmentosService.classificarSegmento(item.cnae)
                                  .then((dados) =>
                                    alterar(item.numero, {
                                      segmentoId: dados.segmento?.id ?? null,
                                      segmentoAutomatico: true,
                                    }),
                                  )
                                  .catch((error) => setErro(mensagem(error)))
                                  .finally(() => setOcupado(false));
                              }}
                            >
                              Usar CNAE {item.cnae}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.erros.map((texto, i) => (
                            <Typography
                              key={`e${i}`}
                              color="error"
                              variant="caption"
                              sx={{ display: "block" }}
                            >
                              {texto}
                            </Typography>
                          ))}
                          {item.duplicidades.map((d, i) => (
                            <Typography
                              key={`d${i}`}
                              variant="caption"
                              sx={{ display: "block" }}
                            >
                              {d.motivo}{" "}
                              {d.id ? (
                                <Link to={`/cadastros/${d.id}`}>{d.nome}</Link>
                              ) : (
                                d.nome
                              )}
                            </Typography>
                          ))}
                          {item.avisos.map((texto, i) => (
                            <Typography
                              key={`a${i}`}
                              variant="caption"
                              sx={{ display: "block" }}
                            >
                              {texto}
                            </Typography>
                          ))}
                          {!escolhas[item.numero]?.etapa &&
                            item.selecionavel && (
                              <Typography
                                color="warning.main"
                                variant="caption"
                              >
                                Escolha a etapa.
                              </Typography>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: "flex-end", alignItems: "center" }}
              >
                <Button
                  disabled={!pagina || ocupado}
                  onClick={() => setPagina((valor) => valor - 1)}
                >
                  Anterior
                </Button>
                <Typography variant="body2">
                  Página {pagina + 1} de{" "}
                  {Math.max(1, Math.ceil(linhas.length / 20))}
                </Typography>
                <Button
                  disabled={(pagina + 1) * 20 >= linhas.length || ocupado}
                  onClick={() => setPagina((valor) => valor + 1)}
                >
                  Próxima
                </Button>
              </Stack>
              {incompletas && (
                <Alert severity="warning">
                  Escolha a etapa de todas as linhas selecionadas antes de
                  continuar.
                </Alert>
              )}
              {selecionadas.length > 200 && (
                <Alert severity="warning">
                  Selecione até 200 linhas por importação. As demais serão
                  ignoradas neste lote.
                </Alert>
              )}
              {new Date(job.expiresAt).getTime() <= Date.now() && (
                <Alert severity="error">
                  Esta prévia expirou. Gere uma nova.
                </Alert>
              )}
              {confirmacao && (
                <Alert severity="warning">
                  Confirma criar {selecionadas.length} novos Leads? Os dados
                  existentes serão preservados e a operação será auditada.
                </Alert>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button disabled={ocupado} onClick={aoFechar}>
          Fechar
        </Button>
        {job && (
          <Button
            disabled={ocupado}
            onClick={() => {
              setJob(null);
              setConfirmacao(false);
              setErro("");
            }}
          >
            Outra planilha
          </Button>
        )}
        {job?.status === "PREVIA" && (
          <Button
            variant="contained"
            disabled={
              ocupado ||
              !selecionadas.length ||
              selecionadas.length > 200 ||
              incompletas ||
              new Date(job.expiresAt).getTime() <= Date.now()
            }
            onClick={() => {
              if (confirmacao) confirmar();
              else setConfirmacao(true);
            }}
          >
            {ocupado
              ? "Importando…"
              : confirmacao
                ? "Confirmar importação"
                : "Revisar e importar"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
