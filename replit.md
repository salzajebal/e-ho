# COINONE - Cryptocurrency Trading Platform

## Overview

This is a real-time cryptocurrency trading platform styled after Coinone's interface. Users can place 2-minute bets on price movements (long/short) for Bitcoin (BTC) and Ethereum (ETH). The platform features live market data via Binance REST API, interactive candlestick charts using lightweight-charts, and an account system with virtual balance.

## Trading Rules
- **Operating Hours**: 24/7 (No time restrictions)
- **Bitcoin (BTC)**: Available 24/7
- **Ethereum (ETH)**: Available 24/7
- **Trading Duration**: 2 minutes only
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