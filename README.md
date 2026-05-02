# Trait d'Union Séoul

파리 한국어 통역 · VIP 문화 동행 사이트. Astro 4.x 하이브리드(정적 + 일부 SSR) + Cloudflare Pages.

라이브 도메인 (배포 후): https://traitdunionseoul.com

---

## 라우팅

### 공개 (정적)

| 경로 | 페이지 |
|---|---|
| `/` | 홈 — 히어로 · stats · 서비스 3종 카드 · 소개 티저 · 베르사유 티저 |
| `/about` | 소개 + 12개 레퍼런스 + 후기 (KV 동적 fetch, ⚙ SSR) |
| `/interpretation` | 비즈니스 통역 상세 |
| `/vip-guiding` | VIP 맞춤 가이딩 (분야별 공인 해설사 매칭) 상세 |
| `/versailles` | 베르사유 궁전 VIP 투어 + 예약 가능 캘린더 + feature |
| `/faq` | 자주 묻는 질문 |
| `/contact` | 견적 요청 폼 + B2B + 4단계 예약 절차. URL 쿼리 `?service=&date=` 자동 채움 지원 |
| `/legal/mentions-legales` | 법적 고지 (LCEN) |
| `/legal/cgv` | 약관 (CGV) |
| `/legal/confidentialite` | 개인정보 처리방침 (RGPD) |

### 후기 시스템 (SSR)

| 경로 | 설명 |
|---|---|
| `/review?token=...` | 손님이 후기를 작성하는 페이지 (운영자가 발급한 일회용 토큰 필수) |
| `/admin/login` | 운영자 로그인 (이메일 매직 링크 발송) |
| `/admin` | 어드민 대시보드 (인증 필수) |
| `/admin/tokens` | 후기 토큰 발급 (인증 필수) |
| `/admin/reviews` | 후기 승인/거부 (인증 필수) |

### 예약 워크플로우 (SSR)

| 경로 | 설명 |
|---|---|
| `/admin/bookings` | 모든 예약 목록 (상태별: 신규 / 견적 발송 / 입금 확인 / 확정 / 취소) |
| `/admin/bookings/[id]` | 단일 예약 상세 — 견적 발송, 입금 확인, 예약확인증 발송, 취소, 메모 |

### 서버 API (SSR)

| 경로 | 메서드 | 설명 |
|---|---|---|
| `/api/auth/magic-send` | POST | 운영자 이메일에 매직 링크 발송 |
| `/api/auth/verify` | GET `?t=` | 매직 토큰 검증 → 세션 쿠키 발급 |
| `/api/auth/logout` | GET | 세션 만료 |
| `/api/reviews/submit` | POST | 손님 후기 제출 (토큰 필수) |
| `/api/reviews/issue-token` | POST | 후기 토큰 발급 (인증 필수) |
| `/api/reviews/approve` | POST | 후기 승인/거부 (인증 필수) |
| `/api/reviews/list-public` | GET | 승인된 후기 목록 |
| `/api/bookings/submit` | POST | 손님 견적 요청 폼 제출 (공개) — 운영자 알림 메일 자동 발송 |
| `/api/bookings/quote` | POST | 견적 작성/발송 (인증 필수) |
| `/api/bookings/mark-paid` | POST | 입금 확인 처리 (인증 필수) |
| `/api/bookings/confirm` | POST | 예약확인증 발송 (인증 필수) |
| `/api/bookings/cancel` | POST | 예약 취소 (인증 필수) |
| `/api/bookings/notes` | POST | 운영자 내부 메모 저장 (인증 필수) |

---

## 기술 스택

- **Astro 4.16** (`output: 'hybrid'`)
- **TypeScript strict**
- **Cloudflare Pages + Pages Functions** (SSR 라우트, KV 바인딩)
- **Cloudflare KV** (`REVIEWS_KV`) — 후기·토큰 저장
- **Resend** — 매직 링크 이메일 발송
- 폰트: Google Fonts CDN (Cormorant Garamond, Noto Sans KR, EB Garamond)
- 외부 UI 라이브러리, Tailwind, 분석 SDK 등 — 사용 안 함

