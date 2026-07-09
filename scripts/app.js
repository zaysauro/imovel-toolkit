import { calculateAmortization } from "./finance/amortizacao.js";
import { compareRentVsFinancing } from "./finance/aluguel.js";
import { calculateEntryPlan } from "./finance/entrada.js";
import { calculateIncomeCapacity } from "./finance/renda.js";
import { createContributionMap } from "./finance/aportes.js";
import { createFgtsMap } from "./finance/fgts.js";
import { annualToMonthlyRate } from "./finance/helpers.js";
import { formatCurrency, formatNumber, formatPercentValue, parseNumber } from "./finance/formatter.js";
import { renderDashboardCards, renderUtilityPages } from "./ui/dashboard.js";
import { renderBalanceChart, renderEntryChart, renderRentChart } from "./ui/charts.js";
import { setupModals } from "./ui/modals.js";
import { exportSimulationPdf } from "./ui/pdf.js";
import { setupSidebar } from "./ui/sidebar.js";
import { setupBrazilianMasks } from "./utils/masks.js";
import {
  clearSettings,
  deleteSimulation,
  duplicateSimulation,
  findSimulation,
  listSimulations,
  loadSettings,
  saveSettings,
  saveSimulation,
} from "./utils/storage.js";
import { buildShareUrl, buildWhatsAppUrl, parseSharedSimulation } from "./utils/share.js";

const state = {
  route: "dashboard",
  schedules: {
    manual: new Map(),
    fgts: new Map(),
  },
  rows: [],
  originalRows: [],
  stats: {},
  input: {},
  summaryRows: [],
  settings: {},
  currentSimulationId: null,
};

document.addEventListener("DOMContentLoaded", () => {
  setupTheme();
  state.settings = loadSettings();
  renderIcons();
  renderDashboardCards();
  renderUtilityPages();
  setupSidebar((route) => {
    state.route = route;
    requestAnimationFrame(() => {
      renderIcons();
      renderAll();
    });
  });
  setupForms();
  setupBrazilianMasks();
  setupSettings();
  setupGlossary();
  setupModals({
    onApply: applySchedule,
    onClear: clearSchedule,
  });
  document.querySelector("[data-action='export-pdf']")?.addEventListener("click", () => exportSimulationPdf(getPdfState));
  document.querySelector("[data-action='save-simulation']")?.addEventListener("click", saveCurrentSimulation);
  document.querySelector("[data-action='share-simulation']")?.addEventListener("click", shareCurrentSimulation);
  document.querySelector("[data-action='send-whatsapp']")?.addEventListener("click", sendCurrentSimulationWhatsApp);
  document.querySelector("[data-history-search]")?.addEventListener("input", renderHistory);
  loadSharedSimulation();
  updateBrokerChrome();
  renderAll();
});

window.addEventListener("load", renderAll);

function setupForms() {
  document.querySelector("[data-amortization-form]")?.addEventListener("input", syncFinancedValue);
  document.querySelector("[data-amortization-form]")?.addEventListener("input", renderAll);
  document.querySelector("[data-rent-form]")?.addEventListener("input", renderRent);
  document.querySelector("[data-entry-form]")?.addEventListener("input", renderEntry);
  document.querySelector("[data-income-form]")?.addEventListener("input", renderIncome);
}

function syncFinancedValue(event) {
  const form = event.currentTarget;
  if (event.target.name === "valorImovel" || event.target.name === "entrada") {
    const property = parseNumber(form.valorImovel.value);
    const downPayment = parseNumber(form.entrada.value);
    form.valorFinanciado.value = Math.max(0, property - downPayment).toFixed(2);
  }
  if (event.target.name === "taxaAnual") {
    form.taxaMensal.value = formatNumber(annualToMonthlyRate(parseNumber(form.taxaAnual.value)) * 100, 4);
  }
}

