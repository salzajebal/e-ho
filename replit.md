# 명인FX - Binary Options Trading Platform

## Overview

This is a real-time binary options trading platform styled after Binance's interface. Users can place time-limited bets (1-5 minutes) on price movements (long/short) for various assets including cryptocurrencies, forex, commodities, and indices. The platform features live market data via Binance WebSocket, interactive candlestick charts using lightweight-charts, and a demo account system with virtual balance.

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
- Real-time crypto prices from Binance WebSocket (`wss://stream.binance.com`)
- Frontend maintains local market price state and syncs with backend
- Bets are created with strike price, settled when timer expires based on current price

### Key Design Patterns
- Shared schema definitions between frontend and backend (`shared/schema.ts`)
- Demo user auto-created on first request (no authentication required)
- Path aliases: `@/` for client source, `@shared/` for shared code

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
- **Binance WebSocket**: Live BTC/USDT and ETH/USDT ticker data
- No authentication required for public market data streams

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM with Zod schema validation
- `@tanstack/react-query`: Async state management
- `lightweight-charts`: TradingView-style chart rendering
- `connect-pg-simple`: PostgreSQL session store (available but sessions not currently implemented)