---

## 로컬 실행

요구 사항: **Node.js 20 이상** (검증: 24.15.0).

```bash
npm install
npm run dev
```

기본 포트 `http://localhost:4321/`.

> 로컬 dev에서는 KV 바인딩이 없으므로 `/admin/*`, `/review`, `/api/*` 는 동작하지 않거나 placeholder 응답입니다. 실제 테스트는 `wrangler pages dev` 또는 Cloudflare Pages 배포 후 가능.

### 로컬에서 KV/Functions 함께 띄우기 (선택)

```bash
npm run build
npx wrangler pages dev ./dist --kv REVIEWS_KV
```

---

## Cloudflare Pages 배포 — 전체 절차

### 1. GitHub 리포지토리 연결

```bash
git init && git add . && git commit -m "init"
git remote add origin git@github.com:<USER>/trait-dunion-seoul.git
git push -u origin main
```

Cloudflare 대시보드 → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** → 리포지토리 선택, 브랜치 = `main`.

### 2. 빌드 설정

| 항목 | 값 |
|---|---|
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version 환경변수 | `NODE_VERSION=20` |

### 3. KV 네임스페이스 생성 + 바인딩

Cloudflare 대시보드 → **Workers & Pages** → **KV** → **Create a namespace**:
- Name: `trait-dunion-seoul-reviews` (자유)
- Namespace ID 복사

Pages 프로젝트 → **Settings** → **Functions** → **KV namespace bindings** → **Add binding**:
- Variable name: **`REVIEWS_KV`**  ← 정확히 이 이름
- KV namespace: 위에서 만든 네임스페이스 선택

또는 `wrangler.toml`의 `id = "PASTE_KV_NAMESPACE_ID_HERE"` 자리에 복사한 ID를 붙여넣고 커밋.

### 4. Resend 계정 + API 키

1. https://resend.com 회원가입 (무료 100통/일)
2. **Domains** → `traitdunionseoul.com` 추가 → 안내된 SPF/DKIM/MX TXT 레코드를 도메인 DNS에 추가
3. 인증 완료까지 대기 (몇 분 ~ 한 시간)
4. **API Keys** → **Create API Key** → 키 복사 (`re_xxx...`)

> 도메인 인증 전이라도 Resend의 `onboarding@resend.dev` 발신으로 발송 가능 (수신은 본인 계정에 가입한 이메일만). 운영 시작 전 도메인 인증 완료 권장.

### 5. 환경변수 (Pages 콘솔에서 입력)

Pages 프로젝트 → **Settings** → **Environment variables** → **Add variable** (Encrypted 권장):

| 키 | 값 | 비밀? |
|---|---|---|
| `RESEND_API_KEY` | `re_xxx...` (Resend에서 발급) | 🔒 |
| `AUTH_SECRET` | 32자 이상 랜덤 문자열 (`openssl rand -hex 32` 등) | 🔒 |
| `TOKEN_SECRET` | 32자 이상 랜덤 문자열 (별도) | 🔒 |
| `SITE_URL` | `https://traitdunionseoul.com` | 평문 |
| `ADMIN_EMAIL` | `traitdunionseoul@gmail.com` | 평문 |
| `EMAIL_FROM` | `Trait d'Union Séoul <noreply@traitdunionseoul.com>` (도메인 인증 후) 또는 `onboarding@resend.dev` (인증 전) | 평문 |

