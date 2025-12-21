// 6 fixed trading games: symbol + duration combinations
export const TRADING_GAMES = [
  { id: 'NDX-60', symbol: 'NDX', duration: 60, label: 'NASDAQ 1분' },
  { id: 'NDX-180', symbol: 'NDX', duration: 180, label: 'NASDAQ 3분' },
  { id: 'NDX-300', symbol: 'NDX', duration: 300, label: 'NASDAQ 5분' },
  { id: 'GOLD-60', symbol: 'GOLD', duration: 60, label: 'GOLD 1분' },
  { id: 'GOLD-180', symbol: 'GOLD', duration: 180, label: 'GOLD 3분' },
  { id: 'GOLD-300', symbol: 'GOLD', duration: 300, label: 'GOLD 5분' },
] as const;

export type TradingGame = typeof TRADING_GAMES[number];
