import { calculateAmortization } from "../finance/amortizacao.js";
import {
  calculateConstructionEvolution,
  calculateInccScenario,
  calculateSaleExpectation,
  calculateWorkInterestScenario,
  compareConstructionScenarios,
} from "../finance/construction.js";
import { calculateEntryPlan } from "../finance/entrada.js";
import { createFgtsMap } from "../finance/fgts.js";
import { annualToMonthlyRate } from "../finance/helpers.js";
import { calculatePrice } from "../finance/price.js";
import { calculateIncomeCapacity } from "../finance/renda.js";
import { calculateSac } from "../finance/sac.js";
import { buildShareUrl, parseSharedSimulation } from "../utils/share.js";
import { createMemoryStorage, listSimulations, loadSettings, saveSettings, saveSimulation } from "../utils/storage.js";

const MONTHLY_ONE_PERCENT_ANNUAL = 12.682503013196972;

export function runFinanceTests() {
  const tests = [
    testAnnualToMonthlyRate,
    testSacWithoutContributions,
    testSacWithTermReductionContribution,
    testPriceWithoutContributions,
    testPriceWithTermReductionContribution,
    testFgtsEvery24Months,
    testInstallmentReduction,
    testSummarySavingsAndEliminatedInstallments,
    testEntryCalculator,
    testIncomeCalculator,
    testConstructionWorkInterest,
    testConstructionInccCorrection,
    testConstructionScenarioComparison,
    testConstructionSaleRoi,
    testSettingsStorage,
    testSimulationStorage,
    testSharedSimulationUrl,
  ];

  return tests.map((test) => {
    try {
      test();
      return { name: test.name, status: "passed" };
    } catch (error) {
      return { name: test.name, status: "failed", message: error.message };
    }
  });
}

function testConstructionWorkInterest() {
  const result = calculateWorkInterestScenario({
    financedValue: 120000,
    monthlyRate: 0.01,
    months: 12,
  });

  assertEqual(result.rows.length, 12, "juros de obra deve gerar 12 meses");
  assertClose(result.firstMonthInterest, 100, "juros de obra primeiro mês");
  assertClose(result.lastMonthInterest, 1200, "juros de obra último mês");
  assertClose(result.totalInterest, 7800, "juros de obra total");
}

function testConstructionInccCorrection() {
  const result = calculateInccScenario({
    financedValue: 120000,
    monthlyRate: 0.01,
    months: 12,
  });

  assertEqual(result.rows.length, 12, "INCC deve gerar 12 meses");
  assertClose(result.updatedBalance, 135219.00320418837, "saldo corrigido por INCC");
  assertClose(result.correctionAmount, 15219.003204188368, "correção acumulada INCC");
}

function testConstructionScenarioComparison() {
  const comparison = compareConstructionScenarios({
    propertyValue: 150000,
    financedValue: 120000,
    downPayment: 30000,
    workInterestCost: 7800,
    inccCost: 15219.003204188368,
  });

  assertEqual(comparison.bestScenario, "jurosObra", "menor custo deve ser juros de obra");
  assertClose(comparison.difference, 7419.003204188368, "diferença financeira construção");
  assertClose(comparison.economy, 7419.003204188368, "economia construção");
}

function testConstructionSaleRoi() {
  const sale = calculateSaleExpectation({
    propertyValue: 150000,
    downPayment: 30000,
    expectedSaleValue: 180000,
    workInterestCost: 7800,
    inccCost: 15219.003204188368,
  });
  const full = calculateConstructionEvolution({
    propertyValue: 150000,
    financedValue: 120000,
    downPayment: 30000,
    workInterestAnnualRate: MONTHLY_ONE_PERCENT_ANNUAL,
    inccAnnualRate: MONTHLY_ONE_PERCENT_ANNUAL,
    months: 12,
    expectedSaleValue: 180000,
  });

  assertClose(sale.workInterest.capitalInvested, 37800, "capital investido juros de obra");
  assertClose(sale.workInterest.netProfit, 22200, "lucro líquido juros de obra");
  assertClose(sale.workInterest.roi, 0.5873015873015873, "ROI juros de obra");
  assertEqual(sale.bestScenario, "jurosObra", "melhor ROI deve ser juros de obra");
  assertClose(full.rates.workInterestMonthlyRate, 0.01, "taxa mensal obra equivalente");
  assertClose(full.rates.inccMonthlyRate, 0.01, "taxa mensal INCC equivalente");
}

