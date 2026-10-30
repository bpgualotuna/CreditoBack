const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Converts a duration string such as `15m`, `8h` or `7d` (or plain seconds)
 * into milliseconds.
 */
export function durationToMs(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d)?$/.exec(duration.trim());

  if (!match) {
    throw new Error(`Invalid duration format: "${duration}"`);
  }

  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  return value * UNIT_TO_MS[unit];
}

/** Same as {@link durationToMs} but expressed in seconds. */
export function durationToSeconds(duration: string): number {
  return Math.floor(durationToMs(duration) / 1_000);
}
