export const FOREX_SYMBOLS = ['SP500', 'DOW', 'DXY'] as const;
export type ForexSymbol = typeof FOREX_SYMBOLS[number];

export const FOREX_DISPLAY: Record<ForexSymbol, { name: string; pair: string; flag: string }> = {
  SP500: { name: 'S&P500', pair: 'S&P 500 Index', flag: '📈' },
  DOW: { name: '다우존스', pair: 'Dow Jones', flag: '📊' },
  DXY: { name: '달러', pair: 'Dollar Index', flag: '🇺🇸' },
};

export const FINNHUB_TICKER_MAP: Record<ForexSymbol, string> = {
  SP500: 'SP500',
  DOW: 'DOW',
  DXY: 'DXY',
};

export const TRADING_GAMES = [
  { id: 'SP500-180', symbol: 'SP500', duration: 180, label: 'S&P500 3분' },
  { id: 'SP500-300', symbol: 'SP500', duration: 300, label: 'S&P500 5분' },
  { id: 'DOW-180', symbol: 'DOW', duration: 180, label: '다우존스 3분' },
  { id: 'DOW-300', symbol: 'DOW', duration: 300, label: '다우존스 5분' },
  { id: 'DXY-180', symbol: 'DXY', duration: 180, label: '달러 3분' },
  { id: 'DXY-300', symbol: 'DXY', duration: 300, label: '달러 5분' },
] as const;

export type TradingGame = typeof TRADING_GAMES[number];
