import { calculateConstructionEvolution } from "../finance/construction.js";
import { formatCurrency, formatNumber, parseNumber, percent } from "../finance/formatter.js";

let constructionResult = calculateConstructionEvolution({});
let workInterestChart;
let inccChart;
let comparisonChart;

const LEGAL_NOTICE = "Esta simulação possui caráter estimativo. Os juros de obra, a correção pelo INCC e demais custos podem variar conforme o contrato, cronograma físico-financeiro da obra, instituição financeira e condições vigentes.";

export function setupConstructionTool() {
  const form = document.querySelector("[data-construction-form]");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderConstruction();
  });
  form.addEventListener("input", () => renderConstruction(false));
  renderConstruction(false);
}

export function getConstructionState() {
  return constructionResult;
}

export async function exportConstructionPdf({ settings = {} } = {}) {
  if (!window.jspdf || !window.html2canvas) {
    alert("Bibliotecas de PDF não carregadas. Use a impressão do navegador como alternativa.");
    window.print();
    return;
  }

  renderConstruction(false);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = 18;

  pdf.setTextColor(23, 27, 34);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text("Evolução de Obra", 14, y);
  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(109, 117, 132);
  pdf.text(brokerLine(settings), 14, y, { maxWidth: pageWidth - 28 });
  y += 12;

  y = pdfSection(pdf, "Resumo da simulação", y);
  summaryRows(constructionResult).forEach((item, index) => {
    const x = index % 2 === 0 ? 14 : 108;
    const rowY = y + Math.floor(index / 2) * 17;
    pdfMetric(pdf, item.label, item.value, x, rowY, 86);
  });
  y += 58;

  y = pdfSection(pdf, "Dados informados", y);
  inputRows(constructionResult).forEach((line) => {
    pdfLine(pdf, line, 14, y);
    y += 6;
  });
  y += 6;

  const chartPanel = document.querySelector("[data-construction-charts]");
  if (chartPanel) {
    y = ensurePdfSpace(pdf, y, 92, pageWidth, pageHeight);
    y = pdfSection(pdf, "Gráficos", y);
    const canvas = await html2canvas(chartPanel, { backgroundColor: "#ffffff", scale: 1.3 });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 14, y, pageWidth - 28, 78);
    y += 88;
  }

  y = ensurePdfSpace(pdf, y, 80, pageWidth, pageHeight);
  y = pdfSection(pdf, "Tabela comparativa", y);
  comparisonRows(constructionResult).forEach((line) => {
    pdfLine(pdf, line, 14, y);
    y += 6;
  });
  y += 8;

  y = pdfSection(pdf, "Conclusão", y);
  pdfParagraph(pdf, conclusionText(constructionResult), 14, y, pageWidth - 28);
  pdfFooter(pdf, pageWidth, pageHeight);
  pdf.save("evolucao-de-obra.pdf");
}

function renderConstruction(showToast = true) {
  const form = document.querySelector("[data-construction-form]");
  if (!form) return;
  constructionResult = calculateConstructionEvolution({
    propertyValue: parseNumber(form.valorImovel.value),
    financedValue: parseNumber(form.valorFinanciado.value),
    downPayment: parseNumber(form.entrada.value),
    workInterestAnnualRate: parseNumber(form.taxaJurosObra.value),
    inccAnnualRate: parseNumber(form.inccAnual.value),
    months: Number.parseInt(form.prazoObra.value, 10) || 0,
    expectedSaleValue: parseNumber(form.expectativaVenda.value),
  });
  renderConstructionSummary(constructionResult);
  renderConstructionComparison(constructionResult);
  renderConstructionSale(constructionResult);
  renderConstructionTable(constructionResult);
  renderConstructionCharts(constructionResult);
  if (showToast) toast("Evolução de obra simulada.");
}

