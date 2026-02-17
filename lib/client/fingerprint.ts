const STORAGE_KEY = "quote_social_fingerprint";

function fallbackUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function createFingerprint(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return fallbackUuid();
}

export function getOrCreateFingerprint(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY)?.trim();
  if (existing) {
    return existing;
  }

  const created = createFingerprint();
  window.localStorage.setItem(STORAGE_KEY, created);
  return created;
}