`AUTH_SECRET` / `TOKEN_SECRET` 만드는 법 (PowerShell):
```powershell
[Convert]::ToHexString([byte[]](1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 6. 커스텀 도메인 — `traitdunionseoul.com`

Pages 프로젝트 → **Custom domains** → **Set up a custom domain**:

1. `traitdunionseoul.com` 입력 → DNS 자동 설정 (Cloudflare에 도메인 있으면 자동, 외부 등록기관이면 CNAME `xxxx.pages.dev` 또는 A 레코드 직접 추가)
2. `www.traitdunionseoul.com`도 같은 방식으로 추가
3. SSL 인증서는 Cloudflare가 자동 발급 (수 분 소요)

### 7. 동작 확인

배포 완료 후:
- https://traitdunionseoul.com/ — 홈 뜨는지
- https://traitdunionseoul.com/admin/login — 이메일 입력 → `traitdunionseoul@gmail.com`으로 매직 링크 도착 확인
- 메일 링크 클릭 → `/admin` 진입 확인
- `/admin/tokens` → 테스트 토큰 발급 → 링크 복사 → 새 시크릿 창에서 열어 후기 작성 → 제출
- `/admin/reviews` → 대기 중에 그 후기가 보이는지, 승인 후 `/about` 의 후기 섹션에 노출되는지 확인

---

## 운영자 일상 사용법

### 예약 워크플로우 (가장 자주 쓰는 흐름)

1. 손님이 `/contact`에서 견적 요청 폼 제출 → KV에 `booking:new:<id>` 로 저장됨 + 운영자 메일에 새 견적 요청 알림 도착
2. 운영자 알림 메일에서 **"어드민에서 보기 →"** 클릭 → `/admin/bookings/[id]` 로 이동 (로그인 필요)
3. **견적 발송 폼**에 금액·내역·계좌 정보 입력 → **"손님에게 견적 발송 (이메일)"** 클릭
   - 손님에게 견적 메일이 자동 발송되고 KV에서 `booking:quoted:<id>` 로 이동
4. 손님 입금 확인 후 **입금 확인 폼**에 금액·방법·메모 입력 → **"입금 확인 처리"** 클릭
   - KV에서 `booking:paid:<id>` 로 이동 (이메일 발송 없음, 운영자 내부 처리)
5. **예약확인증 발송 폼**에 미팅 장소·시간·추가 안내 입력 → **"손님에게 예약확인증 발송"** 클릭
   - 손님에게 예약확인증 메일이 자동 발송되고 KV에서 `booking:confirmed:<id>` 로 이동
6. 어디서나 **"예약 취소"** 버튼으로 취소 가능. 운영자 메모는 별도 저장.

### 새 후기 받기

1. 투어 종료 후 손님에게 후기를 받고 싶으면 **`/admin/tokens`** 들어가기 (로그인 필요)
2. 서비스 종류 + 손님 성함 + 투어 날짜 입력 → **토큰 발급**
3. 발급된 링크 복사 → 손님 카톡/이메일로 발송
4. 손님이 링크에서 후기 작성 → KV에 `pending`으로 저장됨

### 후기 승인

1. **`/admin/reviews`** 들어가기 (로그인 필요)
2. **대기 중** 섹션에서 새 후기 확인 → **승인** 또는 **거부** 클릭
3. 승인된 후기는 즉시 `/about` 페이지의 후기 섹션에 표시됨 (캐시 60초)

### 운영 시작 전 (KV 비어있을 때)

`/about` 후기 섹션은 KV에 승인된 후기가 0건일 때 fallback (현재 박혀있는 3개 손님 후기) 표시. 첫 실제 후기가 승인되면 fallback이 자동 사라지고 KV의 후기로 교체됨.

---

## 폴더 구조

```
trait-dunion-seoul/
├─ astro.config.mjs            # output:'hybrid' + Cloudflare adapter
├─ wrangler.toml               # KV 바인딩 + 평문 환경변수
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ env.d.ts                 # ENV 타입 (KV·환경변수)
│  ├─ components/
│  │  ├─ Header.astro
│  │  └─ Footer.astro
│  ├─ layouts/
│  │  └─ Site.astro
│  ├─ lib/
│  │  ├─ runtime.ts            # KV/Env 헬퍼, 응답 헬퍼
│  │  ├─ email.ts              # Resend 발송
│  │  ├─ auth.ts               # HMAC 매직 링크 + 세션 쿠키
│  │  └─ reviews.ts            # KV 키 규칙, Tour/Review 타입, list/get/put/delete
│  ├─ pages/
│  │  ├─ index.astro           (정적)
│  │  ├─ about.astro           (SSR, KV에서 후기 fetch)
│  │  ├─ interpretation.astro  (정적)
│  │  ├─ vip-guiding.astro     (정적)
│  │  ├─ versailles.astro      (정적, 캘린더 포함)
│  │  ├─ faq.astro             (정적)
│  │  ├─ contact.astro         (정적, prefill JS)
│  │  ├─ review.astro          (SSR, 토큰 검증)
│  │  ├─ legal/                (정적 3개)
│  │  ├─ admin/
│  │  │  ├─ login.astro        (SSR)
│  │  │  ├─ index.astro        (SSR, 인증 필수)
│  │  │  ├─ tokens.astro       (SSR, 인증 필수)
│  │  │  └─ reviews.astro      (SSR, 인증 필수)
│  │  └─ api/
│  │     ├─ auth/
│  │     │  ├─ magic-send.ts
│  │     │  ├─ verify.ts
│  │     │  └─ logout.ts
│  │     └─ reviews/
│  │        ├─ submit.ts
│  │        ├─ issue-token.ts
│  │        ├─ approve.ts
│  │        └─ list-public.ts
│  └─ styles/
│     └─ global.css
└─ public/
```

---

## 디자인 시스템 (보존)

- 디자인 토큰: `--ink #1a2238`, `--ink-soft #2d3656`, `--sage #6b7e6e`, `--sage-deep #4a5a4d`, `--ivory #f5f0e8`, `--ivory-warm #ebe4d6`, `--gold #b08d57`, `--paper #faf7f0`
- 헤딩의 강조 텍스트(`.accent`, `.it`, `<em>`)는 부모의 0.5em
- 인터랙션: 스크롤 시 `.topbar.scrolled` 축소, `.reveal` IntersectionObserver 페이드업, FAQ 토글, 견적 폼 prefill + mailto fallback, 베르사유 캘린더 (월요일 휴궁)

