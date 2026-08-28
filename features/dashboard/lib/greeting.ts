export function getDashboardGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** First token of a display name, with the leading letter capitalized. */
export function getGreetingFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/).find(Boolean) ?? "";
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1);
}
