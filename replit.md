# GEMINI INVESTMENT - 글로벌 투자 플랫폼

## Overview

한국어 이진 옵션 투자 플랫폼 (GEMINI INVESTMENT 브랜딩). 사용자가 BTC(비트코인), ETH(이더리움), GOLD(금)의 가격 변동 방향(상승/하락)에 베팅합니다. Binance WebSocket(BTC/ETH)과 Yahoo Finance(GOLD) 실시간 시세, lightweight-charts 캔들스틱 차트, 계좌 시스템을 제공합니다.

## Admin Credentials
- Username: `gemi488`
- Password: `488153`

## Trading Rules
- **Operating Hours**: 24시간 (24/7)
- **Trading Assets**: BTC (비트코인), ETH (이더리움), GOLD (금)
- **Trading Durations**: 3분 (180s), 5분 (300s) — 1분 없음
- **Min Bet**: 10,000원
- **Max Bet**: 1,000,000,000원
- **Max Withdrawal**: 500,000,000원
- **Payout**: 2x (100% profit)
- **Buy = RED button (상승)**, **Sell = BLUE button (하락)** — 한국 관례

## User Preferences
Preferred communication style: Simple, everyday language.

## Key Features
- 다크/라이트 모드 토글 (기본: 라이트 모드)
- 회원 등급 시스템: 브론즈, 실버, 골드, VIP
- 은행 계좌 이체 입출금 (24시간)
- 1:1 문의 + 텔레그램 + 카카오톡 고객센터
- 총판 시스템 제거됨

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with CSS variables for theming
  - Light mode (white background) = default `:root`
  - Dark mode = `.dark` class
- **UI Components**: Shadcn/ui component library (New York style) with Radix UI primitives
- **Charts**: Lightweight-charts library for candlestick/price visualization
- **Theme Provider**: `client/src/lib/theme.tsx` (ThemeProvider + useTheme)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build Tool**: esbuild for server bundling, Vite for client
- **API Design**: RESTful JSON API under `/api/*` prefix
- **Development**: Hot module replacement via Vite middleware

### Data Flow
- Finnhub WebSocket 실시간 가격 스트리밍 (`wss://ws.finnhub.io`)
- 서버에서 캔들 데이터 생성 (180s, 300s 캔들만)
- 프론트엔드: `/api/market/prices`, `/api/market/candles` 폴링
- 베팅은 strike price로 생성, 타이머 만료 시 현재가 비교로 정산

### Market Data Sources
- **BTC/ETH**: Binance WebSocket (`wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker`)
- **GOLD**: Yahoo Finance polling (`GC=F`, 15초 간격)
- 실시간 데이터 없을 시 자동 시뮬레이션 폴백 (1초 간격)
- DEFAULT_PRICES: BTC=95000, ETH=3500, GOLD=3200
- Volatility: GOLD=0.00005, BTC/ETH=0.0002

### Key Design Patterns
- Shared schema definitions between frontend and backend (`shared/schema.ts`)
- All API calls use TanStack Query on the frontend
- Database operations through `server/storage.ts` interface

## Key Files
- `client/src/pages/Landing.tsx` — 랜딩 페이지 (메인)
- `client/src/pages/Home.tsx` — 트레이딩 페이지
- `client/src/pages/Admin.tsx` — 어드민 패널
- `client/src/components/LearnInvestLogo.tsx` — SVG 브랜드 로고 컴포넌트
- `client/src/lib/tradingGames.ts` — 거래 종목/게임 설정
- `client/src/lib/theme.tsx` — 다크/라이트 모드 테마
- `server/routes.ts` — 모든 API 엔드포인트
- `server/storage.ts` — DB 인터페이스
- `server/db.ts` — PostgreSQL 연결 및 초기화
- `shared/schema.ts` — Drizzle ORM 스키마

## Database Schema (주요 테이블)
- `users`: id, username, password, balance, grade(브론즈/실버/골드/VIP), role, etc.
- `bets`: id, userId, symbol, direction, amount, duration, outcome, etc.
- `settings`: key-value 설정 (telegram_link, kakao_link, deposit_notice, etc.)
- `forex_candles`: symbol, duration, time, ohlc data (unique index on symbol+duration+time)

## API Settings Keys
- `telegram_link` — 텔레그램 링크
- `kakao_link` — 카카오톡 링크
- `deposit_notice` — 입금 공지
- `company_info` — 회사 정보
