# VALUE-OPTION - Forex Trading Platform

## Overview

This is a real-time forex trading platform. Users can place bets on price movements (long/short) for major forex pairs: EUR/USD (labeled USD), USD/JPY (labeled JPY), GBP/USD (labeled EUR), and AUD/USD (labeled AUD). The platform features live market data via Finnhub forex WebSocket API, interactive candlestick charts using lightweight-charts, and an account system with virtual balance.

## Trading Rules
- **Operating Hours**: 24/7 (forex markets closed on weekends)
- **Trading Assets**: USD (EUR/USD), JPY (USD/JPY), EUR (GBP/USD), AUD (AUD/USD)
- **Trading Durations**: 1분 (60s), 3분 (180s), 5분 (300s)
- **New User Balance**: Starts at 0원 (deposit required)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with CSS variables for theming (dark mode default)
- **UI Components**: Shadcn/ui component library (New York style) with Radix UI primitives
- **Charts**: Lightweight-charts library for candlestick/price visualization

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build Tool**: esbuild for server bundling, Vite for client
- **API Design**: RESTful JSON API under `/api/*` prefix
- **Development**: Hot module replacement via Vite middleware

### Data Flow
- Real-time forex prices from Finnhub WebSocket (`wss://ws.finnhub.io`)
- Candle data generated server-side from WebSocket tick data (no REST API dependency)
- Frontend fetches prices from server API (`/api/market/prices`, `/api/market/candles`)
- Bets are created with strike price, settled when timer expires based on current price
- Price formatting: JPY uses 3 decimal places, all other pairs use 5 decimal places

### Finnhub API Integration
- **WebSocket**: Real-time forex price streaming via OANDA feed
- **Candle Generation**: Server accumulates tick data into OHLC candles (no external candle API needed)
- **Symbol mapping**: USD→OANDA:EUR_USD, JPY→OANDA:USD_JPY, EUR→OANDA:GBP_USD, AUD→OANDA:AUD_USD
- **API Key**: Stored as FINNHUB_API_KEY secret
- **Rate limits**: Free tier - 60 req/min for REST, unlimited WebSocket streaming
- **Market hours**: Forex markets open Sunday 5pm EST to Friday 5pm EST (closed weekends)

### Key Design Patterns
- Shared schema definitions between frontend and backend (`shared/schema.ts`)
- Demo user auto-created on first request (no authentication required)
- Path aliases: `@/` for client source, `@shared/` for shared code
- Forex price formatting utility: `formatForexPrice()` in `client/src/lib/utils.ts`

## External Dependencies

### Database
- **PostgreSQL** via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema**: Users, Bets, Messages, Affiliates, AffiliateCommissions, Settings, Announcements tables

### Key Features
- **Announcements**: Admin-managed public announcements with pinned/active status, displayed on landing page
- **Messages**: Private admin-to-user messaging system displayed on landing page for logged-in users
- **Affiliates**: Complete affiliate/distributor system with referral codes, commission tracking, and analytics

### Third-Party APIs
- **Finnhub Forex WebSocket**: Live forex price data for EUR/USD, USD/JPY, GBP/USD, AUD/USD
- **API Key**: FINNHUB_API_KEY (stored as secret)

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM with Zod schema validation
- `@tanstack/react-query`: Async state management
- `lightweight-charts`: TradingView-style chart rendering
- `connect-pg-simple`: PostgreSQL session store (available but sessions not currently implemented)
