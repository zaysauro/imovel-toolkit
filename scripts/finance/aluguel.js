import { calculateSac } from "./sac.js";
import { annualToMonthlyRate } from "./helpers.js";

export function compareRentVsFinancing(input) {
  const monthlyRate = annualToMonthlyRate(input.taxaAnual);
  const schedule = calculateSac({
    principal: input.valorFinanciado,
    monthlyRate,
    months: input.prazo,
  });
  const months = Math.min(input.horizonte, input.prazo);
  const rows = [];
  let totalRent = 0;
  let crossover = null;

  for (let month = 1; month <= months; month += 1) {
    const yearFactor = Math.floor((month - 1) / 12);
    const rent = input.aluguelInicial * Math.pow(1 + input.reajusteAnual / 100, yearFactor);
    const propertyValue = input.valorImovel * Math.pow(1 + input.valorizacaoAnual / 100, month / 12);
    const installment = schedule[month - 1]?.installment || 0;
    const paidPrincipal = input.valorFinanciado - (schedule[month - 1]?.newBalance || 0);
    const equity = input.entrada + paidPrincipal + (propertyValue - input.valorImovel);
    totalRent += rent;
    if (!crossover && rent > installment) crossover = month;
    rows.push({ month, rent, installment, propertyValue, equity });
  }

  const totalFinancing = schedule.slice(0, months).reduce((sum, row) => sum + row.installment, input.entrada);
  const last = rows.at(-1) || {};

  return {
    rows,
    summary: {
      aluguelUltrapassaParcela: crossover,
      totalAlugando: totalRent,
      totalComprado: totalFinancing,
      patrimonioAcumulado: last.equity || 0,
      valorizacaoImovel: (last.propertyValue || input.valorImovel) - input.valorImovel,
      comparativoFinanceiro: (last.equity || 0) - totalRent,
    },
  };
}
