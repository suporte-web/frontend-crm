const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const code = ts.transpileModule(
  fs.readFileSync("src/lib/visitas-formularios.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
    },
  },
).outputText;
const ctx = { exports: {}, Date, Number, Error };
vm.runInNewContext(code, ctx);
const { montarRealizacao, montarPosVisita, montarClienteVisita } = ctx.exports;
const realizado = {
  dataRealizada: "2026-10-01T10:00",
  relato: "Bom relato",
  pessoaAtendeu: "Maria",
  teveCusto: "false",
  emailPessoaAtendeu: "",
  custo: "250",
};
test("sem custo omite valor antigo e e-mail vazio, conservando o relato", () => {
  const d = montarRealizacao(realizado);
  assert.equal(d.teveCusto, false);
  assert.equal("custo" in d, false);
  assert.equal("emailPessoaAtendeu" in d, false);
  assert.equal(d.relato, "Bom relato");
});
test("custo positivo aceita vírgula decimal e exige valor", () => {
  assert.equal(
    montarRealizacao({ ...realizado, teveCusto: "true", custo: "12,50" }).custo,
    12.5,
  );
  assert.throws(
    () => montarRealizacao({ ...realizado, teveCusto: "true", custo: "" }),
    /custo/i,
  );
});
test("avaliação sem melhoria ou SAC omite os campos ocultos antigos", () => {
  const d = montarPosVisita(
    {
      atingiuObjetivo: "true",
      sentimentoCliente: "Satisfeito",
      possuiMelhoria: "false",
      melhoriaIdentificada: "Antiga",
      classificacao: "BOA",
      gerarSac: "false",
      relatoSac: "Antigo",
      tipoReclamacao: "Antigo",
      email: "",
    },
    false,
  );
  assert.equal(d.gerarSac, false);
  assert.equal(d.possuiMelhoria, false);
  assert.equal("melhoriaIdentificada" in d, false);
  assert.equal("relatoSac" in d, false);
  assert.equal("email" in d, false);
});
test("gera SAC apenas com relato e classificação da reclamação", () => {
  const d = {
    atingiuObjetivo: "false",
    sentimentoCliente: "Insatisfeito",
    possuiMelhoria: "true",
    melhoriaIdentificada: "Melhorar entrega",
    classificacao: "RUIM",
    gerarSac: "true",
    tipoReclamacao: "Atraso",
    relatoSac: "Entrega atrasada",
  };
  assert.equal(montarPosVisita(d, false).relatoSac, "Entrega atrasada");
  assert.throws(
    () => montarPosVisita({ ...d, relatoSac: "" }, false),
    /relato/i,
  );
});
test("nova data recusada exige ajuste e devolve avaliação à gestão sem SAC", () => {
  const d = {
    novaDataAceita: "false",
    atingiuObjetivo: "true",
    sentimentoCliente: "Aguardando retorno",
    possuiMelhoria: "false",
    classificacao: "BOA",
    gerarSac: "true",
    ajustesNecessarios: "Cliente pediu outra data",
  };
  const payload = montarPosVisita(d, true);
  assert.equal(payload.novaDataAceita, false);
  assert.equal(payload.gerarSac, false);
  assert.equal(payload.ajustesNecessarios, "Cliente pediu outra data");
});

function carregarTs(arquivo) {
  const contexto = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(arquivo, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
      },
    }).outputText,
    contexto,
  );
  return contexto.exports;
}
test("Visitas integra permissões existentes e respeita desativação por perfil", () => {
  const { appScreens, isScreenEnabledForRole } = carregarTs(
    "src/config/screens.ts",
  );
  const visitas = appScreens.find((s) => s.key === "visitas");
  assert.ok(visitas);
  for (const perfil of ["ADMIN", "GESTAO", "LIDER_ATENDIMENTO", "ATENDIMENTO"])
    assert.equal(isScreenEnabledForRole(visitas, perfil), true);
  assert.equal(isScreenEnabledForRole(visitas, "CLIENTE"), false);
  assert.equal(
    isScreenEnabledForRole(visitas, "ATENDIMENTO", [
      { role: "ATENDIMENTO", screenKey: "visitas", isEnabled: false },
    ]),
    false,
  );
  assert.equal(
    appScreens.find((s) => "/atendimento/visitas/123".startsWith(s.href + "/"))
      .key,
    "visitas",
  );
});
test("sidebar seleciona apenas Visitas nas rotas filhas e preserva SAC", () => {
  const { isScreenActive } = carregarTs(
    "src/components/layout/sidebar-utils.ts",
  );
  assert.equal(
    isScreenActive("/atendimento/visitas/123", "/atendimento/visitas"),
    true,
  );
  assert.equal(
    isScreenActive("/atendimento/visitas/123", "/atendimento"),
    false,
  );
  assert.equal(isScreenActive("/atendimento/acoes/123", "/atendimento"), false);
  assert.equal(isScreenActive("/atendimento/123", "/atendimento"), true);
});

test("cliente é livre, sem ID do cadastro, e permite limpar o CNPJ", () => {
  const d = montarClienteVisita({clienteNome: "  Empresa livre  ", cnpj: "12.345.678/0001-90", clienteId: "antigo"});
  assert.equal(d.clienteNome, "Empresa livre");
  assert.equal(d.cnpj, "12.345.678/0001-90");
  assert.equal("clienteId" in d, false);
  assert.equal(montarClienteVisita({clienteNome: "Cliente", cnpj: ""}).cnpj, "");
  assert.throws(() => montarClienteVisita({clienteNome: "   ", cnpj: ""}), /cliente/i);
});