function renderConstructionSummary(result) {
  const container = document.querySelector("[data-construction-summary]");
  if (!container) return;
  container.innerHTML = summaryRows(result).map(({ label, value, highlight }) => `
    <article class="metric-card ${highlight ? "is-highlight" : ""}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function renderConstructionComparison(result) {
  const container = document.querySelector("[data-construction-comparison]");
  if (!container) return;
  const best = result.comparison.bestScenario;
  container.innerHTML = `
    <div class="construction-winner">
      <span class="status-chip is-active">Menor custo: ${scenarioLabel(best)}</span>
      <strong>${formatCurrency(Math.min(result.comparison.workInterestCost, result.comparison.inccCost))}</strong>
    </div>
    <div class="stats-list">
      ${comparisonRows(result).map((line) => {
        const [label, value] = line.split(": ");
        return `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`;
      }).join("")}
    </div>
  `;
}

function renderConstructionSale(result) {
  const container = document.querySelector("[data-construction-sale]");
  if (!container) return;
  if (!result.sale) {
    container.innerHTML = `<p class="legal-note">Informe uma expectativa de venda para calcular lucro líquido, ROI e diferença de retorno.</p>`;
    return;
  }
  const best = result.sale.bestScenario;
  container.innerHTML = `
    <div class="construction-winner">
      <span class="status-chip is-active">Melhor retorno: ${scenarioLabel(best)}</span>
      <strong>${percent.format(Math.max(result.sale.workInterest.roi, result.sale.incc.roi))}</strong>
    </div>
    <div class="stats-list">
      <div class="stat-row"><span>Capital investido - Juros de obra</span><strong>${formatCurrency(result.sale.workInterest.capitalInvested)}</strong></div>
      <div class="stat-row"><span>Lucro líquido - Juros de obra</span><strong>${formatCurrency(result.sale.workInterest.netProfit)}</strong></div>
      <div class="stat-row"><span>ROI - Juros de obra</span><strong>${percent.format(result.sale.workInterest.roi)}</strong></div>
      <div class="stat-row"><span>Capital investido - INCC</span><strong>${formatCurrency(result.sale.incc.capitalInvested)}</strong></div>
      <div class="stat-row"><span>Lucro líquido - INCC</span><strong>${formatCurrency(result.sale.incc.netProfit)}</strong></div>
      <div class="stat-row"><span>ROI - INCC</span><strong>${percent.format(result.sale.incc.roi)}</strong></div>
      <div class="stat-row"><span>Diferença de retorno</span><strong>${percent.format(Math.abs(result.sale.roiDifference))}</strong></div>
    </div>
  `;
}

function renderConstructionTable(result) {
  const body = document.querySelector("[data-construction-body]");
  if (!body) return;
  const maxRows = Math.max(result.workInterest.rows.length, result.incc.rows.length);
  body.innerHTML = Array.from({ length: maxRows }, (_, index) => {
    const work = result.workInterest.rows[index] || {};
    const incc = result.incc.rows[index] || {};
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${formatCurrency(work.releasedBalance || 0)}</td>
        <td>${formatCurrency(work.interest || 0)}</td>
        <td>${formatCurrency(work.accumulatedInterest || 0)}</td>
        <td>${formatCurrency(incc.updatedBalance || result.input.financedValue)}</td>
        <td>${formatCurrency(incc.correctionAmount || 0)}</td>
      </tr>
    `;
  }).join("");
}

function renderConstructionCharts(result) {
  if (!window.Chart) return;
  workInterestChart = renderLineChart({
    chart: workInterestChart,
    canvas: document.getElementById("constructionInterestChart"),
    label: "Juros mensais",
    borderColor: "#C9A96A",
    rows: result.workInterest.rows,
    value: (row) => row.interest,
  });
  inccChart = renderLineChart({
    chart: inccChart,
    canvas: document.getElementById("constructionInccChart"),
    label: "Saldo corrigido",
    borderColor: "#1F5F68",
    rows: result.incc.rows,
    value: (row) => row.updatedBalance,
  });
  comparisonChart = renderComparisonChart(result);
}

function renderLineChart({ chart, canvas, label, borderColor, rows, value }) {
  if (!canvas) return chart;
  const data = {
    labels: rows.map((row) => row.month),
    datasets: [{ label, data: rows.map(value), borderColor, backgroundColor: `${borderColor}22`, tension: 0.42, pointRadius: 0 }],
  };
  const options = chartOptions();
  if (chart) {
    chart.data = data;
    chart.update();
    return chart;
  }
  return new Chart(canvas, { type: "line", data, options });
}

function renderComparisonChart(result) {
  const canvas = document.getElementById("constructionComparisonChart");
  if (!canvas) return comparisonChart;
  const data = {
    labels: ["Juros de obra", "Correção INCC"],
    datasets: [{
      label: "Custo do cenário",
      data: [result.comparison.workInterestCost, result.comparison.inccCost],
      backgroundColor: ["#C9A96A", "#1F5F68"],
      borderWidth: 0,
    }],
  };
  const options = chartOptions();
  if (comparisonChart) {
    comparisonChart.data = data;
    comparisonChart.update();
    return comparisonChart;
  }
  return new Chart(canvas, { type: "bar", data, options });
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { usePointStyle: true, color: "#6D7584", font: { family: "Inter", size: 12, weight: 600 } } },
      tooltip: {
        callbacks: {
          label(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: "#6D7584" } },
      y: {
        grid: { color: "rgba(109, 117, 132, 0.12)" },
        ticks: { color: "#6D7584", callback: (value) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value) },
      },
    },
  };
}

