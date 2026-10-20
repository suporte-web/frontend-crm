const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function load(path, imports = {}) {
  const context = { exports: {}, require: (id) => imports[id] };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    context,
  );
  return context.exports;
}
const stages = load("src/constants/lead-funnel.ts");
const { montarBiComercial, valorMonetario } = load("src/lib/bi-comercial.ts", {
  "@/constants/lead-funnel": stages,
});
const lead = (id, status, extra = {}) => ({
  id,
  name: id,
  source: "manual",
  status,
  createdAt: "2026-10-10T12:00:00Z",
  updatedAt: "2026-10-14T12:00:00Z",
  ...extra,
});

test("usa todos os canais, deduplica IDs e inclui vendas já convertidas", () => {
  const rows = [
    lead("a", "entrada_leads"),
    lead("b", "homologacao", { source: "whatsapp" }),
    lead("c", "venda_efetivada", { convertidoParaCliente: true }),
    lead("a", "entrada_leads"),
  ];
  const result = montarBiComercial(rows, {
    de: "2026-10-01",
    ate: "2026-10-31",
    agora: new Date("2026-10-15T12:00:00Z"),
  });
  assert.equal(result.total, 3);
  assert.equal(result.ativos, 2);
  assert.equal(result.convertidos, 1);
  assert.equal(
    result.etapas.reduce((sum, row) => sum + row.quantidade, 0),
    3,
  );
  assert.ok(Math.abs(result.conversao - 100 / 3) < 0.001);
});
test("aplica período inclusivo por data de cadastro sem usar a última atualização", () => {
  const result = montarBiComercial(
    [
      lead("a", "new", { createdAt: "2026-10-01T02:59:59Z" }),
      lead("b", "new", { createdAt: "2026-10-01T03:00:00Z" }),
      lead("c", "new", { createdAt: "2026-11-01T02:59:59Z" }),
      lead("d", "new", { createdAt: "2026-11-01T03:00:00Z" }),
    ],
    { de: "2026-10-01", ate: "2026-10-31" },
  );
  assert.equal(result.total, 2);
  assert.throws(() => montarBiComercial([], { de: "2026-02-30" }), /inválido/);
  assert.throws(
    () => montarBiComercial([], { de: "2026-10-20", ate: "2026-10-01" }),
    /inválido/,
  );
});
test("não trata atualização cadastral como contato ou inventa vencimentos", () => {
  const result = montarBiComercial(
    [
      lead("a", "cotacao"),
      lead("b", "conversao", {
        lastInteractionAt: "2026-10-05T12:00:00Z",
        metadata: {
          nextAction: "Retornar proposta",
          responsible: "Carla",
          monthlyEstimatedValue: "R$ 1.234,56",
        },
      }),
    ],
    { agora: new Date("2026-10-15T12:00:00Z") },
  );
  assert.equal(result.semInteracao, 1);
  assert.equal(result.semProximaAcao, 1);
  assert.equal(result.tempoMedioSemContato, 10);
  assert.equal(result.valorMensal, 1234.56);
  assert.equal(
    result.prioridades.find((row) => row.id === "a").diasSemContato,
    null,
  );
  assert.equal(
    result.prioridades.find((row) => row.id === "b").responsavel,
    "Carla",
  );
});
test("valores brasileiros e decimais não viram números incorretos", () => {
  assert.equal(valorMonetario("1.234,56"), 1234.56);
  assert.equal(valorMonetario("1234.56"), 1234.56);
  assert.equal(valorMonetario(""), 0);
  assert.equal(valorMonetario("inválido"), 0);
});

test("interacao nova prevalece sobre a data antiga do cadastro", () => {
  const result = montarBiComercial(
    [
      lead("a", "cotacao", {
        metadata: { lastInteractionDate: "2026-10-01", nextAction: "Retornar" },
        lastInteractionAt: "2026-10-15T12:00:00Z",
      }),
    ],
    { agora: new Date("2026-10-15T12:00:00Z") },
  );
  assert.equal(result.tempoMedioSemContato, 0);
  assert.equal(result.prioridades.length, 0);
});

test("separadores brasileiros de milhares sem centavos", () => {
  assert.equal(valorMonetario("57.900"), 57900);
  assert.equal(valorMonetario("1.234.567"), 1234567);
  assert.equal(valorMonetario("1.234"), 1234);
});

test('BI Comercial tem acesso restrito e preserva Funil de Vendas',()=>{
 const screens=load('src/config/screens.ts');
 for(const role of ['ADMIN','GESTAO','COMERCIAL']) assert.equal(screens.podeAcessarRota('/bi-comercial',role),true);
 for(const role of ['CONSULTORA','MARKETING','CLIENTE']) assert.equal(screens.podeAcessarRota('/bi-comercial',role,[{screenKey:'commercialBi',isEnabled:true}]),false);
 assert.ok(screens.appScreens.some(item=>item.href==='/bi'));
});