function testAnnualToMonthlyRate() {
  assertClose(annualToMonthlyRate(MONTHLY_ONE_PERCENT_ANNUAL), 0.01, "taxa mensal equivalente");
}

function testSacWithoutContributions() {
  const rows = calculateSac({ principal: 120000, monthlyRate: 0.01, months: 12 });

  assertEqual(rows.length, 12, "SAC sem aportes deve manter 12 parcelas");
  assertClose(rows[0].amortization, 10000, "SAC amortizacao fixa");
  assertClose(rows[0].interest, 1200, "SAC juros primeira parcela");
  assertClose(rows[0].installment, 11200, "SAC parcela inicial");
  assertClose(rows.at(-1).installment, 10100, "SAC parcela final");
  assertClose(sum(rows, "interest"), 7800, "SAC juros totais");
}

function testSacWithTermReductionContribution() {
  const rows = calculateSac({
    principal: 120000,
    monthlyRate: 0.01,
    months: 12,
    manualMap: new Map([[1, 20000]]),
    amortizationGoal: "prazo",
  });

  assertEqual(rows.length, 10, "SAC com aporte deve eliminar 2 parcelas");
  assertClose(rows[0].newBalance, 90000, "SAC saldo apos aporte");
  assertClose(sum(rows, "interest"), 5700, "SAC juros com aporte");
  assertClose(rows.at(-1).newBalance, 0, "SAC saldo final com aporte");
}

function testPriceWithoutContributions() {
  const rows = calculatePrice({ principal: 100000, monthlyRate: 0.01, months: 12 });

  assertEqual(rows.length, 12, "PRICE sem aportes deve manter 12 parcelas");
  assertClose(rows[0].installment, 8884.878867834168, "PRICE PMT");
  assertClose(rows[0].interest, 1000, "PRICE juros primeira parcela");
  assertClose(sum(rows, "interest"), 6618.546414010051, "PRICE juros totais");
  assertClose(rows.at(-1).newBalance, 0, "PRICE saldo final");
}

function testPriceWithTermReductionContribution() {
  const rows = calculatePrice({
    principal: 100000,
    monthlyRate: 0.01,
    months: 12,
    manualMap: new Map([[1, 20000]]),
    amortizationGoal: "prazo",
  });

  assertEqual(rows.length, 10, "PRICE com aporte deve eliminar 2 parcelas");
  assertClose(rows[1].installment, 8884.878867834168, "PRICE deve manter parcela ao reduzir prazo");
  assertClose(sum(rows, "interest"), 4481.804648384206, "PRICE juros com aporte");
  assertClose(rows.at(-1).newBalance, 0, "PRICE saldo final com aporte");
}

function testFgtsEvery24Months() {
  const fgts = createFgtsMap({
    value: 10000,
    periodicity: 24,
    firstMonth: 24,
    limitMonth: 72,
  });

  assertEqual(fgts.size, 3, "FGTS deve gerar 3 eventos");
  assertClose(fgts.get(24), 10000, "FGTS mes 24");
  assertClose(fgts.get(48), 10000, "FGTS mes 48");
  assertClose(fgts.get(72), 10000, "FGTS mes 72");
}

function testInstallmentReduction() {
  const sacRows = calculateSac({
    principal: 120000,
    monthlyRate: 0.01,
    months: 12,
    manualMap: new Map([[1, 20000]]),
    amortizationGoal: "parcela",
  });
  const priceRows = calculatePrice({
    principal: 100000,
    monthlyRate: 0.01,
    months: 12,
    manualMap: new Map([[1, 20000]]),
    amortizationGoal: "parcela",
  });

  assertEqual(sacRows.length, 12, "SAC reducao de parcela deve manter prazo");
  assertClose(sacRows[1].installment, 9081.818181818182, "SAC nova parcela");
  assertEqual(priceRows.length, 12, "PRICE reducao de parcela deve manter prazo");
  assertClose(priceRows[1].installment, 6955.797353608893, "PRICE nova parcela");
}

