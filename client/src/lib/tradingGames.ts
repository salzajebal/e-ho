export const FOREX_SYMBOLS = ['USD', 'JPY', 'EUR', 'AUD'] as const;
export type ForexSymbol = typeof FOREX_SYMBOLS[number];

export const FOREX_DISPLAY: Record<ForexSymbol, { name: string; pair: string; flag: string }> = {
  USD: { name: '유로/달러', pair: 'EUR/USD', flag: '🇪🇺' },
  JPY: { name: '달러/엔', pair: 'USD/JPY', flag: '🇯🇵' },
  EUR: { name: '파운드/달러', pair: 'GBP/USD', flag: '🇬🇧' },
  AUD: { name: '호주달러', pair: 'AUD/USD', flag: '🇦🇺' },
};

export const FINNHUB_TICKER_MAP: Record<ForexSymbol, string> = {
  USD: 'OANDA:EUR_USD',
  JPY: 'OANDA:USD_JPY',
  EUR: 'OANDA:GBP_USD',
  AUD: 'OANDA:AUD_USD',
};

export const TRADING_GAMES = [
  { id: 'USD-60', symbol: 'USD', duration: 60, label: 'EUR/USD 1분' },
  { id: 'USD-180', symbol: 'USD', duration: 180, label: 'EUR/USD 3분' },
  { id: 'USD-300', symbol: 'USD', duration: 300, label: 'EUR/USD 5분' },
  { id: 'JPY-60', symbol: 'JPY', duration: 60, label: 'USD/JPY 1분' },
  { id: 'JPY-180', symbol: 'JPY', duration: 180, label: 'USD/JPY 3분' },
  { id: 'JPY-300', symbol: 'JPY', duration: 300, label: 'USD/JPY 5분' },
  { id: 'EUR-60', symbol: 'EUR', duration: 60, label: 'GBP/USD 1분' },
  { id: 'EUR-180', symbol: 'EUR', duration: 180, label: 'GBP/USD 3분' },
  { id: 'EUR-300', symbol: 'EUR', duration: 300, label: 'GBP/USD 5분' },
  { id: 'AUD-60', symbol: 'AUD', duration: 60, label: 'AUD/USD 1분' },
  { id: 'AUD-180', symbol: 'AUD', duration: 180, label: 'AUD/USD 3분' },
  { id: 'AUD-300', symbol: 'AUD', duration: 300, label: 'AUD/USD 5분' },
] as const;

export type TradingGame = typeof TRADING_GAMES[number];
