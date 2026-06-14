export function toDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function isFuture(dateKey: string): boolean {
  return dateKey > toDateKey(new Date());
}

export function isToday(dateKey: string): boolean {
  return dateKey === toDateKey(new Date());
}

export function formatDisplayDate(dateKey: string): string {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}