function testSummarySavingsAndEliminatedInstallments() {
  const result = calculateAmortization(
    {
      valorFinanciado: 120000,
      taxaAnual: MONTHLY_ONE_PERCENT_ANNUAL,
      prazo: 12,
      sistema: "SAC",
      objetivoAmortizacao: "prazo",
    },
    {
      manual: new Map([[1, 20000]]),
      fgts: new Map(),
    },
  );

  assertClose(result.stats.economiaJuros, 2100, "economia em juros");
  assertEqual(result.stats.parcelasEliminadas, 2, "parcelas eliminadas");
  assertEqual(result.stats.novoPrazo, 10, "novo prazo");
  assertClose(result.stats.economiaPercentual, 0.26923076923076944, "economia percentual");
}

function testEntryCalculator() {
  const result = calculateEntryPlan({
    valorImovel: 500000,
    valorFinanciado: 400000,
    sinal: 10000,
    fgts: 30000,
    recursosProprios: 40000,
    subsidio: 10000,
    despesasExtras: 5000,
    itbi: 10000,
    registro: 4000,
    escritura: 1000,
    administrativo: 0,
  });

  assertClose(result.requiredEntry, 100000, "entrada necessária");
  assertClose(result.extraExpenses, 20000, "despesas extras");
  assertClose(result.availableEntry, 90000, "entrada disponível");
  assertClose(result.missing, 30000, "falta para completar");
  assertClose(result.entryPercent, 0.2, "percentual de entrada");
  assertClose(result.financedPercent, 0.8, "percentual financiado");
}

function testIncomeCalculator() {
  const result = calculateIncomeCapacity({
    valorImovel: 500000,
    entrada: 100000,
    valorFinanciado: 400000,
    taxaAnual: MONTHLY_ONE_PERCENT_ANNUAL,
    prazo: 360,
    sistema: "SAC",
    comprometimento: 30,
    rendaFamiliar: 15000,
    outrasParcelas: 500,
  });

  assertClose(result.installment, 5111.111111111111, "parcela SAC estimada");
  assertClose(result.minimumIncome, 18703.703703703704, "renda mínima");
  assertEqual(result.status, "insuficiente", "status de renda");
  assertClose(result.incomeIncreaseNeeded, 3703.703703703704, "renda a aumentar");
}

function testSettingsStorage() {
  const storage = createMemoryStorage();
  saveSettings({ brokerName: "Bruno", creci: "12345" }, storage);
  const settings = loadSettings(storage);

  assertEqual(settings.brokerName, "Bruno", "nome salvo");
  assertEqual(settings.creci, "12345", "creci salvo");
}

function testSimulationStorage() {
  const storage = createMemoryStorage();
  saveSimulation({ type: "amortizacao", clientName: "João", input: { valorFinanciado: 100000 } }, storage);
  const list = listSimulations(storage);

  assertEqual(list.length, 1, "simulação salva");
  assertEqual(list[0].clientName, "João", "cliente salvo");
}

function testSharedSimulationUrl() {
  const url = buildShareUrl({
    cliente: "João",
    valorImovel: 500000,
    entrada: 100000,
    valorFinanciado: 400000,
    prazo: 360,
    taxaAnual: 10,
    sistema: "PRICE",
    objetivoAmortizacao: "prazo",
  }, "https://example.com/app");
  const parsed = parseSharedSimulation(new URL(url).search);

  assertEqual(parsed.cliente, "João", "cliente no link");
  assertEqual(parsed.sistema, "PRICE", "sistema no link");
  assertEqual(parsed.prazo, "360", "prazo no link");
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + (row[key] || 0), 0);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${expected}, recebido ${actual}`);
  }
}

function assertClose(actual, expected, label, tolerance = 0.005) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: esperado ${expected}, recebido ${actual}`);
  }
}
