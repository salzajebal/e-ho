export const FOREX_SYMBOLS = ['USD', 'EUR', 'JPY', 'AUD'] as const;
export type ForexSymbol = typeof FOREX_SYMBOLS[number];

export const FOREX_DISPLAY: Record<ForexSymbol, { name: string; pair: string; flag: string }> = {
  USD: { name: '달러', pair: 'EUR/USD', flag: '🇺🇸' },
  EUR: { name: '유로', pair: 'GBP/USD', flag: '🇪🇺' },
  JPY: { name: '엔화', pair: 'USD/JPY', flag: '🇯🇵' },
  AUD: { name: '호주달러', pair: 'AUD/USD', flag: '🇦🇺' },
};

export const FINNHUB_TICKER_MAP: Record<ForexSymbol, string> = {
  USD: 'OANDA:EUR_USD',
  EUR: 'OANDA:GBP_USD',
  JPY: 'OANDA:USD_JPY',
  AUD: 'OANDA:AUD_USD',
};

export const TRADING_GAMES = [
  { id: 'USD-60', symbol: 'USD', duration: 60, label: '달러1분' },
  { id: 'USD-180', symbol: 'USD', duration: 180, label: '달러3분' },
  { id: 'USD-300', symbol: 'USD', duration: 300, label: '달러5분' },
  { id: 'EUR-60', symbol: 'EUR', duration: 60, label: '유로1분' },
  { id: 'EUR-180', symbol: 'EUR', duration: 180, label: '유로3분' },
  { id: 'EUR-300', symbol: 'EUR', duration: 300, label: '유로5분' },
  { id: 'JPY-60', symbol: 'JPY', duration: 60, label: '엔화1분' },
  { id: 'JPY-180', symbol: 'JPY', duration: 180, label: '엔화3분' },
  { id: 'JPY-300', symbol: 'JPY', duration: 300, label: '엔화5분' },
  { id: 'AUD-60', symbol: 'AUD', duration: 60, label: '호주달러1분' },
  { id: 'AUD-180', symbol: 'AUD', duration: 180, label: '호주달러3분' },
  { id: 'AUD-300', symbol: 'AUD', duration: 300, label: '호주달러5분' },
] as const;

export type TradingGame = typeof TRADING_GAMES[number];
