/**
 * Segmented risk bar with a position marker (0–30 LOW / 31–60 MEDIUM /
 * 61–100 HIGH). Purely presentational — used by both the live client-side
 * gauge and the server-rendered risk breakdown. The marker transitions so
 * the score visibly slides as values change (PRD §3.5.2).
 */
export function RiskBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  return (
    <div className="relative mt-4">
      <div className="flex h-2 overflow-hidden rounded-full">
        <div className="w-[30%] bg-accept/50" />
        <div className="w-[30%] bg-negotiate/50" />
        <div className="w-[40%] bg-reject/50" />
      </div>
      <div
        className="absolute -top-1 h-4 w-1 rounded-full bg-ink-100 shadow-[0_0_10px_rgba(255,255,255,0.6)] transition-all duration-500"
        style={{ left: `calc(${clamped}% - 2px)` }}
      />
    </div>
  );
}