function readAmortizationInput() {
  const form = document.querySelector("[data-amortization-form]");
  const input = {
    cliente: form.cliente.value,
    valorImovel: parseNumber(form.valorImovel.value),
    entrada: parseNumber(form.entrada.value),
    valorFinanciado: parseNumber(form.valorFinanciado.value),
    taxaAnual: parseNumber(form.taxaAnual.value),
    prazo: Math.max(0, Number.parseInt(form.prazo.value, 10) || 0),
    sistema: form.sistema.value,
    objetivoAmortizacao: form.objetivoAmortizacao.value,
  };
  form.taxaMensal.value = formatNumber(annualToMonthlyRate(input.taxaAnual) * 100, 4);
  return input;
}

function renderAll() {
  state.input = readAmortizationInput();
  const result = calculateAmortization(state.input, state.schedules);
  state.rows = result.rows;
  state.originalRows = result.originalRows;
  state.stats = result.stats;
  renderSummary();
  renderStats();
  renderTable();
  renderBalanceChart(state.originalRows, state.rows);
  updateFgtsStatus();
  renderRent();
  renderEntry();
  renderIncome();
  renderHistory();
}

function renderSummary() {
  const items = [
    ["Valor financiado", formatCurrency(state.stats.valorFinanciado), true],
    ["Taxa anual", `${formatNumber(state.stats.taxaAnual, 2)}%`, false],
    ["Taxa mensal", formatPercentValue(state.stats.taxaMensal), false],
    ["Prazo", `${state.stats.prazo} meses`, false],
    ["Sistema escolhido", state.stats.sistema, false],
    ["Juros totais", formatCurrency(state.stats.jurosTotais), false],
    ["Total pago", formatCurrency(state.stats.totalPago), true],
    ["Saldo atual", formatCurrency(state.stats.saldoAtual), false],
    ["Prazo restante", `${state.stats.prazoRestante} meses`, false],
    ["Total amortizado", formatCurrency(state.stats.totalAmortizado), true],
    ["Economia em juros", formatCurrency(state.stats.economiaJuros), true],
    ["Economia percentual", new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2 }).format(state.stats.economiaPercentual), false],
    ["Economia total", formatCurrency(state.stats.economiaTotal), true],
    ["Parcelas eliminadas", `${state.stats.parcelasEliminadas}`, false],
  ];
  state.summaryRows = items.map(([label, value]) => ({ label, value }));
  document.querySelector("[data-summary-grid]").innerHTML = items.map(([label, value, highlight]) => `
    <article class="metric-card ${highlight ? "is-highlight" : ""}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
  document.querySelectorAll("[data-summary='totalPago']").forEach((node) => {
    node.textContent = formatCurrency(state.stats.totalPago);
  });
}

function renderStats() {
  const rows = [
    ["Total amortizado", formatCurrency(state.stats.totalAmortizado)],
    ["FGTS utilizado", formatCurrency(state.stats.fgtsUtilizado)],
    ["Aportes utilizados", formatCurrency(state.stats.aportesUtilizados)],
    ["Economia em juros", formatCurrency(state.stats.economiaJuros)],
    ["Novo prazo", `${state.stats.novoPrazo} meses`],
    ["Parcelas eliminadas", state.stats.parcelasEliminadas],
    ["Economia percentual", new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2 }).format(state.stats.economiaPercentual)],
    ["Valor total pago", formatCurrency(state.stats.valorTotalPago)],
  ];
  document.querySelector("[data-stats-list]").innerHTML = rows.map(([label, value]) => `
    <div class="stat-row"><span>${label}</span><strong>${value}</strong></div>
  `).join("");
}

function renderTable() {
  const body = document.querySelector("[data-amortization-body]");
  body.innerHTML = state.rows.map((row) => `
    <tr>
      <td>${row.month}</td>
      <td>${row.remaining}</td>
      <td>${formatCurrency(row.openingBalance)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balanceWithInterest)}</td>
      <td>${formatCurrency(row.amortization)}</td>
      <td>${formatCurrency(row.installment)}</td>
      <td>${formatCurrency(row.closingBalance)}</td>
      <td><input data-inline-contribution="manual" data-month="${row.month}" value="${row.manualContribution ? formatNumber(row.manualContribution, 2) : ""}" aria-label="Aporte manual mês ${row.month}"></td>
      <td><input data-inline-contribution="fgts" data-month="${row.month}" value="${row.fgtsContribution ? formatNumber(row.fgtsContribution, 2) : ""}" aria-label="FGTS mês ${row.month}"></td>
      <td>${formatCurrency(row.correctedBalance)}</td>
      <td>${formatCurrency(row.correctedPayment)}</td>
      <td>${formatCurrency(row.newBalance)}</td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-inline-contribution]").forEach((input) => {
    input.addEventListener("change", () => {
      const map = state.schedules[input.dataset.inlineContribution];
      const month = Number(input.dataset.month);
      const value = parseNumber(input.value);
      if (value > 0) map.set(month, value);
      else map.delete(month);
      renderAll();
    });
  });
}

