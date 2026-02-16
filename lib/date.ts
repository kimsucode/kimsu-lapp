export function parisDayISO(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to build Europe/Paris day string");
  }

  return `${year}-${month}-${day}`;
}

export function formatFrenchDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatFrenchDay(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function excerpt(value: string | null, max = 160): string {
  if (!value) return "";
  const text = value.trim();
  if (text.length <= max) return text;

  const chunk = text.slice(0, max);
  const split = chunk.lastIndexOf(" ");
  if (split > 80) {
    return `${chunk.slice(0, split)}...`;
  }

  return `${chunk}...`;
}
