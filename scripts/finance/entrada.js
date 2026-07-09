export function calculateEntryPlan(input) {
  const propertyValue = money(input.valorImovel);
  const financedValue = money(input.valorFinanciado);
  const requiredEntry = Math.max(0, propertyValue - financedValue);
  const signal = money(input.sinal);
  const fgts = money(input.fgts);
  const ownResources = money(input.recursosProprios);
  const subsidy = money(input.subsidio);
  const extraExpenses =
    money(input.despesasExtras) +
    money(input.itbi) +
    money(input.registro) +
    money(input.escritura) +
    money(input.administrativo);
  const availableEntry = signal + fgts + ownResources + subsidy;
  const totalNeeded = requiredEntry + extraExpenses;
  const missing = Math.max(0, totalNeeded - availableEntry);
  const ownResourcesNeeded = Math.max(0, totalNeeded - signal - fgts - subsidy);
  const entryPercent = propertyValue > 0 ? requiredEntry / propertyValue : 0;
  const financedPercent = propertyValue > 0 ? financedValue / propertyValue : 0;

  return {
    propertyValue,
    financedValue,
    requiredEntry,
    signal,
    fgts,
    ownResources,
    subsidy,
    extraExpenses,
    availableEntry,
    totalNeeded,
    missing,
    ownResourcesNeeded,
    entryPercent,
    financedPercent,
    isEntryInsufficient: missing > 0.009,
    isFinancingHigh: financedPercent > 0.8,
  };
}

function money(value) {
  return Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
}
