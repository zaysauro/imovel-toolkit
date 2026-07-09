import { formatNumber, parseNumber } from "../finance/formatter.js";

const moneyFields = new Set([
  "valorImovel",
  "entrada",
  "valorFinanciado",
  "aluguelInicial",
  "valor",
]);

const percentFields = new Set([
  "taxaAnual",
  "reajusteAnual",
  "valorizacaoAnual",
]);

export function setupBrazilianMasks(root = document) {
  root.querySelectorAll("input").forEach((input) => {
    if (!shouldMask(input)) return;
    input.addEventListener("blur", () => formatInput(input));
    input.addEventListener("focus", () => {
      if (input.readOnly) return;
      input.value = parseNumber(input.value) || "";
    });
  });
}

export function formatInput(input) {
  if (input.readOnly || input.value === "") return;
  const value = parseNumber(input.value);
  if (shouldMask(input)) {
    input.value = formatNumber(value, 2);
  }
}

function shouldMask(input) {
  return moneyFields.has(input.name) || percentFields.has(input.name);
}
