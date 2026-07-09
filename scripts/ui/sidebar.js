export function setupSidebar(onRoute) {
  const links = [...document.querySelectorAll("[data-route]")];
  const buttons = [...document.querySelectorAll("[data-route-button]")];
  const title = document.querySelector("[data-page-title]");
  const subtitle = document.querySelector("[data-page-subtitle]");

  function activate(route) {
    document.querySelectorAll("[data-page]").forEach((page) => {
      page.classList.toggle("is-active", page.dataset.page === route);
    });
    links.forEach((link) => link.classList.toggle("is-active", link.dataset.route === route));
    title.textContent = pageTitle(route);
    subtitle.textContent = pageSubtitle(route);
    document.body.classList.remove("sidebar-open");
    onRoute(route);
  }

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      history.replaceState(null, "", `#${link.dataset.route}`);
      activate(link.dataset.route);
    });
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const route = button.dataset.routeButton;
      history.replaceState(null, "", `#${route}`);
      activate(route);
    });
  });

  document.querySelector("[data-sidebar-toggle]")?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });

  activate(location.hash.replace("#", "") || "dashboard");
}

function pageTitle(route) {
  const titles = {
    dashboard: "Dashboard",
    amortizacao: "Planilha de Amortização",
    aluguel: "Financiamento x Aluguel",
    entrada: "Calculadora de Entrada",
    renda: "Calculadora de Renda",
    configuracoes: "Configurações",
    glossario: "Glossário",
  };
  return titles[route] || "Dashboard";
}

function pageSubtitle(route) {
  const subtitles = {
    dashboard: "Visão geral das ferramentas e atalhos de atendimento",
    amortizacao: "Simule SAC, PRICE, FGTS e aportes com precisão",
    aluguel: "Compare compra, aluguel, patrimônio e valorização",
    entrada: "Planejamento de entrada e composição de recursos",
    renda: "Estimativa de renda e capacidade de compra",
    configuracoes: "Preferências visuais e dados profissionais",
    glossario: "Termos imobiliários explicados para clientes",
  };
  return subtitles[route] || "Plataforma profissional para simulações imobiliárias";
}
