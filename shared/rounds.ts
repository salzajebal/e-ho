export function getKSTDate(): Date {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcOffset = now.getTimezoneOffset();
  return new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
}

export function calculateRoundNumber(durationSeconds: number): number {
  const kstNow = getKSTDate();
  const secondsSinceMidnight = kstNow.getHours() * 3600 + kstNow.getMinutes() * 60 + kstNow.getSeconds();
  const roundNumber = Math.floor(secondsSinceMidnight / durationSeconds) + 1;
  return roundNumber;
}

export function getMaxRoundsPerDay(durationSeconds: number): number {
  return Math.floor(24 * 3600 / durationSeconds);
}

export function getRoundTimeRemaining(durationSeconds: number): number {
  const kstNow = getKSTDate();
  const secondsSinceMidnight = kstNow.getHours() * 3600 + kstNow.getMinutes() * 60 + kstNow.getSeconds();
  const elapsedInRound = secondsSinceMidnight % durationSeconds;
  return durationSeconds - elapsedInRound;
}

export function getRoundEndTime(durationSeconds: number): Date {
  const now = new Date();
  const remainingSeconds = getRoundTimeRemaining(durationSeconds);
  return new Date(now.getTime() + remainingSeconds * 1000);
}

export function getRoundStartTime(durationSeconds: number): Date {
  const now = new Date();
  const kstNow = getKSTDate();
  const secondsSinceMidnight = kstNow.getHours() * 3600 + kstNow.getMinutes() * 60 + kstNow.getSeconds();
  const elapsedInRound = secondsSinceMidnight % durationSeconds;
  return new Date(now.getTime() - elapsedInRound * 1000);
}

export function formatRoundDisplay(roundNumber: number, durationSeconds: number): string {
  const maxRounds = getMaxRoundsPerDay(durationSeconds);
  return `${roundNumber}회차 / ${maxRounds}회`;
}

export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getRoundTimeWindow(roundNumber: number, durationSeconds: number): { start: string; end: string } {
  const startSec = (roundNumber - 1) * durationSeconds;
  const endSec = roundNumber * durationSeconds;
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  return { start: fmt(startSec), end: fmt(Math.min(endSec, 86400)) };
}
