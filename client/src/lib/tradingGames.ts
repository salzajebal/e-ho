export const TRADING_GAMES = [
  { id: 'BTC-120', symbol: 'BTC', duration: 120, label: 'USD/JPY 2분' },
  { id: 'ETH-120', symbol: 'ETH', duration: 120, label: 'EUR/USD 2분' },
] as const;

export type TradingGame = typeof TRADING_GAMES[number];
