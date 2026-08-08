import { parseNumber } from "../finance/formatter.js";

export function setupModals({ onApply, onClear }) {
  document.querySelector("[data-action='open-aportes']")?.addEventListener("click", () => openModal("aportes"));
  document.querySelector("[data-action='open-fgts']")?.addEventListener("click", () => openModal("fgts"));

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal(button.closest("[data-modal]")));
  });

  document.querySelectorAll("[data-modal]").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeModal(backdrop);
    });
  });

  document.querySelectorAll("[data-schedule-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const applied = onApply(form.dataset.scheduleForm, {
        value: parseNumber(data.get("valor")),
        periodicity: Number.parseInt(data.get("periodicidade"), 10),
        firstMonth: Number.parseInt(data.get("primeiroMes"), 10),
        limitMonth: Number.parseInt(data.get("limiteMes"), 10),
      });
      if (applied !== false) closeModal(form.closest("[data-modal]"));
    });
  });

  document.querySelectorAll("[data-clear-schedule]").forEach((button) => {
    button.addEventListener("click", () => {
      const cleared = onClear(button.dataset.clearSchedule);
      if (cleared !== false) closeModal(button.closest("[data-modal]"));
    });
  });
}

function openModal(name) {
  document.querySelector(`[data-modal="${name}"]`)?.removeAttribute("hidden");
}

function closeModal(modal) {
  modal?.setAttribute("hidden", "");
}