function summaryRows(result) {
  const best = result.comparison.bestScenario;
  const profit = result.sale ? Math.max(result.sale.workInterest.netProfit, result.sale.incc.netProfit) : 0;
  const roi = result.sale ? Math.max(result.sale.workInterest.roi, result.sale.incc.roi) : 0;
  return [
    { label: "Juros de obra", value: formatCurrency(result.workInterest.totalInterest), highlight: best === "jurosObra" },
    { label: "Correção INCC", value: formatCurrency(result.incc.correctionAmount), highlight: best === "incc" },
    { label: "Economia", value: formatCurrency(result.comparison.economy), highlight: true },
    { label: "Melhor cenário", value: scenarioLabel(best), highlight: true },
    { label: "Lucro esperado", value: result.sale ? formatCurrency(profit) : "Não informado", highlight: Boolean(result.sale) },
    { label: "ROI", value: result.sale ? percent.format(roi) : "Não informado", highlight: Boolean(result.sale) },
  ];
}

function inputRows(result) {
  return [
    `Valor do imóvel: ${formatCurrency(result.input.propertyValue)}`,
    `Valor financiado: ${formatCurrency(result.input.financedValue)}`,
    `Entrada: ${formatCurrency(result.input.downPayment)}`,
    `Taxa anual dos juros de obra: ${formatNumber(result.input.workInterestAnnualRate, 2)}%`,
    `INCC anual estimado: ${formatNumber(result.input.inccAnnualRate, 2)}%`,
    `Prazo da obra: ${result.input.months} meses`,
    `Expectativa de venda: ${result.input.expectedSaleValue ? formatCurrency(result.input.expectedSaleValue) : "Não informada"}`,
  ];
}

function comparisonRows(result) {
  return [
    `Valor do imóvel: ${formatCurrency(result.comparison.propertyValue)}`,
    `Valor financiado: ${formatCurrency(result.comparison.financedValue)}`,
    `Entrada: ${formatCurrency(result.comparison.downPayment)}`,
    `Juros do primeiro mês: ${formatCurrency(result.workInterest.firstMonthInterest)}`,
    `Juros do último mês: ${formatCurrency(result.workInterest.lastMonthInterest)}`,
    `Total pago em juros de obra: ${formatCurrency(result.comparison.workInterestCost)}`,
    `Parcela estimada após entrega: ${formatCurrency(result.workInterest.estimatedPostDeliveryInstallment)}`,
    `Saldo atualizado pelo INCC: ${formatCurrency(result.incc.updatedBalance)}`,
    `Total da correção pelo INCC: ${formatCurrency(result.comparison.inccCost)}`,
    `Diferença financeira: ${formatCurrency(result.comparison.difference)}`,
    `Economia: ${formatCurrency(result.comparison.economy)}`,
  ];
}

function conclusionText(result) {
  return `O cenário com menor custo estimado é ${scenarioLabel(result.comparison.bestScenario)}, com economia de ${formatCurrency(result.comparison.economy)} em relação ao outro cenário. ${LEGAL_NOTICE}`;
}

function scenarioLabel(value) {
  return value === "incc" ? "Correção INCC" : "Juros de obra";
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 3200);
}

function brokerLine(settings) {
  return [
    settings.brokerName || "Corretor não informado",
    settings.creci ? `CRECI ${settings.creci}` : "",
    settings.company || "",
    settings.city || "",
    settings.whatsapp ? `WhatsApp ${settings.whatsapp}` : "",
  ].filter(Boolean).join(" · ");
}

function pdfSection(pdf, text, y) {
  pdf.setTextColor(35, 39, 47);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(text, 14, y);
  return y + 7;
}

function pdfMetric(pdf, label, value, x, y, width) {
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(231, 234, 240);
  pdf.roundedRect(x, y, width, 13, 3, 3, "FD");
  pdf.setTextColor(109, 117, 132);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text(label, x + 4, y + 5);
  pdf.setTextColor(35, 39, 47);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(String(value), x + 4, y + 10);
}

function pdfLine(pdf, text, x, y) {
  pdf.setTextColor(109, 117, 132);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(text, x, y);
}

function pdfParagraph(pdf, text, x, y, width) {
  pdf.setTextColor(109, 117, 132);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(text, x, y, { maxWidth: width });
}

function pdfFooter(pdf, pageWidth, pageHeight) {
  pdf.setTextColor(109, 117, 132);
  pdf.setFontSize(8);
  pdf.text(LEGAL_NOTICE, 14, pageHeight - 18, { maxWidth: pageWidth - 28 });
}

function ensurePdfSpace(pdf, y, needed, pageWidth, pageHeight) {
  if (y + needed <= pageHeight - 26) return y;
  pdfFooter(pdf, pageWidth, pageHeight);
  pdf.addPage();
  return 18;
}
