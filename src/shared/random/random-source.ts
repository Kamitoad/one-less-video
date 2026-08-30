export interface RandomSource {
  next(): number;
}

export const mathRandomSource: RandomSource = {
  next: () => Math.random(),
};

function normalizedRandomValue(random: RandomSource): number {
  const value = random.next();
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 0.999_999_999_999);
}

export function randomInteger(
  minInclusive: number,
  maxInclusive: number,
  random: RandomSource,
): number {
  const range = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(normalizedRandomValue(random) * range);
}

export function randomItem<T>(items: readonly T[], random: RandomSource): T {
  if (items.length === 0) {
    throw new Error('Cannot choose a random item from an empty list.');
  }

  const item = items[randomInteger(0, items.length - 1, random)];
  if (item === undefined) {
    throw new Error('Random item selection produced an invalid index.');
  }
  return item;
}
