export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value) {
  return currency.format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function parseNumber(value) {
  if (typeof value === "number") return value;
  const raw = String(value || "")
    .replace(/\s/g, "")
    .replace(/[R$%]/g, "");
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPercentValue(value) {
  return `${formatNumber(value, 4)}%`;
}
