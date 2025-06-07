# Link Quration 프로젝트 구조

## 루트 디렉토리
```
.
├── .git/
├── .next/
├── node_modules/
├── public/
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai-analyze/
│   │   │   │   └── route.ts
│   │   │   ├── extract-content/
│   │   │   │   └── route.ts
│   │   │   └── analize-url.js
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ai/
│   │   │   └── ModelSelector.tsx
│   │   ├── card/
│   │   │   └── BookmarkCard.tsx
│   │   ├── layout/
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── modal/
│   │   │   └── AddBookmarkModal.tsx
│   │   ├── settings/
│   │   │   └── ApiKeySettings.tsx
│   │   └── ui/
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── modal.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── use-toast.ts
│   ├── constants/
│   ├── contexts/
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── ai-analyzers/
│   │   │   └── media-ai-analyzer.ts
│   │   ├── media-analyzers/
│   │   │   └── video-analyzer.ts
│   │   ├── scrapers/
│   │   │   └── multi-strategy-scraper.ts
│   │   ├── openrouter.ts
│   │   └── utils.ts
│   ├── mock/
│   │   ├── bookmark.ts
│   │   └── categories.ts
│   ├── services/
│   ├── store/
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       ├── ai-analyze.ts
│       ├── bookmark.ts
│       ├── extraction-types.ts
│       └── openrouter.ts
├── .gitignore
├── README.md
├── directory.sh
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tsconfig.json
└── yarn.lock
```

## 주요 디렉토리 설명

### `/src/app`
Next.js 13+의 App Router를 사용하는 페이지와 API 라우트가 위치합니다.
- `api/`: API 엔드포인트 (AI 분석, 콘텐츠 추출 등)
- `settings/`: 설정 페이지
- `layout.tsx`: 공통 레이아웃
- `page.tsx`: 메인 페이지

### `/src/components`
재사용 가능한 React 컴포넌트들이 위치합니다.
- `ai/`: AI 관련 컴포넌트 (ModelSelector 등)
- `card/`: 카드 형태의 UI 컴포넌트 (BookmarkCard 등)
- `layout/`: 레이아웃 관련 컴포넌트 (Header, Sidebar, Footer)
- `modal/`: 모달 다이얼로그 (AddBookmarkModal 등)
- `settings/`: 설정 관련 컴포넌트 (ApiKeySettings 등)
- `ui/`: 기본 UI 컴포넌트들 (shadcn/ui 기반)

### `/src/hooks`
프로젝트 전반에서 재사용되는 커스텀 React Hooks이 위치합니다.
- `use-toast.ts`: 토스트 알림 관련 훅
- `use-mobile.ts`: 모바일 여부를 판단하는 훅

### `/src/lib`
유틸리티 함수와 서드파티 라이브러리 래퍼가 위치합니다.
- `ai-analyzers/`: AI 분석기 (media-ai-analyzer 등)
- `media-analyzers/`: 미디어 분석기 (video-analyzer 등)
- `scrapers/`: 웹 스크래퍼 (multi-strategy-scraper 등)
- `openrouter.ts`: OpenRouter API 클라이언트
- `utils.ts`: 공통 유틸리티 함수

### `/src/mock`
프로젝트 개발 시 사용되는 모의 데이터가 위치합니다.
- `bookmark.ts`: 북마크 관련 모의 데이터
- `categories.ts`: 카테고리 관련 모의 데이터

### `/src/types`
TypeScript 타입 정의 파일들이 위치합니다.
- `ai-analyze.ts`: AI 분석 관련 타입
- `bookmark.ts`: 북마크 관련 타입
- `extraction-types.ts`: 콘텐츠 추출 관련 타입
- `openrouter.ts`: OpenRouter API 관련 타입

### `/public`
정적 파일들이 위치합니다.
- `next.svg`, `vercel.svg`: 로고 이미지
- `window.svg`: 윈도우 아이콘

### `/src/styles`
전역 스타일이 위치합니다.
- `globals.css`: 전역 CSS 스타일

## 설정 파일
- `next.config.ts`: Next.js 설정
- `tsconfig.json`: TypeScript 설정
- `eslint.config.mjs`: ESLint 설정
- `postcss.config.mjs`: PostCSS 설정
- `package.json`: 프로젝트 의존성 및 스크립트 정의

## 의존성
- Next.js 13+ (App Router)
- TypeScript
- shadcn/ui (UI 컴포넌트 라이브러리)
- OpenRouter 연동
- 기타 유틸리티 라이브러리들

## 주요 컴포넌트 및 모듈 간 의존성

### API 계층
- `src/app/api/ai-analyze/route.ts`
  - `@/lib/ai-analyzers/media-ai-analyzer` 사용
  - `@/lib/media-analyzers/video-analyzer` 사용
  - `@/lib/scrapers/multi-strategy-scraper` 사용

- `src/app/api/extract-content/route.ts`
  - `@/lib/scrapers/multi-strategy-scraper` 사용

### 컴포넌트 계층
- `src/components/modal/AddBookmarkModal.tsx`
  - `@/components/ui`의 다양한 컴포넌트 사용 (Button, Input, Textarea 등)
  - `@/components/ai/ModelSelector` 사용
  - `@/types/bookmark`에서 타입 임포트
  - `@/mock/categories`에서 카테고리 데이터 임포트
  - `@/lib/openrouter`를 통해 AI 분석 요청

- `src/components/ai/ModelSelector.tsx`
  - `@/components/ui`의 다양한 컴포넌트 사용
  - `@/lib/openrouter`를 통해 모델 정보 조회

- `src/components/card/BookmarkCard.tsx`
  - `@/components/ui`의 컴포넌트 사용 (Card, Badge 등)
  - `@/types/bookmark`에서 타입 임포트

### 유틸리티 계층
- `src/lib/ai-analyzers/media-ai-analyzer.ts`
  - `@/lib/openrouter`를 사용하여 AI 분석 요청
  - `@/types/ai-analyze`에서 타입 임포트

- `src/lib/media-analyzers/video-analyzer.ts`
  - `@/types/extraction-types`에서 타입 임포트

- `src/lib/scrapers/multi-strategy-scraper.ts`
  - `@/types/extraction-types`에서 타입 임포트

### 상태 관리
- `src/hooks/use-toast.ts`
  - `@/components/ui/toast`에서 컴포넌트 타입 임포트

### 타입 정의
- `@/types/bookmark.ts`: 북마크 관련 타입 정의
- `@/types/ai-analyze.ts`: AI 분석 관련 타입 정의
- `@/types/extraction-types.ts`: 콘텐츠 추출 관련 타입 정의
- `@/types/openrouter.ts`: OpenRouter API 관련 타입 정의

## 의존성 흐름
1. **사용자 인터랙션** → `AddBookmarkModal`
2. **URL 분석 요청** → `multi-strategy-scraper`
3. **AI 분석 요청** → `media-ai-analyzer` → `OpenRouter API`
4. **결과 표시** → `BookmarkCard` 및 기타 UI 컴포넌트

이 문서는 프로젝트의 현재 구조와 컴포넌트 간의 관계를 반영하고 있으며, 프로젝트가 발전함에 따라 업데이트가 필요할 수 있습니다.
