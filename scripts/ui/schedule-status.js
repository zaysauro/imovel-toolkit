export function scheduleStatus(label, scheduleMap) {
  const count = scheduleMap?.size || 0;
  const active = count > 0;
  if (!active) return { active, text: label === "Aportes" ? "Aportes inativos" : `${label} inativo` };
  return { active, text: `${label} ${label === "Aportes" ? "ativos" : "ativo"}: ${count} lançamentos` };
}
