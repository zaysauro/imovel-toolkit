import { annualToMonthlyRate, pmt } from "./helpers.js";

export function calculateIncomeCapacity(input) {
  const propertyValue = money(input.valorImovel);
  const entry = money(input.entrada);
  const financedValue = money(input.valorFinanciado);
  const annualRate = money(input.taxaAnual);
  const months = Math.max(0, Number(input.prazo) || 0);
  const commitmentPercent = Math.max(0, Number(input.comprometimento) || 0) / 100;
  const familyIncome = money(input.rendaFamiliar);
  const otherDebts = money(input.outrasParcelas);
  const monthlyRate = annualToMonthlyRate(annualRate);
  const installment = estimateInstallment({
    principal: financedValue,
    monthlyRate,
    months,
    system: input.sistema || "SAC",
  });
  const maxHousingPayment = Math.max(0, familyIncome * commitmentPercent - otherDebts);
  const minimumIncome = commitmentPercent > 0 ? (installment + otherDebts) / commitmentPercent : 0;
  const currentCommitment = familyIncome > 0 ? (installment + otherDebts) / familyIncome : 0;
  const availableMargin = maxHousingPayment - installment;
  const capacity = estimatePrincipalCapacity({
    payment: maxHousingPayment,
    monthlyRate,
    months,
    system: input.sistema || "SAC",
  });
  const maxPropertyValue = capacity + entry;
  const incomeIncreaseNeeded = Math.max(0, minimumIncome - familyIncome);
  const status = statusFrom({ familyIncome, installment, availableMargin, commitmentPercent });

  return {
    propertyValue,
    entry,
    financedValue,
    monthlyRate,
    installment,
    minimumIncome,
    familyIncome,
    currentCommitment,
    availableMargin,
    capacity,
    maxPropertyValue,
    incomeIncreaseNeeded,
    status,
  };
}

export function estimateInstallment({ principal, monthlyRate, months, system }) {
  if (principal <= 0 || months <= 0) return 0;
  if (system === "PRICE") return pmt(principal, monthlyRate, months);
  return principal / months + principal * monthlyRate;
}

export function estimatePrincipalCapacity({ payment, monthlyRate, months, system }) {
  if (payment <= 0 || months <= 0) return 0;
  if (system === "PRICE") {
    if (monthlyRate === 0) return payment * months;
    const factor = Math.pow(1 + monthlyRate, months);
    return payment * ((factor - 1) / (monthlyRate * factor));
  }
  return payment / (1 / months + monthlyRate);
}

function statusFrom({ familyIncome, installment, availableMargin, commitmentPercent }) {
  if (familyIncome <= 0 || installment <= 0 || commitmentPercent <= 0) return "atenção";
  if (availableMargin >= 0) return "aprovado estimado";
  return "insuficiente";
}

function money(value) {
  return Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
}
