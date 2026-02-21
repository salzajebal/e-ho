import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getForexDecimals(symbol?: string): number {
  return symbol === 'JPY' ? 3 : 5;
}

export function formatForexPrice(price: number, symbol?: string): string {
  const decimals = getForexDecimals(symbol);
  return price.toFixed(decimals);
}
