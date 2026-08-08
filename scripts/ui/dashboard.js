export const dashboardTools = [
  ["amortizacao", "table", "Planilha de Amortização", "SAC, PRICE, aportes manuais, FGTS e tabela completa."],
  ["aluguel", "compare", "Financiamento x Aluguel", "Compare aluguel, parcela, patrimônio e valorização."],
  ["entrada", "wallet", "Calculadora de Entrada", "Planeje composição da entrada e saldo a financiar."],
  ["construcao", "building", "Evolução de Obra", "Compare juros de obra, INCC, venda esperada e ROI."],
  ["hauer4you", "building", "Hauer4you", "Simulador Pride associativo com unidades, vagas e validações do empreendimento."],
  ["valorreal", "building", "ValorReal", "Simulador de parcelamento imobiliário com entrada, pós-chave e margem."],
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
  renderConstructionPage();
  renderIncomePage();
  renderSettingsPage();
  renderGlossaryPage();
}

function renderConstructionPage() {
  const page = document.querySelector('[data-page="construcao"]');
  if (!page) return;
  page.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="caption">Evolução de Obra</p>
          <h2>Juros de obra x correção INCC</h2>
        </div>
        <span class="icon panel-icon" data-icon="building"></span>
      </div>
      <form class="form-grid" data-construction-form>
        <label>Valor total do imóvel<input name="valorImovel" inputmode="decimal" placeholder="0,00"></label>
        <label>Valor financiado<input name="valorFinanciado" inputmode="decimal" placeholder="0,00"></label>
        <label>Entrada<input name="entrada" inputmode="decimal" placeholder="0,00"></label>
        <label>Taxa anual dos juros de obra (%)<input name="taxaJurosObra" inputmode="decimal" placeholder="0,00"></label>
        <label>INCC anual estimado (%)<input name="inccAnual" inputmode="decimal" placeholder="0,00"></label>
        <label>Prazo da obra (meses)<input name="prazoObra" inputmode="numeric" placeholder="0"></label>
        <label>Expectativa de venda após pronto<input name="expectativaVenda" inputmode="decimal" placeholder="Opcional"></label>
        <div class="form-action">
          <button class="button button-primary" type="submit">
            <span class="icon" data-icon="calculator"></span>
            Simular Evolução da Obra
          </button>
        </div>
      </form>
    </section>
    <section class="summary-grid" data-construction-summary></section>
    <section class="construction-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="caption">Comparação</p>
            <h2>Menor custo estimado</h2>
          </div>
        </div>
        <div data-construction-comparison></div>
      </article>
      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="caption">Expectativa de venda</p>
            <h2>Lucro líquido e ROI</h2>
          </div>
        </div>
        <div data-construction-sale></div>
      </article>
    </section>
    <section class="construction-charts" data-construction-charts>
      <article class="panel chart-panel">
        <div class="panel-header">
          <div>
            <p class="caption">Cenário 1</p>
            <h2>Evolução dos juros de obra</h2>
          </div>
        </div>
        <canvas id="constructionInterestChart" height="130"></canvas>
      </article>
      <article class="panel chart-panel">
        <div class="panel-header">
          <div>
            <p class="caption">Cenário 2</p>
            <h2>Evolução do INCC</h2>
          </div>
        </div>
        <canvas id="constructionInccChart" height="130"></canvas>
      </article>
      <article class="panel chart-panel">
        <div class="panel-header">
          <div>
            <p class="caption">Comparativo</p>
            <h2>Custo total por cenário</h2>
          </div>
        </div>
        <canvas id="constructionComparisonChart" height="130"></canvas>
      </article>
    </section>
    <section class="panel table-panel">
      <div class="panel-header">
        <div>
          <p class="caption">Evolução mensal</p>
          <h2>Tabela comparativa</h2>
        </div>
      </div>
      <div class="table-wrap">
        <table class="construction-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Saldo liberado</th>
              <th>Juros do mês</th>
              <th>Juros acumulados</th>
              <th>Saldo INCC</th>
              <th>Correção acumulada</th>
            </tr>
          </thead>
          <tbody data-construction-body></tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="caption">Aviso</p>
          <h2>Resultado estimativo</h2>
        </div>
      </div>
      <p class="legal-note">Esta simulação possui caráter estimativo. Os juros de obra, a correção pelo INCC e demais custos podem variar conforme o contrato, cronograma físico-financeiro da obra, instituição financeira e condições vigentes.</p>
    </section>
  `;
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
