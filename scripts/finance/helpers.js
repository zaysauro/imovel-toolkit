export function annualToMonthlyRate(annualPercent) {
  return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
}

export function clampMoney(value) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

export function pmt(principal, monthlyRate, months) {
  if (months <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

export function buildScheduleMap(rows, kind) {
  return rows.reduce((map, row) => {
    map.set(row.month, kind === "fgts" ? row.fgts : row.manual);
    return map;
  }, new Map());
}

export function generateScheduledRows({ value, periodicity, firstMonth, limitMonth }) {
  const rows = [];
  const step = Math.max(1, Number(periodicity) || 1);
  const start = Math.max(1, Number(firstMonth) || 1);
  const end = Math.max(start, Number(limitMonth) || start);
  for (let month = start; month <= end; month += step) {
    rows.push({ month, value });
  }
  return rows;
}
