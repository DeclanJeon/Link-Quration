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
│   │   │   ├── bookmarks/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── extract-content/
│   │   │   │   └── route.ts
│   │   │   ├── media-detect/
│   │   │   │   └── route.ts
│   │   │   ├── media-timeline/
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

### `/src/constants`
상수 값 정의 (현재 비어있음)

### `/src/contexts`
React 컨텍스트 (현재 비어있음)

### `/src/app`
Next.js 13+의 App Router를 사용하는 페이지와 API 라우트가 위치합니다.
- `api/`: API 엔드포인트
  - `ai-analyze/route.ts`: URL을 분석하여 AI 기반 메타데이터 추출
  - `bookmarks/[id]/route.ts`: 특정 북마크에 대한 API 엔드포인트
  - `extract-content/route.ts`: 웹 페이지에서 콘텐츠 추출
  - `media-detect/route.ts`: 미디어 콘텐츠 감지 및 분석
  - `media-timeline/route.ts`: 미디어 타임라인 관련 API
  - `analize-url.js`: 레거시 URL 분석기 (구현 예정)
- `settings/page.tsx`: 애플리케이션 설정 페이지
- `layout.tsx`: 전역 레이아웃 컴포넌트
- `page.tsx`: 메인 페이지 컴포넌트

### `/src/components`
재사용 가능한 React 컴포넌트들이 모여있습니다.

#### `/modal`
북마크 추가/수정 관련 모달 컴포넌트
- `AddBookmarkModal.tsx`: 북마크 추가/수정 메인 모달
- `BookmarkDetailModal.tsx`: 북마크 상세 정보 표시 모달
- `tabs/`: 모달 내 탭 컴포넌트들
  - `AIAnalysisTab.tsx`: AI 분석 결과 표시
  - `AdvancedTab.tsx`: 고급 설정 옵션
  - `BasicInfoTab.tsx`: 기본 정보 입력
  - `MediaAnalysisTab.tsx`: 미디어 분석 결과 표시
  - `PreviewTab.tsx`: 북마크 미리보기

#### `/ai`
AI 관련 컴포넌트
- `ModelSelector.tsx`: AI 모델 선택 드롭다운

#### `/card`
카드 형태의 UI 컴포넌트
- `BookmarkCard.tsx`: 북마크 아이템 표시 카드

#### `/layout`
레이아웃 관련 컴포넌트
- `Header.tsx`: 상단 네비게이션 바
- `Sidebar.tsx`: 사이드 메뉴
- `Footer.tsx`: 하단 푸터

#### `/settings`
설정 관련 컴포넌트
- `ApiKeySettings.tsx`: API 키 관리 컴포넌트

#### `/ui`
기본 UI 컴포넌트 (shadcn/ui 기반)
- 다양한 기본 UI 컴포넌트들 (버튼, 입력창, 다이얼로그 등)

### `/src/hooks`
재사용 가능한 커스텀 React Hooks
- `useAIAnalysis.ts`: AI 분석 관련 로직 처리
- `useBookmarkForm.ts`: 북마크 폼 상태 관리
- `useContentExtraction.ts`: 웹 페이지 콘텐츠 추출
- `useMediaDetection.ts`: 미디어 콘텐츠 감지 훅
- `use-mobile.ts`: 반응형 디자인을 위한 모바일 감지
- `use-toast.ts`: 사용자 알림 표시

### `/src/lib`
유틸리티 함수와 서드파티 라이브러리 통합

#### `/ai-analyzers`
AI 분석 관련 유틸리티
- `media-ai-analyzer.ts`: 미디어 콘텐츠 분석을 위한 AI 분석기

#### `/media-analyzers`
미디어 파일 분석 유틸리티
- `audio-analyzer.ts`: 오디오 콘텐츠 분석
- `media-detector.ts`: 미디어 콘텐츠 감지
- `video-analyzer.ts`: 비디오 메타데이터 분석

#### `/scrapers`
웹 스크래핑 유틸리티
- `multi-strategy-scraper.ts`: 다양한 전략을 사용한 웹 스크래퍼

#### 기타 유틸리티
- `openrouter.ts`: OpenRouter API 연동 유틸리티
- `utils.ts`: 공통 유틸리티 함수
- `openrouter.ts`: OpenRouter API 클라이언트
- `utils.ts`: 공통 유틸리티 함수

### `/src/mock`
모의 데이터 파일들
- `bookmark.ts`: 북마크 모의 데이터
- `categories.ts`: 카테고리 모의 데이터

### `/src/services`
서비스 레이어 (현재 비어있음)
- `extraction-types.ts`: 콘텐츠 추출 관련 타입
- `extraction.ts`: 추출 기능 타입
- `openrouter.ts`: OpenRouter API 응답 타입

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

### `/` (루트 디렉토리)
- `next.config.ts`: Next.js 애플리케이션 설정 (TypeScript, 환경 변수, 빌드 옵션 등)
- `tsconfig.json`: TypeScript 컴파일러 옵션 (경로 별칭, 모듈 해석 등)
- `eslint.config.mjs`: 코드 품질 관리를 위한 ESLint 설정 (규칙, 플러그인, 확장)
- `postcss.config.mjs`: CSS 처리 도구 설정 (TailwindCSS, Autoprefixer 등)
- `package.json`: 프로젝트 메타데이터, 의존성, 스크립트 정의
- `.gitignore`: Git이 무시할 파일/디렉토리 목록
- `next-env.d.ts`: Next.js TypeScript 타입 정의
- `directory.sh`: 디렉토리 구조 생성 유틸리티 스크립트

## 의존성

### 주요 의존성
- **Next.js 13+**: React 기반의 서버 사이드 렌더링 프레임워크 (App Router 사용)
- **TypeScript**: 정적 타입 체크를 위한 JavaScript 슈퍼셋
- **shadcn/ui**: 재사용 가능한 UI 컴포넌트 라이브러리
- **OpenRouter**: 다양한 AI 모델에 접근하기 위한 통합 API
- **React Hook Form**: 폼 상태 관리 및 유효성 검사
- **Zod**: 런타임 타입 검증 라이브러리
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **Axios**: HTTP 클라이언트 라이브러리
- **React Query**: 서버 상태 관리
- **Zustand**: 경량 상태 관리 라이브러리
- **date-fns**: 날짜 유틸리티 라이브러리

### 개발 의존성
- **ESLint**: JavaScript/TypeScript 린팅 도구
- **Prettier**: 코드 포맷터
- **TypeScript**: 타입 체크
- **Jest**: 테스트 프레임워크
- **Testing Library**: React 컴포넌트 테스트
- **MSW (Mock Service Worker)**: API 모킹
- **Husky**: Git 훅 관리

## 주요 기능

### 1. 북마크 관리
- URL을 통한 웹 페이지 콘텐츠 자동 추출
- 북마크 추가/수정/삭제
- 카테고리별 북마크 분류

### 2. AI 기반 분석
- 웹 페이지 콘텐츠 자동 분석
- 메타데이터 추출 (제목, 설명, 키워드 등)
- 콘텐츠 요약 및 분류

### 3. 미디어 분석
- 비디오 콘텐츠 분석
- 미디어 메타데이터 추출

### 4. 설정
- API 키 관리
- UI 테마 설정
- 내보내기/가져오기 기능

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
