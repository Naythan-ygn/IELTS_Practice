export const bandThresholds = {
  Listening: [
    [39, 9],
    [37, 8.5],
    [35, 8],
    [32, 7.5],
    [30, 7],
    [26, 6.5],
    [23, 6],
    [18, 5.5],
    [16, 5],
    [13, 4.5],
    [10, 4],
    [8, 3.5],
    [6, 3],
    [4, 2.5],
    [2, 2],
    [1, 1],
    [0, 0],
  ],
  Reading: [
    [39, 9],
    [37, 8.5],
    [35, 8],
    [33, 7.5],
    [30, 7],
    [27, 6.5],
    [23, 6],
    [19, 5.5],
    [15, 5],
    [13, 4.5],
    [10, 4],
    [8, 3.5],
    [6, 3],
    [4, 2.5],
    [2, 2],
    [1, 1],
    [0, 0],
  ],
};
export function approximateBand(
  skill: "Listening" | "Reading",
  correct: number,
  total: number,
) {
  if (total !== 40) return null;
  return bandThresholds[skill].find(([min]) => correct >= min)?.[1] ?? 0;
}
export function overallBand(scores: (number | null)[]) {
  if (
    scores.length !== 4 ||
    scores.some((s) => s === null || !Number.isFinite(s))
  )
    return null;
  return (
    Math.round(((scores as number[]).reduce((a, b) => a + b, 0) / 4) * 2) / 2
  );
}
export function writingBand(task1: number, task2: number) {
  return (task1 + 2 * task2) / 3;
}
export function normalize(s: string) {
  return s
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ");
}
export function isCorrect(answer: string, key: string) {
  return normalize(answer) === normalize(key);
}
export function wordCount(s: string) {
  return s.trim().match(/\S+/g)?.length ?? 0;
}
export function reviewSchedule(
  rating: "again" | "good" | "easy",
  interval: number,
  now = new Date(),
) {
  const days =
    rating === "again"
      ? 1
      : rating === "easy"
        ? Math.max(4, interval * 3)
        : Math.max(2, interval * 2);
  return {
    interval: days,
    due: new Date(now.getTime() + days * 86400000).toISOString(),
  };
}