---

## 알려진 제약

- 견적 폼은 `/api/bookings/submit`으로 KV에 저장됨. 운영자 알림 이메일이 자동 발송되니 메일함을 확인하면 새 견적 요청을 빠르게 인지할 수 있음.
- KakaoTalk / Instagram / WhatsApp 채널 버튼의 `href`는 `#`. 채널 URL이 정해지면 `src/pages/contact.astro`에서 교체.
- 법적 페이지의 회사명·SIRET·주소·호스팅 업체 `[추후 입력]` 자리표시자는 사업자 등록 후 채울 것.
- 히어로/B2B/feature 영역의 placeholder 이미지는 Unsplash CDN URL이 박혀있음. 자체 이미지로 교체하려면 `src/styles/global.css`의 해당 클래스 수정.
- 베르사유 캘린더는 **단순 정적 가용성 표시** (월요일 휴궁만). 실제 예약 만석·운영자 휴무 처리는 추후 KV에 차단 날짜 저장 + 캘린더에서 그 날짜 비활성화 로직 추가 필요.

---

## 변경 이력

- VIP 맞춤 가이딩 = 분야별 공인 해설사 공동체 매칭 모델 (와인·문학·미술·남불·역사·패션·미식 7개 테마)
- 베르사유 도슨트 투어 → "베르사유 궁전 VIP 투어"로 명칭 통일, ₩54,000/2시간
- 베르사유 페이지에 예약 가능 캘린더 + 입장권 그룹 예매 안내
- 결제 수단: 카드/PayPal 제거, 한국·프랑스 계좌 이체만
- About 단락: "저희" 톤 + 협력 공동체 정체성, 책임자 이력 (불문학·15년 미술관 해설사·국가고시 해설사 자격) 명시
- 헤더 메뉴: 소개 / 서비스(드롭다운) / VIP 맞춤 가이딩 / 베르사유 / FAQ / 견적 요청
- 후기 시스템: 토큰 전용 + KV + 매직 링크 admin 인증 + Resend 이메일
- 예약 워크플로우: 견적 요청 → 견적 발송 → 입금 확인 → 예약확인증 발송 (KV 상태 추적, admin UI, 자동 이메일)
- 견적 폼: mailto fallback 제거, `/api/bookings/submit` API로 직접 전송
