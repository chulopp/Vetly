/** Formatting helpers shared by the engine and the UI layer — pure and deterministic. */

/** Trims trailing zeros: 17.5 -> "17.5", 61.2 -> "61.2", 30 -> "30". */
export function trimNumber(value: number): string {
  return String(Number(value.toFixed(2)));
}

/** Formats a margin with an explicit sign: 17.58 -> "+17.58", -61.2 -> "-61.2", 0 -> "0". */
export function formatMargin(margin: number): string {
  const trimmed = trimNumber(margin);
  return margin > 0 ? `+${trimmed}` : trimmed;
}
