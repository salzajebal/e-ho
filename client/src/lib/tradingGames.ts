// 2 fixed trading games: BTC and ETH with 2 minute duration
export const TRADING_GAMES = [
  { id: 'BTC-120', symbol: 'BTC', duration: 120, label: '비트코인 2분' },
  { id: 'ETH-120', symbol: 'ETH', duration: 120, label: '이더리움 2분' },
] as const;

export type TradingGame = typeof TRADING_GAMES[number];
