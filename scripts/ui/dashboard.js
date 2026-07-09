export const dashboardTools = [
  ["amortizacao", "table", "Planilha de Amortização", "SAC, PRICE, aportes manuais, FGTS e tabela completa."],
  ["aluguel", "compare", "Financiamento x Aluguel", "Compare aluguel, parcela, patrimônio e valorização."],
  ["entrada", "wallet", "Calculadora de Entrada", "Planeje composição da entrada e saldo a financiar."],
  ["renda", "income", "Calculadora de Renda", "Estime renda mínima para aprovação de crédito."],
  ["configuracoes", "settings", "Configurações", "Parâmetros padrão para atendimento e relatórios."],
  ["glossario", "book", "Glossário", "Termos financeiros explicados para clientes."],
];

export function renderDashboardCards() {
  const container = document.querySelector("[data-dashboard-cards]");
  if (!container) return;
  container.innerHTML = dashboardTools.map(([route, icon, title, text]) => `
    <button class="tool-card" type="button" data-route-button="${route}">
      <span class="icon-box"><span class="icon" data-icon="${icon}"></span></span>
      <h3>${title}</h3>
      <p>${text}</p>
    </button>
  `).join("");
}

export function renderUtilityPages() {
  renderEntryPage();
  renderIncomePage();
  renderSettingsPage();
  renderGlossaryPage();
}

function renderEntryPage() {
  const page = document.querySelector('[data-page="entrada"]');
  if (!page) return;
  page.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="caption">Calculadora de Entrada</p>
          <h2>Composição da entrada e despesas</h2>
        </div>
        <span class="icon panel-icon" data-icon="wallet"></span>
      </div>
      <form class="form-grid" data-entry-form>
        <label>Valor do imóvel<input name="valorImovel" inputmode="decimal" placeholder="0,00"></label>
        <label>Valor financiado<input name="valorFinanciado" inputmode="decimal" placeholder="0,00"></label>
        <label>Sinal/reserva<input name="sinal" inputmode="decimal" placeholder="0,00"></label>
        <label>FGTS disponível<input name="fgts" inputmode="decimal" placeholder="0,00"></label>
        <label>Recursos próprios<input name="recursosProprios" inputmode="decimal" placeholder="0,00"></label>
        <label>Subsídio estimado<input name="subsidio" inputmode="decimal" placeholder="0,00"></label>
        <label>Despesas extras<input name="despesasExtras" inputmode="decimal" placeholder="0,00"></label>
        <label>ITBI estimado<input name="itbi" inputmode="decimal" placeholder="0,00"></label>
        <label>Registro estimado<input name="registro" inputmode="decimal" placeholder="0,00"></label>
        <label>Escritura/contrato<input name="escritura" inputmode="decimal" placeholder="0,00"></label>
        <label>Comissão/administrativo<input name="administrativo" inputmode="decimal" placeholder="0,00"></label>
      </form>
    </section>
    <section class="summary-grid" data-entry-summary></section>
    <section class="analytics-grid">
      <article class="panel chart-panel">
        <div class="panel-header">
          <div>
            <p class="caption">Composição</p>
            <h2>Origem dos recursos</h2>
          </div>
        </div>
        <canvas id="entryChart" height="130"></canvas>
      </article>
      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="caption">Diagnóstico</p>
            <h2>Status da entrada</h2>
          </div>
        </div>
        <div class="stats-list" data-entry-alerts></div>
      </article>
    </section>
  `;
}

function renderIncomePage() {
  const page = document.querySelector('[data-page="renda"]');
  if (!page) return;
  page.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="caption">Calculadora de Renda</p>
          <h2>Capacidade de compra estimada</h2>
        </div>
        <span class="icon panel-icon" data-icon="income"></span>
      </div>
      <form class="form-grid" data-income-form>
        <label>Valor do imóvel<input name="valorImovel" inputmode="decimal" placeholder="0,00"></label>
        <label>Entrada<input name="entrada" inputmode="decimal" placeholder="0,00"></label>
        <label>Valor financiado<input name="valorFinanciado" inputmode="decimal" placeholder="0,00"></label>
        <label>Taxa anual (%)<input name="taxaAnual" inputmode="decimal" placeholder="0,00"></label>
        <label>Prazo<input name="prazo" inputmode="numeric" placeholder="0"></label>
        <label>Sistema<select name="sistema"><option value="SAC">SAC</option><option value="PRICE">PRICE</option></select></label>
        <label>Comprometimento máximo (%)<input name="comprometimento" inputmode="decimal" placeholder="30"></label>
        <label>Renda familiar mensal<input name="rendaFamiliar" inputmode="decimal" placeholder="0,00"></label>
        <label>Outras parcelas mensais<input name="outrasParcelas" inputmode="decimal" placeholder="0,00"></label>
      </form>
    </section>
    <section class="summary-grid" data-income-summary></section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="caption">Aviso</p>
          <h2>Resultado estimativo</h2>
        </div>
      </div>
      <p class="legal-note">Esta é uma estimativa e não representa aprovação de crédito.</p>
    </section>
  `;
}

function renderSettingsPage() {
  const page = document.querySelector('[data-page="configuracoes"]');
  if (!page) return;
  page.innerHTML = `
    <section class="settings-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="caption">Configurações</p>
            <h2>Dados do corretor</h2>
          </div>
          <span class="icon panel-icon" data-icon="settings"></span>
        </div>
        <form class="form-grid settings-form" data-settings-form>
          <label>Nome do corretor<input name="brokerName" placeholder="Seu nome"></label>
          <label>CRECI<input name="creci" placeholder="CRECI"></label>
          <label>WhatsApp<input name="whatsapp" placeholder="(00) 00000-0000"></label>
          <label>Empresa<input name="company" placeholder="Nome da empresa"></label>
          <label>Cidade<input name="city" placeholder="Cidade/UF"></label>
          <label>Logo<input name="logoFile" type="file" accept="image/*"></label>
        </form>
        <div class="modal-actions">
          <button class="button button-danger" type="button" data-settings-clear>Limpar</button>
          <button class="button button-primary" type="button" data-settings-save>Salvar configurações</button>
        </div>
      </article>
      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="caption">Pré-visualização</p>
            <h2>Assinatura comercial</h2>
          </div>
        </div>
        <div class="broker-preview" data-settings-preview></div>
      </article>
    </section>
  `;
}

function renderGlossaryPage() {
  const page = document.querySelector('[data-page="glossario"]');
  if (!page) return;
  page.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="caption">Glossário</p>
          <h2>Termos explicados para clientes</h2>
        </div>
        <span class="icon panel-icon" data-icon="book"></span>
      </div>
      <input data-glossary-search placeholder="Buscar termo, exemplo: SAC, FGTS, ITBI">
    </section>
    <section class="glossary-grid" data-glossary-list></section>
  `;
}
