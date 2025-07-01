This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
🔗 Link Curation - AI-Powered Smart Bookmark Manager
Next.jsReactTypeScriptAI Powered

🚀 당신의 디지털 정보 관리를 혁신하는 차세대 북마크 솔루션
AI가 링크를 분석하고, 브라우저가 데이터를 보호하며, 당신이 지식을 큐레이션합니다.


🌟 Link Curation이 특별한 이유
1. 🤖 당신만의 AI 비서, OpenRouter.ai 통합
Link Curation은 OpenRouter.ai API를 활용하여 강력한 AI 기능을 제공합니다. GPT-3.5, GPT-4, Claude 등 원하는 AI 모델을 자유롭게 선택하여 다음과 같은 작업을 수행할 수 있습니다:

📝 링크 내용 요약: 복잡하고 긴 웹페이지의 핵심 내용을 AI가 간결하게 요약
🔍 정보 스크래핑 및 정리: 웹페이지에서 필요한 정보를 정확하게 추출하고 구조화
🎯 맞춤형 정보 큐레이션: AI가 당신의 관심사에 맞춰 링크 내용을 분석하고 큐레이션
2. 🔐 브라우저 기반의 강력한 개인 정보 보호
서버 측 데이터베이스를 사용하지 않는 혁신적인 접근 방식:

🛡️ 최고 수준의 프라이버시: 모든 데이터는 당신의 브라우저에만 존재
⚡ 빠른 접근성: 서버 통신 없이 즉시 데이터 로드
👑 데이터 주권: 당신의 북마크는 온전히 당신의 통제 하에
3. 🤝 유연한 북마크 공유 기능
개인적인 정보 관리를 넘어 지식 공유의 플랫폼으로:

특정 링크나 큐레이션된 내용을 손쉽게 공유
협업 프로젝트나 스터디 그룹에서 활용
지식 교류 활성화
✨ 주요 기능
📚 스마트 북마크 관리
웹 페이지 콘텐츠 자동 추출
카테고리별 북마크 구성
태그 기반 검색 및 필터링
시각적 미리보기
🔧 강력한 스크래핑 엔진
멀티 전략 스크래핑 지원
이미지 강화 전략
브라우저 풀링 고성능 처리
실시간 모니터링
🧠 AI 기반 분석
콘텐츠 자동 분류
키워드 추출
요약 생성
미디어 콘텐츠 분석
🎨 직관적인 UI/UX
반응형 디자인
다크 모드 지원
드래그 앤 드롭
실시간 미리보기
🎯 이런 분께 추천합니다!
📊 정보 과부하에 시달리는 분: 방대한 웹 정보를 효율적으로 관리하고 싶은 분
🤖 AI 활용에 관심 있는 분: AI를 활용해 링크를 심층 분석하고 싶은 분
🔒 프라이버시 중시하는 분: 개인 정보 보호를 최우선으로 생각하는 분
🌐 지식 공유를 좋아하는 분: 유용한 정보를 다른 사람들과 나누고 싶은 분
🚀 기술 스택
🎨 프론트엔드	⚙️ 백엔드	💾 데이터베이스	🧠 AI/ML
• Next.js 15
• React 19
• TypeScript
• Tailwind CSS
• Radix UI	• Node.js
• Puppeteer
• Playwright
• Cheerio
• Express	• IndexedDB
• Local Storage
• Browser APIs	• OpenRouter.ai
• TensorFlow.js
• COCO-SSD
• NLP Models
🛠️ 빠른 시작
1️⃣ 설치
Copy# 저장소 클론
git clone https://github.com/your-username/link-curation.git
cd link-curation

# 의존성 설치
npm install
# 또는
yarn install
# 또는
pnpm install
2️⃣ 환경 설정
Copy# .env.local 파일 생성
cp .env.example .env.local

# OpenRouter API 키 설정
OPENROUTER_API_KEY=your_api_key_here
3️⃣ 실행
Copy# 개발 서버 실행
npm run dev
# 또는
yarn dev
# 또는
pnpm dev

# 브라우저에서 접속
# http://localhost:3000
📂 프로젝트 구조
📦 link-curation/
├── 📁 src/
│   ├── 📁 app/                  # Next.js 앱 라우터
│   ├── 📁 components/           # 재사용 가능한 UI 컴포넌트
│   │   ├── 📁 ui/               # 기본 UI 컴포넌트
│   │   ├── 📁 features/         # 기능별 컴포넌트
│   │   └── 📁 layouts/          # 레이아웃 컴포넌트
│   ├── 📁 lib/                  # 유틸리티 및 도우미 함수
│   │   ├── 📁 db/               # 데이터베이스 관련
│   │   ├── 📁 scrapers/         # 웹 스크래핑 엔진
│   │   ├── 📁 ai-analyzers/     # AI 분석 모듈
│   │   └── 📁 utils/            # 공통 유틸리티
│   ├── 📁 hooks/                # 커스텀 React 훅
│   ├── 📁 services/             # 비즈니스 로직
│   ├── 📁 store/                # 상태 관리 (Zustand)
│   └── 📁 types/                # TypeScript 타입 정의
├── 📁 public/                   # 정적 파일
├── 📁 tests/                    # 테스트 파일
└── 📄 package.json              # 프로젝트 설정
🧪 테스트
Copy# 단위 테스트 실행
npm test

# E2E 테스트 실행
npm run test:e2e

# 코드 커버리지 확인
npm run test:coverage

# 린트 검사
npm run lint
📸 스크린샷
메인 화면
메인 대시보드	AI 분석
AI 분석 결과
북마크 관리
북마크 관리	공유 기능
공유 기능
🤝 기여하기
Link Curation은 오픈소스 프로젝트입니다. 기여는 언제나 환영합니다!

🍴 이 저장소를 포크하세요
🌿 새로운 브랜치를 만드세요: git checkout -b feature/amazing-feature
💻 변경사항을 커밋하세요: git commit -m 'Add some amazing feature'
📤 브랜치에 푸시하세요: git push origin feature/amazing-feature
🎉 풀 리퀘스트를 열어주세요
기여 가이드라인
코드 스타일 가이드를 준수해주세요
테스트를 작성해주세요
문서를 업데이트해주세요
의미 있는 커밋 메시지를 작성해주세요
📜 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다.

📞 연락처

Your Name
📧 Email

GitHub Demo

Link Curation - 당신의 디지털 정보 관리 방식을 한 단계 업그레이드하세요! 🚀

Made with ❤️ by Your Name | © 2025 Link Curation