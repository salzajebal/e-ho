export function getKSTDate(): Date {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcOffset = now.getTimezoneOffset();
  return new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
}

export function calculateRoundNumber(durationSeconds: number): number {
  const kstNow = getKSTDate();
  const minutesSinceMidnight = kstNow.getHours() * 60 + kstNow.getMinutes();
  const durationMinutes = durationSeconds / 60;
  const roundNumber = Math.floor(minutesSinceMidnight / durationMinutes) + 1;
  return roundNumber;
}

export function getMaxRoundsPerDay(durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60;
  return Math.floor(24 * 60 / durationMinutes);
}

export function formatRoundDisplay(roundNumber: number, durationSeconds: number): string {
  const maxRounds = getMaxRoundsPerDay(durationSeconds);
  return `${roundNumber}회차 / ${maxRounds}회`;
}
