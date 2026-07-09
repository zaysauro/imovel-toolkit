# Imovel Toolkit

Plataforma web estática para corretores de imóveis criarem simulações financeiras em reuniões com clientes.

O projeto roda 100% no navegador e foi estruturado para publicação direta no GitHub Pages, sem backend, banco de dados ou etapa de build.

## Recursos

- Dashboard com atalhos para módulos da plataforma.
- Planilha de amortização com SAC e PRICE.
- Fórmula PMT para parcelas PRICE.
- Cálculo SAC com amortização decrescente.
- Aportes manuais por periodicidade.
- FGTS com regra padrão de 24 meses e indicador visual.
- Tabela mês a mês com edição manual de aporte e FGTS.
- Resumo financeiro com juros, saldo, economia, novo prazo e parcelas eliminadas.
- Gráfico Chart.js para saldo original x saldo amortizado.
- Página Financiamento x Aluguel com gráfico comparativo.
- Calculadora de Entrada com composição de recursos, despesas e gráfico.
- Calculadora de Renda com renda mínima, capacidade e status estimado.
- Configurações do corretor com localStorage e upload de logo.
- Glossário com busca e explicações para clientes.
- Histórico real de simulações em localStorage.
- Link compartilhável e envio de resumo pelo WhatsApp.
- Exportação PDF profissional com dados do corretor, logo e aviso legal.
- Dependências de gráficos/PDF locais em `assets/vendor/`.
- Layout responsivo para desktop, notebook, tablet e celular.

## Tecnologias

- HTML5
- CSS3
- JavaScript ES6+
- Chart.js
- jsPDF
- html2canvas

## Estrutura

```text
imovel-toolkit/
  index.html
  assets/
    logo.svg
    header.png
    vendor/
  styles/
    main.css
    dashboard.css
    cards.css
    modal.css
    tables.css
    buttons.css
    print.css
  scripts/
    app.js
    finance/
      sac.js
      price.js
      amortizacao.js
      fgts.js
      aportes.js
      aluguel.js
      entrada.js
      renda.js
      formatter.js
      helpers.js
    ui/
      dashboard.js
      modals.js
      charts.js
      pdf.js
      sidebar.js
    utils/
      masks.js
      share.js
      storage.js
```

## Etapas de desenvolvimento

1. Arquitetura, identidade visual, dashboard, sidebar, páginas, cards, tabelas e modais.
2. Cálculos financeiros SAC e PRICE.
3. Aportes, FGTS, estatísticas e gráficos.
4. Financiamento x Aluguel.
5. Exportação PDF, JSON, WhatsApp e histórico local.

## Uso local

Por usar módulos ES6, rode com um servidor estático local:

```bash
python3 -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Testes financeiros

Abra a página abaixo no servidor local:

```text
http://localhost:8000/scripts/tests/run-finance-tests.html
```

Ela valida cenários conhecidos de SAC, PRICE, aportes, FGTS, redução de prazo, redução de parcela, Calculadora de Entrada, Calculadora de Renda, configurações, histórico e link compartilhável.

## GitHub Pages

Ative o GitHub Pages apontando para a branch `main` e a pasta raiz do repositório.

## Observação

As simulações são estimativas e não substituem as regras comerciais, tarifas, seguros, taxas administrativas ou políticas de crédito de cada instituição financeira.
