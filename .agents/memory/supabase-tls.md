---
name: Supabase TLS 연결
description: Supabase Session pooler와 이 프로젝트의 TLS 검증 방식을 설명합니다.
---

Supabase Session pooler URI는 `sslmode=require`로 암호화 연결을 사용한다. Connect 화면에서 CA PEM이 제공되지 않으면 이를 기본 연결 방식으로 사용하고, 제공된 CA PEM이 있을 때만 `DATABASE_SSL_CA`를 통해 인증서 체인 검증을 추가한다.

**Why:** CA가 없는 Session pooler 연결에 Node PostgreSQL 클라이언트의 `rejectUnauthorized: true`를 강제하면 self-signed certificate chain 오류로 이전과 서버 기동이 중단된다.

**How to apply:** `sslmode=disable`은 Supabase에 절대 사용하지 않는다. 암호화가 필요한 일반 연결에는 `sslmode=require`을 유지한다. 공급자가 CA PEM을 제공하거나 인증서 체인 검증이 정책상 필수일 때는 `DATABASE_SSL_CA`와 `sslmode=verify-full`을 함께 사용한다.