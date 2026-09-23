export function progressPercent(done: number, total: number): number {
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return 0;
  const clamped = Math.min(Math.max(done, 0), total);
  return Math.round((clamped / total) * 100);
}

export function weightedProjectProgress(phases: { progress: number; weight?: number }[]): number {
  if (phases.length === 0) return 0;
  let weightSum = 0;
  let acc = 0;
  for (const p of phases) {
    const w = p.weight ?? 1;
    weightSum += w;
    acc += p.progress * w;
  }
  if (weightSum <= 0) return 0;
  return Math.round(acc / weightSum);
}
