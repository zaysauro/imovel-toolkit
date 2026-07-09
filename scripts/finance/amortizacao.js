import { calculatePrice } from "./price.js";
import { calculateSac } from "./sac.js";
import { annualToMonthlyRate } from "./helpers.js";

export function calculateAmortization(input, schedules) {
  const monthlyRate = annualToMonthlyRate(input.taxaAnual);
  const params = {
    principal: input.valorFinanciado,
    monthlyRate,
    months: input.prazo,
    manualMap: schedules.manual,
    fgtsMap: schedules.fgts,
    amortizationGoal: input.objetivoAmortizacao || "prazo",
  };
  const originalParams = { ...params, manualMap: new Map(), fgtsMap: new Map() };
  const rows = input.sistema === "PRICE" ? calculatePrice(params) : calculateSac(params);
  const originalRows = input.sistema === "PRICE" ? calculatePrice(originalParams) : calculateSac(originalParams);
  const stats = summarize(input, rows, originalRows, monthlyRate);

  return { rows, originalRows, stats, monthlyRate };
}

function summarize(input, rows, originalRows, monthlyRate) {
  const totalInterest = sum(rows, "interest");
  const originalInterest = sum(originalRows, "interest");
  const totalManual = sum(rows, "manualContribution");
  const totalFgts = sum(rows, "fgtsContribution");
  const totalAmortized = totalManual + totalFgts;
  const totalPaid = sum(rows, "installment") + totalAmortized;
  const originalTotalPaid = sum(originalRows, "installment");
  const interestSavings = Math.max(0, originalInterest - totalInterest);
  const last = rows[rows.length - 1] || {};
  const eliminated = Math.max(0, input.prazo - rows.length);
  const paidPrincipal = Math.max(0, input.valorFinanciado - (last.newBalance || 0));

  return {
    valorFinanciado: input.valorFinanciado,
    taxaAnual: input.taxaAnual,
    taxaMensal: monthlyRate * 100,
    prazo: input.prazo,
    sistema: input.sistema,
    jurosTotais: totalInterest,
    totalPago: totalPaid,
    saldoAtual: last.newBalance || 0,
    prazoRestante: Math.max(0, input.prazo - rows.length),
    totalAmortizado: totalAmortized,
    aportesUtilizados: totalManual,
    fgtsUtilizado: totalFgts,
    economiaJuros: interestSavings,
    economiaPercentual: originalInterest > 0 ? interestSavings / originalInterest : 0,
    economiaTotal: Math.max(0, originalTotalPaid - totalPaid),
    parcelasEliminadas: eliminated,
    novoPrazo: rows.length,
    valorTotalPago: totalPaid,
    saldoOriginalFinal: originalRows.at(-1)?.newBalance || 0,
    principalPago: paidPrincipal,
  };
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + (row[key] || 0), 0);
}
