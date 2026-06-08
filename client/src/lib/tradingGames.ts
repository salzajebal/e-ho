export const FOREX_SYMBOLS = ['BTC', 'ETH', 'GOLD'] as const;
export type ForexSymbol = typeof FOREX_SYMBOLS[number];

export const FOREX_DISPLAY: Record<ForexSymbol, { name: string; pair: string; flag: string }> = {
  BTC: { name: '비트코인', pair: 'BTC/USDT', flag: '₿' },
  ETH: { name: '이더리움', pair: 'ETH/USDT', flag: 'Ξ' },
  GOLD: { name: '금', pair: 'XAU/USD', flag: '🥇' },
};

export const FINNHUB_TICKER_MAP: Record<ForexSymbol, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  GOLD: 'GC=F',
};

export const TRADING_GAMES = [
  { id: 'BTC-120', symbol: 'BTC', duration: 120, label: '비트코인' },
  { id: 'ETH-120', symbol: 'ETH', duration: 120, label: '이더리움' },
  { id: 'GOLD-120', symbol: 'GOLD', duration: 120, label: '금' },
] as const;

export type TradingGame = typeof TRADING_GAMES[number];