function applySchedule(kind, config) {
  const map = kind === "fgts" ? createFgtsMap(config) : createContributionMap(config);
  state.schedules[kind] = map;
  renderAll();
}

function clearSchedule(kind) {
  state.schedules[kind] = new Map();
  renderAll();
}

function updateFgtsStatus() {
  const status = document.querySelector("[data-fgts-status]");
  const active = state.schedules.fgts.size > 0;
  status.textContent = active ? `FGTS ativo: ${state.schedules.fgts.size} lançamentos` : "FGTS inativo";
  status.classList.toggle("is-active", active);
}

function renderRent() {
  const form = document.querySelector("[data-rent-form]");
  if (!form) return;
  const input = {
    valorImovel: parseNumber(form.valorImovel.value),
    entrada: parseNumber(form.entrada.value),
    valorFinanciado: parseNumber(form.valorFinanciado.value),
    prazo: Number.parseInt(form.prazo.value, 10) || 0,
    taxaAnual: parseNumber(form.taxaAnual.value),
    aluguelInicial: parseNumber(form.aluguelInicial.value),
    reajusteAnual: parseNumber(form.reajusteAnual.value),
    valorizacaoAnual: parseNumber(form.valorizacaoAnual.value),
    horizonte: Number.parseInt(form.horizonte.value, 10) || 0,
  };
  const result = compareRentVsFinancing(input);
  document.querySelector("[data-rent-summary]").innerHTML = [
    ["Aluguel ultrapassa parcela", result.summary.aluguelUltrapassaParcela ? `${result.summary.aluguelUltrapassaParcela}º mês` : "Não ultrapassa"],
    ["Total gasto alugando", formatCurrency(result.summary.totalAlugando)],
    ["Valor total comprado", formatCurrency(result.summary.totalComprado)],
    ["Patrimônio acumulado", formatCurrency(result.summary.patrimonioAcumulado)],
    ["Valorização do imóvel", formatCurrency(result.summary.valorizacaoImovel)],
    ["Comparativo financeiro", formatCurrency(result.summary.comparativoFinanceiro)],
  ].map(([label, value]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`).join("");
  renderRentChart(result.rows);
}

function renderEntry() {
  const form = document.querySelector("[data-entry-form]");
  if (!form) return;
  const result = calculateEntryPlan({
    valorImovel: parseNumber(form.valorImovel.value),
    valorFinanciado: parseNumber(form.valorFinanciado.value),
    sinal: parseNumber(form.sinal.value),
    fgts: parseNumber(form.fgts.value),
    recursosProprios: parseNumber(form.recursosProprios.value),
    subsidio: parseNumber(form.subsidio.value),
    despesasExtras: parseNumber(form.despesasExtras.value),
    itbi: parseNumber(form.itbi.value),
    registro: parseNumber(form.registro.value),
    escritura: parseNumber(form.escritura.value),
    administrativo: parseNumber(form.administrativo.value),
  });

  document.querySelector("[data-entry-summary]").innerHTML = [
    ["Entrada total", formatCurrency(result.requiredEntry), true],
    ["FGTS", formatCurrency(result.fgts), false],
    ["Recursos próprios", formatCurrency(result.ownResources), false],
    ["Subsídio", formatCurrency(result.subsidy), false],
    ["Despesas extras", formatCurrency(result.extraExpenses), false],
    ["Falta para completar", formatCurrency(result.missing), true],
  ].map(([label, value, highlight]) => `
    <article class="metric-card ${highlight ? "is-highlight" : ""}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");

  const alerts = [
    result.isEntryInsufficient
      ? ["Entrada insuficiente", `Ainda faltam ${formatCurrency(result.missing)} para completar entrada e despesas.`, "is-danger"]
      : ["Entrada suficiente", "A composição informada cobre a entrada e despesas estimadas.", "is-success"],
    result.isFinancingHigh
      ? ["Financiamento alto", "O financiamento supera 80% do valor do imóvel. Pode exigir atenção na análise.", "is-warning"]
      : ["Percentual financiado", `${formatNumber(result.financedPercent * 100, 2)}% do imóvel financiado.`, ""],
    ["Recursos próprios necessários", formatCurrency(result.ownResourcesNeeded), ""],
    ["Percentual de entrada", `${formatNumber(result.entryPercent * 100, 2)}%`, ""],
  ];
  document.querySelector("[data-entry-alerts]").innerHTML = alerts.map(([title, text, tone]) => `
    <div class="stat-row"><span>${title}</span><strong class="alert-note ${tone}">${text}</strong></div>
  `).join("");
  renderEntryChart(result);
}

function renderIncome() {
  const form = document.querySelector("[data-income-form]");
  if (!form) return;
  if ((form.valorImovel.value || form.entrada.value) && !form.valorFinanciado.value) {
    form.valorFinanciado.value = Math.max(0, parseNumber(form.valorImovel.value) - parseNumber(form.entrada.value)).toFixed(2);
  }
  const result = calculateIncomeCapacity({
    valorImovel: parseNumber(form.valorImovel.value),
    entrada: parseNumber(form.entrada.value),
    valorFinanciado: parseNumber(form.valorFinanciado.value),
    taxaAnual: parseNumber(form.taxaAnual.value),
    prazo: Number.parseInt(form.prazo.value, 10) || 0,
    sistema: form.sistema.value,
    comprometimento: parseNumber(form.comprometimento.value),
    rendaFamiliar: parseNumber(form.rendaFamiliar.value),
    outrasParcelas: parseNumber(form.outrasParcelas.value),
  });
  const statusLabel = result.status;
  document.querySelector("[data-income-summary]").innerHTML = [
    ["Parcela estimada", formatCurrency(result.installment), true],
    ["Renda mínima necessária", formatCurrency(result.minimumIncome), true],
    ["Renda informada", formatCurrency(result.familyIncome), false],
    ["Margem disponível", formatCurrency(result.availableMargin), false],
    ["Capacidade estimada", formatCurrency(result.capacity), false],
    ["Status", statusLabel, true],
    ["Comprometimento atual", `${formatNumber(result.currentCommitment * 100, 2)}%`, false],
    ["Renda a aumentar", formatCurrency(result.incomeIncreaseNeeded), false],
    ["Valor máximo de imóvel", formatCurrency(result.maxPropertyValue), false],
  ].map(([label, value, highlight]) => `
    <article class="metric-card ${highlight ? "is-highlight" : ""}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function getPdfState() {
  return {
    input: state.input,
    rows: state.rows,
    summaryRows: state.summaryRows,
    formatCurrency,
    settings: state.settings,
    stats: state.stats,
  };
}

function setupSettings() {
  const form = document.querySelector("[data-settings-form]");
  if (!form) return;
  fillSettingsForm(form, state.settings);
  renderSettingsPreview();

  form.logoFile?.addEventListener("change", async () => {
    const file = form.logoFile.files?.[0];
    if (!file) return;
    const logo = await fileToBase64(file);
    state.settings = { ...state.settings, logo };
    renderSettingsPreview();
  });

  document.querySelector("[data-settings-save]")?.addEventListener("click", () => {
    state.settings = saveSettings({
      brokerName: form.brokerName.value.trim(),
      creci: form.creci.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      company: form.company.value.trim(),
      city: form.city.value.trim(),
      logo: state.settings.logo || "",
    });
    updateBrokerChrome();
    renderSettingsPreview();
    toast("Configurações salvas.");
  });

  document.querySelector("[data-settings-clear]")?.addEventListener("click", () => {
    if (!confirm("Limpar as configurações salvas?")) return;
    state.settings = clearSettings();
    fillSettingsForm(form, state.settings);
    updateBrokerChrome();
    renderSettingsPreview();
    toast("Configurações limpas.");
  });
}

function setupGlossary() {
  const search = document.querySelector("[data-glossary-search]");
  if (!search) return;
  search.addEventListener("input", () => renderGlossary(search.value));
  renderGlossary("");
}

function renderGlossary(query) {
  const list = document.querySelector("[data-glossary-list]");
  if (!list) return;
  const normalized = String(query || "").toLowerCase();
  const items = glossaryItems().filter((item) => {
    return [item.term, item.category, item.text].join(" ").toLowerCase().includes(normalized);
  });
  list.innerHTML = items.map((item) => `
    <article class="glossary-card">
      <small>${item.category}</small>
      <h3>${item.term}</h3>
      <p>${item.text}</p>
    </article>
  `).join("");
}

function saveCurrentSimulation() {
  const saved = saveSimulation({
    id: state.currentSimulationId,
    type: "amortizacao",
    clientName: state.input.cliente || "Cliente sem nome",
    input: state.input,
    schedules: {
      manual: [...state.schedules.manual.entries()],
      fgts: [...state.schedules.fgts.entries()],
    },
    summary: state.stats,
  });
  state.currentSimulationId = saved.id;
  renderHistory();
  toast("Simulação salva no histórico.");
}

function renderHistory() {
  const container = document.querySelector(".simulation-list");
  if (!container) return;
  const query = document.querySelector("[data-history-search]")?.value?.toLowerCase() || "";
  const simulations = listSimulations()
    .filter((simulation) => (simulation.clientName || "").toLowerCase().includes(query))
    .slice(0, 6);
  if (!simulations.length) {
    container.innerHTML = `<div><strong>Nenhuma simulação salva</strong><span>Crie uma nova planilha para iniciar o atendimento.</span></div>`;
    return;
  }
  container.innerHTML = simulations.map((simulation) => `
    <div data-simulation-id="${simulation.id}">
      <strong>${simulation.clientName || "Cliente sem nome"}</strong>
      <span>${simulation.type} · ${formatCurrency(simulation.input?.valorFinanciado || 0)}</span>
      <span>Criada: ${formatDateTime(simulation.createdAt)} · Última edição: ${formatDateTime(simulation.updatedAt)}</span>
      <span class="simulation-actions">
        <button type="button" data-history-open="${simulation.id}">Abrir</button>
        <button type="button" data-history-duplicate="${simulation.id}">Duplicar</button>
        <button type="button" data-history-delete="${simulation.id}">Excluir</button>
      </span>
    </div>
  `).join("");
  container.querySelectorAll("[data-history-open]").forEach((button) => {
    button.addEventListener("click", () => openSavedSimulation(button.dataset.historyOpen));
  });
  container.querySelectorAll("[data-history-duplicate]").forEach((button) => {
    button.addEventListener("click", () => {
      duplicateSimulation(button.dataset.historyDuplicate);
      renderHistory();
      toast("Simulação duplicada.");
    });
  });
  container.querySelectorAll("[data-history-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!confirm("Excluir esta simulação?")) return;
      deleteSimulation(button.dataset.historyDelete);
      renderHistory();
      toast("Simulação excluída.");
    });
  });
}

function openSavedSimulation(id) {
  const simulation = findSimulation(id);
  if (!simulation) return;
  fillAmortizationForm(simulation.input || {});
  state.schedules.manual = new Map(simulation.schedules?.manual || []);
  state.schedules.fgts = new Map(simulation.schedules?.fgts || []);
  state.currentSimulationId = simulation.id;
  history.replaceState(null, "", "#amortizacao");
  document.querySelector('[data-route="amortizacao"]')?.click();
  renderAll();
  toast("Simulação carregada.");
}

function shareCurrentSimulation() {
  const url = buildShareUrl(state.input);
  navigator.clipboard?.writeText(url);
  toast("Link compartilhável copiado.");
}

function loadSharedSimulation() {
  const shared = parseSharedSimulation();
  if (!shared) return;
  fillAmortizationForm(shared);
  history.replaceState(null, "", `${location.pathname}${location.search}#amortizacao`);
  setTimeout(() => toast("Simulação carregada por link compartilhado."), 300);
}

function sendCurrentSimulationWhatsApp() {
  const url = buildWhatsAppUrl({
    input: state.input,
    stats: state.stats,
    settings: state.settings,
    formatCurrency,
  });
  window.open(url, "_blank", "noopener,noreferrer");
}

function fillAmortizationForm(input) {
  const form = document.querySelector("[data-amortization-form]");
  if (!form) return;
  Object.entries({
    cliente: input.cliente || "",
    valorImovel: input.valorImovel || "",
    entrada: input.entrada || "",
    valorFinanciado: input.valorFinanciado || "",
    taxaAnual: input.taxaAnual || "",
    prazo: input.prazo || "",
    sistema: input.sistema || "SAC",
    objetivoAmortizacao: input.objetivoAmortizacao || "prazo",
  }).forEach(([key, value]) => {
    if (form[key]) form[key].value = value;
  });
}

function fillSettingsForm(form, settings) {
  ["brokerName", "creci", "whatsapp", "company", "city"].forEach((field) => {
    if (form[field]) form[field].value = settings[field] || "";
  });
}

function renderSettingsPreview() {
  const preview = document.querySelector("[data-settings-preview]");
  if (!preview) return;
  preview.innerHTML = `
    ${state.settings.logo ? `<img src="${state.settings.logo}" alt="Logo do corretor">` : ""}
    <div>
      <strong>${state.settings.brokerName || "Nome do corretor"}</strong>
      <span>${state.settings.company || "Empresa"}</span><br>
      <span>${state.settings.creci ? `CRECI ${state.settings.creci}` : "CRECI não informado"}</span><br>
      <span>${state.settings.whatsapp || "WhatsApp não informado"}</span><br>
      <span>${state.settings.city || "Cidade não informada"}</span>
    </div>
  `;
}

function updateBrokerChrome() {
  const pill = document.querySelector(".broker-pill span:last-child");
  if (pill) pill.textContent = state.settings.brokerName || "Bruno dos Imóveis";
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDateTime(value) {
  if (!value) return "sem data";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 3200);
}

function glossaryItems() {
  return [
    ["Conceitos básicos", "Financiamento imobiliário", "É um empréstimo usado para comprar um imóvel. O banco paga parte do valor ao vendedor e o cliente devolve ao banco em parcelas."],
    ["Valores", "Valor do imóvel", "É o preço total do imóvel negociado ou avaliado."],
    ["Valores", "Valor financiado", "É a parte do preço que será paga pelo banco e parcelada pelo cliente."],
    ["Valores", "Entrada", "É o valor pago com recursos do cliente antes ou durante a contratação do financiamento."],
    ["Programas", "Subsídio", "É um desconto ou auxílio concedido em alguns programas habitacionais para reduzir o valor que o cliente precisa pagar."],
    ["Recursos", "FGTS", "Saldo do Fundo de Garantia que pode ser usado na compra ou amortização, quando o cliente cumpre as regras."],
    ["Sistemas", "SAC", "Sistema em que a amortização é constante. A primeira parcela costuma ser maior e as parcelas diminuem com o tempo."],
    ["Sistemas", "PRICE", "Sistema com parcela mais estável. No início, paga-se mais juros e menos amortização."],
    ["Amortização", "Amortização", "É a parte da parcela ou de um aporte que reduz diretamente a dívida com o banco."],
    ["Amortização", "Saldo devedor", "É quanto ainda falta pagar do financiamento."],
    ["Taxas", "Juros", "É o custo cobrado pelo banco pelo dinheiro financiado."],
    ["Taxas", "Taxa anual", "É a taxa de juros apresentada ao ano."],
    ["Taxas", "Taxa mensal", "É a taxa equivalente usada para calcular os juros de cada mês."],
    ["Contrato", "Prazo", "Quantidade de meses para pagar o financiamento."],
    ["Contrato", "Parcela", "Valor mensal pago ao banco. Geralmente inclui amortização e juros."],
    ["Renda", "Comprometimento de renda", "Percentual da renda familiar que ficará comprometido com parcelas e dívidas."],
    ["Renda", "Renda familiar", "Soma das rendas usadas na análise de crédito."],
    ["Despesas", "ITBI", "Imposto municipal pago na transferência do imóvel."],
    ["Despesas", "Registro", "Custo para registrar o imóvel em cartório em nome do comprador."],
    ["Despesas", "Escritura", "Documento ou contrato que formaliza a compra, quando aplicável."],
    ["Crédito", "Avaliação do imóvel", "Análise feita para confirmar o valor e as condições do imóvel."],
    ["Crédito", "Aprovação de crédito", "Decisão do banco sobre liberar ou não o financiamento ao cliente."],
    ["Simulação", "Simulação", "Estimativa inicial dos valores. Não garante aprovação nem condições finais."],
    ["Comparativo", "Financiamento x aluguel", "Comparação entre comprar financiado e continuar pagando aluguel ao longo do tempo."],
    ["Mercado", "Valorização do imóvel", "Estimativa de quanto o imóvel pode aumentar de valor ao longo dos anos."],
  ].map(([category, term, text]) => ({ category, term, text }));
}

function setupTheme() {
  const savedTheme = localStorage.getItem("imovel-toolkit-theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");
  document.body.dataset.theme = theme;

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = nextTheme;
    localStorage.setItem("imovel-toolkit-theme", nextTheme);
    renderIcons();
  });
}

