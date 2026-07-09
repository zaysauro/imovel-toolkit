const STORAGE_KEY = "imovel-toolkit-drawer-state";
const NOTEBOOK_QUERY = "(min-width: 901px) and (max-width: 1180px)";
const MOBILE_QUERY = "(max-width: 900px)";

export function setupDrawer() {
  const drawer = document.querySelector("[data-drawer]");
  if (!drawer) return;

  const collapseToggle = document.querySelector("[data-drawer-toggle]");
  const mobileToggle = document.querySelector("[data-mobile-drawer-toggle]");
  const overlay = document.querySelector("[data-drawer-overlay]");
  const notebookMedia = window.matchMedia(NOTEBOOK_QUERY);
  const mobileMedia = window.matchMedia(MOBILE_QUERY);

  function preferredState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "expanded" || saved === "collapsed") return saved;
    return notebookMedia.matches ? "collapsed" : "expanded";
  }

  function applyState(state) {
    const collapsed = state === "collapsed";
    document.body.classList.toggle("drawer-collapsed", collapsed);
    document.body.classList.toggle("drawer-expanded", !collapsed);
    collapseToggle?.setAttribute("aria-expanded", String(!collapsed));
    collapseToggle?.setAttribute("aria-label", collapsed ? "Expandir navegação" : "Minimizar navegação");
    collapseToggle?.querySelector("[data-icon]")?.setAttribute("data-icon", collapsed ? "chevron-right" : "chevron-left");
  }

  function setState(state, persist = true) {
    applyState(state);
    if (persist) localStorage.setItem(STORAGE_KEY, state);
    window.dispatchEvent(new CustomEvent("drawer:state-change"));
  }

  function setMobileOpen(open) {
    document.body.classList.toggle("drawer-mobile-open", open);
    mobileToggle?.setAttribute("aria-expanded", String(open));
    mobileToggle?.setAttribute("aria-label", open ? "Fechar navegação" : "Abrir navegação");
    if (overlay) overlay.hidden = !open;
  }

  function syncResponsiveDefault() {
    if (!localStorage.getItem(STORAGE_KEY)) applyState(preferredState());
    if (!mobileMedia.matches) setMobileOpen(false);
  }

  applyState(preferredState());
  setMobileOpen(false);

  collapseToggle?.addEventListener("click", () => {
    const next = document.body.classList.contains("drawer-collapsed") ? "expanded" : "collapsed";
    setState(next);
  });

  mobileToggle?.addEventListener("click", () => {
    setMobileOpen(!document.body.classList.contains("drawer-mobile-open"));
  });

  overlay?.addEventListener("click", () => setMobileOpen(false));

  drawer.querySelectorAll("[data-route]").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileMedia.matches) setMobileOpen(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMedia.matches) setMobileOpen(false);
  });

  notebookMedia.addEventListener("change", syncResponsiveDefault);
  mobileMedia.addEventListener("change", syncResponsiveDefault);
}
