const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript"),
  vm = require("node:vm");
function load(file, imports = {}) {
  const context = {
    exports: {},
    Map,
    Set,
    Date,
    Error,
    require: (name) => imports[name] || {},
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(path.resolve(__dirname, "..", file), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
    context,
  );
  return context.exports;
}
const lib = () => load("src/lib/perda-oportunidade.ts");
const catalog = [
  { codigo: "OUTRO", rotulo: "Outro motivo", exigeObservacao: true },
  {
    codigo: "LIMITACAO_OPERACIONAL",
    rotulo: "Limitação operacional",
    exigeObservacao: true,
  },
  {
    codigo: "CONCORRENTE",
    rotulo: "Concorrente escolhido",
    exigeObservacao: false,
  },
];
const opp = (id, status, codigo, date = "2026-11-05T10:00:00Z") => ({
  id,
  status,
  motivoPerda: codigo,
  createdAt: date,
});
test("perda exige motivo do catálogo, com justificativa nos dois casos obrigatórios", () => {
  const { validarPerda } = lib();
  assert.match(validarPerda(catalog, "", ""), /Selecione/);
  assert.match(validarPerda(catalog, "inventado", "texto"), /Selecione/);
  for (const reason of ["OUTRO", "LIMITACAO_OPERACIONAL"]) {
    assert.match(validarPerda(catalog, reason, "  "), /Descreva/);
    assert.equal(validarPerda(catalog, reason, "Descrição"), "");
  }
  assert.equal(validarPerda(catalog, "CONCORRENTE", ""), "");
});
test("BI conta IDs únicos, ignora abertas, agrupa texto livre somente na categoria", () => {
  const { analisarPerdas } = lib();
  const rows = [
    opp("a", "LOST", "OUTRO"),
    { ...opp("b", "LOST", "OUTRO"), observacaoPerda: "Descrição diferente" },
    opp("c", "LOST", "CONCORRENTE"),
    opp("w", "WON", null),
    opp("o", "OPEN", "OUTRO"),
    opp("a", "LOST", "OUTRO"),
  ];
  const result = analisarPerdas(rows, catalog);
  assert.equal(result.total, 3);
  assert.equal(result.encerradas, 4);
  assert.equal(result.taxa, 75);
  assert.equal(result.principal, "Outro motivo");
  const other = result.motivos.find((x) => x.codigo === "OUTRO");
  assert.equal(other.quantidade, 2);
  assert.ok(Math.abs(other.percentual - 200 / 3) < 0.001);
  assert.equal(result.motivos.length, 3);
});
test("BI apresenta zero sem encerradas e perdas antigas como não informadas", () => {
  const { analisarPerdas } = lib();
  assert.equal(analisarPerdas([opp("a", "OPEN", "OUTRO")], catalog).taxa, 0);
  const result = analisarPerdas(
    [
      { ...opp("legado", "LOST", null), lostReason: "Preço antigo livre" },
      opp("desconhecido", "LOST", "x"),
    ],
    catalog,
  );
  assert.equal(result.total, 2);
  assert.equal(result.principal, "Motivo não informado");
  assert.equal(result.motivos.find((x) => x.codigo === null).quantidade, 2);
});
test("BI respeita início/fim do período brasileiro e rejeita datas inválidas", () => {
  const { analisarPerdas } = lib();
  const rows = [
    opp("antes", "LOST", "OUTRO", "2026-11-05T02:59:59Z"),
    opp("inicio", "LOST", "OUTRO", "2026-11-05T03:00:00Z"),
    opp("fim", "WON", null, "2026-11-06T02:59:59Z"),
    opp("depois", "LOST", "OUTRO", "2026-11-06T03:00:00Z"),
  ];
  const result = analisarPerdas(rows, catalog, {
    de: "2026-11-05",
    ate: "2026-11-05",
  });
  assert.equal(result.total, 1);
  assert.equal(result.taxa, 50);
  assert.throws(
    () => analisarPerdas(rows, catalog, { de: "2026-02-30" }),
    /Período/,
  );
  assert.throws(
    () =>
      analisarPerdas(rows, catalog, { de: "2026-11-05", ate: "2026-10-01" }),
    /Período/,
  );
});
test("reabertura não contabiliza motivo anterior como perda atual", () => {
  const { analisarPerdas } = lib();
  const result = analisarPerdas(
    [opp("reaberta", "OPEN", "OUTRO"), opp("ganha", "WON", "OUTRO")],
    catalog,
  );
  assert.equal(result.total, 0);
  assert.equal(result.taxa, 0);
  assert.equal(result.principal, "Sem perdas");
});
test("API envia código e observações pela rota de status existente", async () => {
  let request;
  const service = load("src/services/crm.service.ts", {
    "@/services/api": { API_BASE_URL: "/api" },
    "@/lib/opportunity-documents": {},
  });
  // A função de serviço usa fetch nativo: carregar em contexto dedicado.
  const context = {
    exports: {},
    require: (name) =>
      name === "@/services/api"
        ? { API_BASE_URL: "/api" }
        : name === "@/services/motivos-perda.service"
          ? {
              validarDadosPerda: async (_token, motivo, observacao) => {
                const erro = lib().validarPerda(catalog, motivo, observacao);
                if (erro) throw new Error(erro);
              },
            }
          : {},
    fetch: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ id: "o" }) };
    },
  };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        path.resolve(__dirname, "../src/services/crm.service.ts"),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
    context,
  );
  await context.exports.updateOpportunityStatus("c", "o", "LOST", "token", {
    motivoPerda: "OUTRO",
    observacaoPerda: "Descrição",
  });
  assert.equal(request.url, "/api/clients/c/opportunities/o/status");
  const body = JSON.parse(request.options.body);
  assert.equal(body.motivoPerda, "OUTRO");
  assert.equal(body.observacaoPerda, "Descrição");
});
