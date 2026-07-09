const SETTINGS_KEY = "imovel-toolkit-settings";
const SIMULATIONS_KEY = "imovel-toolkit-simulations";

export function loadSettings(storage = localStorage) {
  return readJson(storage, SETTINGS_KEY, defaultSettings());
}

export function saveSettings(settings, storage = localStorage) {
  const next = { ...defaultSettings(), ...settings, updatedAt: new Date().toISOString() };
  storage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function clearSettings(storage = localStorage) {
  storage.removeItem(SETTINGS_KEY);
  return defaultSettings();
}

export function listSimulations(storage = localStorage) {
  return readJson(storage, SIMULATIONS_KEY, []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function saveSimulation(simulation, storage = localStorage) {
  const list = listSimulations(storage);
  const now = new Date().toISOString();
  const id = simulation.id || crypto.randomUUID?.() || `sim-${Date.now()}`;
  const existing = list.find((item) => item.id === id);
  const next = {
    ...simulation,
    id,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const filtered = list.filter((item) => item.id !== id);
  storage.setItem(SIMULATIONS_KEY, JSON.stringify([next, ...filtered]));
  return next;
}

export function duplicateSimulation(id, storage = localStorage) {
  const item = listSimulations(storage).find((simulation) => simulation.id === id);
  if (!item) return null;
  return saveSimulation({
    ...item,
    id: undefined,
    clientName: `${item.clientName || "Simulação"} (cópia)`,
  }, storage);
}

export function deleteSimulation(id, storage = localStorage) {
  const next = listSimulations(storage).filter((item) => item.id !== id);
  storage.setItem(SIMULATIONS_KEY, JSON.stringify(next));
  return next;
}

export function findSimulation(id, storage = localStorage) {
  return listSimulations(storage).find((item) => item.id === id) || null;
}

export function createMemoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function defaultSettings() {
  return {
    brokerName: "",
    creci: "",
    whatsapp: "",
    company: "",
    city: "",
    logo: "",
    updatedAt: "",
  };
}