function renderIcons() {
  const themeIcon = document.body.dataset.theme === "dark" ? "sun" : "moon";
  const icons = {
    dashboard: icon('<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>'),
    table: icon('<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/><path d="M7 6v12"/><path d="M17 6v12"/>'),
    compare: icon('<path d="m17 2 4 4-4 4"/><path d="M3 6h18"/><path d="m7 22-4-4 4-4"/><path d="M21 18H3"/>'),
    wallet: icon('<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5"/><path d="M18 12h.01"/>'),
    income: icon('<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>'),
    settings: icon('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
    book: icon('<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'),
    plus: icon('<path d="M5 12h14"/><path d="M12 5v14"/>'),
    shield: icon('<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/>'),
    download: icon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>'),
    save: icon('<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>'),
    link: icon('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
    message: icon('<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>'),
    menu: icon('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>'),
    x: icon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    user: icon('<path d="M19 21a7 7 0 0 0-14 0"/><circle cx="12" cy="7" r="4"/>'),
    moon: icon('<path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3z"/>'),
    sun: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
    sparkles: icon('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>'),
    calculator: icon('<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="8" y1="14" y2="14"/><line x1="12" x2="12" y1="14" y2="14"/><line x1="16" x2="16" y1="14" y2="14"/><line x1="8" x2="8" y1="18" y2="18"/><line x1="12" x2="12" y1="18" y2="18"/><line x1="16" x2="16" y1="18" y2="18"/>'),
    clock: icon('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  };
  document.querySelectorAll("[data-icon]").forEach((node) => {
    const key = node.dataset.icon === "moon" ? themeIcon : node.dataset.icon;
    node.innerHTML = icons[key] || "";
  });
}

function icon(content) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}
