export function buildShareUrl(input, baseUrl = location.href) {
  const url = new URL(baseUrl);
  url.search = "";
  const params = {
    cliente: input.cliente,
    valor: input.valorImovel,
    entrada: input.entrada,
    financiado: input.valorFinanciado,
    prazo: input.prazo,
    taxa: input.taxaAnual,
    sistema: input.sistema,
    objetivo: input.objetivoAmortizacao,
  };
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  url.hash = "amortizacao";
  return url.toString();
}

export function parseSharedSimulation(search = location.search) {
  const params = new URLSearchParams(search);
  if (![...params.keys()].length) return null;
  return {
    cliente: params.get("cliente") || "",
    valorImovel: params.get("valor") || "",
    entrada: params.get("entrada") || "",
    valorFinanciado: params.get("financiado") || "",
    prazo: params.get("prazo") || "",
    taxaAnual: params.get("taxa") || "",
    sistema: params.get("sistema") || "SAC",
    objetivoAmortizacao: params.get("objetivo") || "prazo",
  };
}

export function buildWhatsAppUrl({ input, stats, settings, formatCurrency }) {
  const phone = String(settings.whatsapp || "").replace(/\D/g, "");
  const message = [
    "Olá!",
    "",
    "Segue a simulação realizada.",
    "",
    `Cliente: ${input.cliente || "Não informado"}`,
    `Valor do imóvel: ${formatCurrency(input.valorImovel)}`,
    `Entrada: ${formatCurrency(input.entrada)}`,
    `Valor financiado: ${formatCurrency(input.valorFinanciado)}`,
    `Sistema: ${input.sistema}`,
    `Prazo: ${input.prazo || 0} meses`,
    `Parcela estimada: ${formatCurrency(stats?.valorTotalPago && stats?.novoPrazo ? stats.valorTotalPago / stats.novoPrazo : 0)}`,
    `Economia estimada: ${formatCurrency(stats?.economiaJuros || 0)}`,
    "",
    settings.brokerName ? `${settings.brokerName}${settings.creci ? ` | CRECI ${settings.creci}` : ""}` : "",
    settings.whatsapp ? `WhatsApp: ${settings.whatsapp}` : "",
    "",
    "Esta simulação é estimativa e depende da análise de crédito da instituição financeira.",
  ].filter(Boolean).join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
