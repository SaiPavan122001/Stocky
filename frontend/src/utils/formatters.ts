/**
 * Format a number with specified decimal places (default 6 for stock quantities)
 */
export function formatQuantity(value: number, decimals: number = 6): string {
  return value.toFixed(decimals);
}

/**
 * Format currency in INR with proper symbol and formatting
 */
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Alias for formatINR for convenience
 */
export function formatCurrency(value: number): string {
  return formatINR(value);
}

/**
 * Format large numbers with K, L, Cr suffixes (Indian notation)
 */
export function formatCompactINR(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(2)} K`;
  }
  return formatINR(value);
}

/**
 * Alias for formatCompactINR for convenience
 */
export function formatCompactCurrency(value: number): string {
  return formatCompactINR(value);
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Alias for formatPercentage for convenience
 */
export function formatPercent(value: number): string {
  return formatPercentage(value);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}
