export function formatCurrency(value) {
  if (value == null) return "U$S 0";

  return `U$S ${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}
