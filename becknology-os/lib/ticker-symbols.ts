// Ticker symbol definitions for market data
// This file can be imported by both client and server code
// V2 Spec: Only 13 instruments Andrew trades

export interface TickerSymbolDef {
  symbol: string
  apiSymbol: string
  name: string
  category: 'index' | 'forex' | 'metal' | 'energy' | 'crypto'
}

export const TICKER_SYMBOLS: TickerSymbolDef[] = [
  // Indices - Primary trading instruments
  { symbol: 'NQ', apiSymbol: 'NQ=F', name: 'NASDAQ Futures', category: 'index' },
  { symbol: 'ES', apiSymbol: 'ES=F', name: 'S&P 500 Futures', category: 'index' },
  { symbol: 'YM', apiSymbol: 'YM=F', name: 'Dow Futures', category: 'index' },
  { symbol: 'RTY', apiSymbol: 'RTY=F', name: 'Russell 2000', category: 'index' },
  { symbol: 'VIX', apiSymbol: '^VIX', name: 'Volatility Index', category: 'index' },
  // Forex
  { symbol: 'DXY', apiSymbol: 'DX=F', name: 'US Dollar Index', category: 'forex' },
  // Metals
  { symbol: 'GC', apiSymbol: 'GC=F', name: 'Gold', category: 'metal' },
  { symbol: 'SI', apiSymbol: 'SI=F', name: 'Silver', category: 'metal' },
  { symbol: 'HG', apiSymbol: 'HG=F', name: 'Copper', category: 'metal' },
  // Energy
  { symbol: 'CL', apiSymbol: 'CL=F', name: 'Crude Oil', category: 'energy' },
  { symbol: 'NG', apiSymbol: 'NG=F', name: 'Natural Gas', category: 'energy' },
  // Crypto
  { symbol: 'BTC', apiSymbol: 'BTC/USD', name: 'Bitcoin', category: 'crypto' },
  { symbol: 'ETH', apiSymbol: 'ETH/USD', name: 'Ethereum', category: 'crypto' },
]

// Base prices for mock data generation
export const BASE_PRICES: Record<string, number> = {
  NQ: 21045.00,
  ES: 5892.75,
  YM: 43250.00,
  RTY: 2285.40,
  VIX: 14.25,
  DXY: 103.45,
  GC: 2045.80,
  SI: 24.15,
  HG: 4.12,
  CL: 72.45,
  NG: 2.28,
  BTC: 98542.00,
  ETH: 3485.25,
}
