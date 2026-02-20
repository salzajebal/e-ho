export const FOREX_SYMBOLS = ['USD', 'JPY', 'EUR', 'AUD'] as const;
export type ForexSymbol = typeof FOREX_SYMBOLS[number];

export const FOREX_DISPLAY: Record<ForexSymbol, { name: string; pair: string; flag: string }> = {
  USD: { name: '달러', pair: 'USD/KRW', flag: '🇺🇸' },
  JPY: { name: '엔화', pair: 'JPY/KRW', flag: '🇯🇵' },
  EUR: { name: '유로', pair: 'EUR/KRW', flag: '🇪🇺' },
  AUD: { name: '호주달러', pair: 'AUD/KRW', flag: '🇦🇺' },
};

export const BINANCE_SYMBOL_MAP: Record<ForexSymbol, string> = {
  USD: 'BTCUSDT',
  JPY: 'ETHUSDT',
  EUR: 'SOLUSDT',
  AUD: 'XRPUSDT',
};

export const INTERNAL_SYMBOL_MAP: Record<ForexSymbol, 'BTC' | 'ETH' | 'SOL' | 'XRP'> = {
  USD: 'BTC',
  JPY: 'ETH',
  EUR: 'SOL',
  AUD: 'XRP',
};

export const TRADING_GAMES = [
  { id: 'USD-60', symbol: 'USD', duration: 60, label: '달러 1분' },
  { id: 'USD-180', symbol: 'USD', duration: 180, label: '달러 3분' },
  { id: 'USD-300', symbol: 'USD', duration: 300, label: '달러 5분' },
  { id: 'JPY-60', symbol: 'JPY', duration: 60, label: '엔화 1분' },
  { id: 'JPY-180', symbol: 'JPY', duration: 180, label: '엔화 3분' },
  { id: 'JPY-300', symbol: 'JPY', duration: 300, label: '엔화 5분' },
  { id: 'EUR-60', symbol: 'EUR', duration: 60, label: '유로 1분' },
  { id: 'EUR-180', symbol: 'EUR', duration: 180, label: '유로 3분' },
  { id: 'EUR-300', symbol: 'EUR', duration: 300, label: '유로 5분' },
  { id: 'AUD-60', symbol: 'AUD', duration: 60, label: '호주달러 1분' },
  { id: 'AUD-180', symbol: 'AUD', duration: 180, label: '호주달러 3분' },
  { id: 'AUD-300', symbol: 'AUD', duration: 300, label: '호주달러 5분' },
] as const;

export type TradingGame = typeof TRADING_GAMES[number];
