export async function exportSimulationPdf(getState) {
  if (!window.jspdf || !window.html2canvas) {
    alert("Bibliotecas de PDF não carregadas. Use a impressão do navegador como alternativa.");
    window.print();
    return;
  }

  const { jsPDF } = window.jspdf;
  const state = getState();
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const settings = state.settings || {};
  const legal = "Esta simulação possui caráter estimativo e não representa aprovação de crédito. Valores sujeitos à análise cadastral, renda, score, políticas da instituição financeira, taxas vigentes e aprovação do banco.";

  await coverPage(pdf, { pageWidth, pageHeight, settings, state, legal });
  pdf.addPage();

  header(pdf, settings, pageWidth);
  let y = 32;
  sectionTitle(pdf, "Resumo executivo", 14, y);
  y += 8;
  paragraph(pdf, `Cliente: ${state.input.cliente || "Não informado"}`, 14, y, pageWidth - 28);
  y += 8;
  paragraph(pdf, "Esta proposta reúne os principais números da simulação, incluindo valores financiados, prazo, sistema escolhido, economia estimada e projeção de amortizações.", 14, y, pageWidth - 28);
  y += 18;

  sectionTitle(pdf, "Resumo financeiro", 14, y);
  y += 8;
  state.summaryRows.slice(0, 10).forEach((item, index) => {
    const x = index % 2 === 0 ? 14 : 108;
    const rowY = y + Math.floor(index / 2) * 18;
    metric(pdf, item.label, item.value, x, rowY, 86);
  });
  y += 98;

  const chart = document.querySelector(".chart-panel");
  if (chart) {
    sectionTitle(pdf, "Gráfico da simulação", 14, y);
    y += 6;
    const canvas = await html2canvas(chart, { backgroundColor: "#ffffff", scale: 1.5 });
    const img = canvas.toDataURL("image/png");
    pdf.addImage(img, "PNG", 14, y, pageWidth - 28, 70);
    y += 82;
  }

  if (y > 230) {
    footer(pdf, legal, pageWidth, pageHeight);
    pdf.addPage();
    header(pdf, settings, pageWidth);
    y = 32;
  }

  sectionTitle(pdf, "Tabela resumida", 14, y);
  y += 8;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  state.rows.slice(0, 12).forEach((row) => {
    pdf.text(`${row.month} | Parcela ${state.formatCurrency(row.installment)} | Saldo ${state.formatCurrency(row.newBalance)}`, 14, y);
    y += 6;
  });

  y += 8;
  sectionTitle(pdf, "Próximos passos", 14, y);
  y += 8;
  [
    "1. Conferir documentação pessoal e comprovantes de renda.",
    "2. Validar regras da instituição financeira escolhida.",
    "3. Solicitar análise de crédito e avaliação do imóvel.",
  ].forEach((line) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(line, 14, y);
    y += 7;
  });

  y += 6;
  sectionTitle(pdf, "Contato do corretor", 14, y);
  y += 8;
  paragraph(pdf, brokerLine(settings), 14, y, pageWidth - 28);
  footer(pdf, legal, pageWidth, pageHeight);

  pdf.save(`simulacao-${slug(state.input.cliente || "cliente")}.pdf`);
}

async function coverPage(pdf, { pageWidth, pageHeight, settings, state, legal }) {
  pdf.setFillColor(23, 27, 34);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  if (settings.logo) {
    try {
      pdf.addImage(settings.logo, "PNG", 18, 18, 62, 28, undefined, "FAST");
    } catch {
      pdf.addImage(settings.logo, "JPEG", 18, 18, 62, 28, undefined, "FAST");
    }
  }
  pdf.setTextColor(201, 169, 106);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("IMÓVEL TOOLKIT", 18, 62);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(26);
  pdf.text("Proposta de simulação imobiliária", 18, 80, { maxWidth: pageWidth - 36 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text(`Cliente: ${state.input.cliente || "Não informado"}`, 18, 102);
  pdf.text(`Data: ${new Intl.DateTimeFormat("pt-BR").format(new Date())}`, 18, 112);
  pdf.text(brokerLine(settings), 18, 132, { maxWidth: pageWidth - 36 });
  pdf.setTextColor(210, 216, 226);
  pdf.setFontSize(9);
  pdf.text(legal, 18, pageHeight - 26, { maxWidth: pageWidth - 36 });
}

function header(pdf, settings, pageWidth) {
  pdf.setTextColor(35, 39, 47);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Imóvel Toolkit", 14, 16);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(brokerLine(settings), pageWidth - 14, 16, { align: "right", maxWidth: 110 });
  pdf.setDrawColor(231, 234, 240);
  pdf.line(14, 22, pageWidth - 14, 22);
}

function footer(pdf, legal, pageWidth, pageHeight) {
  pdf.setTextColor(109, 117, 132);
  pdf.setFontSize(8);
  pdf.text(legal, 14, pageHeight - 14, { maxWidth: pageWidth - 28 });
}

function sectionTitle(pdf, text, x, y) {
  pdf.setTextColor(35, 39, 47);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(text, x, y);
}

function paragraph(pdf, text, x, y, maxWidth) {
  pdf.setTextColor(109, 117, 132);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(text, x, y, { maxWidth });
}

function metric(pdf, label, value, x, y, width) {
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(231, 234, 240);
  pdf.roundedRect(x, y, width, 14, 3, 3, "FD");
  pdf.setTextColor(109, 117, 132);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text(label, x + 4, y + 5);
  pdf.setTextColor(35, 39, 47);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(String(value), x + 4, y + 11);
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

function slug(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
