export const FOREX_SYMBOLS = ['USD', 'EUR', 'JPY', 'AUD'] as const;
export type ForexSymbol = typeof FOREX_SYMBOLS[number];

export const FOREX_DISPLAY: Record<ForexSymbol, { name: string; pair: string; flag: string }> = {
  USD: { name: 'USD/USDT', pair: 'EUR/USD', flag: '🇺🇸' },
  EUR: { name: 'GBP/USD', pair: 'GBP/USD', flag: '🇪🇺' },
  JPY: { name: 'USD/JPY', pair: 'USD/JPY', flag: '🇯🇵' },
  AUD: { name: 'AUD/USD', pair: 'AUD/USD', flag: '🇦🇺' },
};

export const FINNHUB_TICKER_MAP: Record<ForexSymbol, string> = {
  USD: 'OANDA:EUR_USD',
  EUR: 'OANDA:GBP_USD',
  JPY: 'OANDA:USD_JPY',
  AUD: 'OANDA:AUD_USD',
};

export const TRADING_GAMES = [
  { id: 'USD-60', symbol: 'USD', duration: 60, label: 'USD/USDT1분' },
  { id: 'USD-180', symbol: 'USD', duration: 180, label: 'USD/USDT3분' },
  { id: 'USD-300', symbol: 'USD', duration: 300, label: 'USD/USDT5분' },
  { id: 'EUR-60', symbol: 'EUR', duration: 60, label: 'GBP/USD1분' },
  { id: 'EUR-180', symbol: 'EUR', duration: 180, label: 'GBP/USD3분' },
  { id: 'EUR-300', symbol: 'EUR', duration: 300, label: 'GBP/USD5분' },
  { id: 'JPY-60', symbol: 'JPY', duration: 60, label: 'USD/JPY1분' },
  { id: 'JPY-180', symbol: 'JPY', duration: 180, label: 'USD/JPY3분' },
  { id: 'JPY-300', symbol: 'JPY', duration: 300, label: 'USD/JPY5분' },
  { id: 'AUD-60', symbol: 'AUD', duration: 60, label: 'AUD/USD1분' },
  { id: 'AUD-180', symbol: 'AUD', duration: 180, label: 'AUD/USD3분' },
  { id: 'AUD-300', symbol: 'AUD', duration: 300, label: 'AUD/USD5분' },
] as const;

export type TradingGame = typeof TRADING_GAMES[number];
