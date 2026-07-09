let balanceChart;
let rentChart;
let entryChart;

const baseOptions = {
  responsive: true,
  maintainAspectRatio: true,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        color: "#6D7584",
        font: { family: "Inter", size: 12, weight: 600 },
      },
    },
    tooltip: {
      callbacks: {
        label(context) {
          return `${context.dataset.label}: ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(context.parsed.y)}`;
        },
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: "#6D7584" } },
    y: {
      grid: { color: "rgba(109, 117, 132, 0.12)" },
      ticks: {
        color: "#6D7584",
        callback: (value) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value),
      },
    },
  },
};

export function renderBalanceChart(originalRows, rows) {
  const canvas = document.getElementById("balanceChart");
  if (!canvas) return;
  if (!window.Chart) return renderChartFallback(canvas);
  const labels = rows.map((row) => row.month);
  const data = {
    labels,
    datasets: [
      {
        label: "Saldo original",
        data: originalRows.slice(0, labels.length).map((row) => row.newBalance),
        borderColor: "#6D7584",
        backgroundColor: "rgba(109, 117, 132, 0.08)",
        tension: 0.42,
        pointRadius: 0,
      },
      {
        label: "Saldo após amortização",
        data: rows.map((row) => row.newBalance),
        borderColor: "#1F5F68",
        backgroundColor: "rgba(31, 95, 104, 0.12)",
        tension: 0.42,
        pointRadius: 0,
      },
    ],
  };
  if (balanceChart) {
    balanceChart.data = data;
    balanceChart.update();
    return;
  }
  balanceChart = new Chart(canvas, { type: "line", data, options: baseOptions });
}

export function renderRentChart(rows) {
  const canvas = document.getElementById("rentChart");
  if (!canvas) return;
  if (!window.Chart) return renderChartFallback(canvas);
  const data = {
    labels: rows.map((row) => row.month),
    datasets: [
      { label: "Aluguel", data: rows.map((row) => row.rent), borderColor: "#C9A96A", tension: 0.42, pointRadius: 0 },
      { label: "Parcela", data: rows.map((row) => row.installment), borderColor: "#1F5F68", tension: 0.42, pointRadius: 0 },
      { label: "Patrimônio", data: rows.map((row) => row.equity), borderColor: "#22C55E", tension: 0.42, pointRadius: 0 },
    ],
  };
  if (rentChart) {
    rentChart.data = data;
    rentChart.update();
    return;
  }
  rentChart = new Chart(canvas, { type: "line", data, options: baseOptions });
}

export function renderEntryChart(result) {
  const canvas = document.getElementById("entryChart");
  if (!canvas) return;
  if (!window.Chart) return renderChartFallback(canvas);
  const data = {
    labels: ["Sinal", "FGTS", "Recursos próprios", "Subsídio", "Falta"],
    datasets: [{
      data: [result.signal, result.fgts, result.ownResources, result.subsidy, result.missing],
      backgroundColor: ["#1F5F68", "#C9A96A", "#22C55E", "#6D7584", "#EF4444"],
      borderWidth: 0,
    }],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          color: "#6D7584",
          font: { family: "Inter", size: 12, weight: 600 },
        },
      },
      tooltip: baseOptions.plugins.tooltip,
    },
  };
  if (entryChart) {
    entryChart.data = data;
    entryChart.update();
    return;
  }
  entryChart = new Chart(canvas, { type: "doughnut", data, options });
}

function renderChartFallback(canvas) {
  const parent = canvas.parentElement;
  if (!parent || parent.querySelector("[data-chart-fallback]")) return;
  canvas.hidden = true;
  const fallback = document.createElement("p");
  fallback.dataset.chartFallback = "true";
  fallback.className = "legal-note";
  fallback.textContent = "Gráfico indisponível porque a biblioteca Chart.js não carregou.";
  parent.appendChild(fallback);
}
