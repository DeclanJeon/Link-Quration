#!/bin/bash

# 프로젝트 루트 디렉토리
ROOT_DIR="$(pwd)/src"

# 디렉토리 생성 함수
create_directories() {
  # app 디렉토리 구조 생성
  mkdir -p "${ROOT_DIR}/app/(auth)/login"
  mkdir -p "${ROOT_DIR}/app/(auth)/signup"
  mkdir -p "${ROOT_DIR}/app/api/hello"
  mkdir -p "${ROOT_DIR}/app/dashboard"
  
  # components 디렉토리 구조 생성
  mkdir -p "${ROOT_DIR}/components/common"
  mkdir -p "${ROOT_DIR}/components/layout"
  mkdir -p "${ROOT_DIR}/components/ui"
  
  # 기타 디렉토리 생성
  mkdir -p "${ROOT_DIR}/constants"
  mkdir -p "${ROOT_DIR}/contexts"
  mkdir -p "${ROOT_DIR}/hooks"
  mkdir -p "${ROOT_DIR}/lib"
  mkdir -p "${ROOT_DIR}/services"
  mkdir -p "${ROOT_DIR}/store"
  mkdir -p "${ROOT_DIR}/styles"
  mkdir -p "${ROOT_DIR}/types"
  
  echo "✅ 디렉토리 구조 생성 완료!"
}

# 기본 파일 생성 함수
create_basic_files() {
  # app 디렉토리 기본 파일 생성
  touch "${ROOT_DIR}/app/layout.tsx"
  touch "${ROOT_DIR}/app/page.tsx"
  touch "${ROOT_DIR}/app/(auth)/login/page.tsx"
  touch "${ROOT_DIR}/app/(auth)/signup/page.tsx"
  touch "${ROOT_DIR}/app/api/hello/route.ts"
  touch "${ROOT_DIR}/app/dashboard/layout.tsx"
  touch "${ROOT_DIR}/app/dashboard/page.tsx"
  
  # components 디렉토리 기본 파일 생성
  touch "${ROOT_DIR}/components/common/Button.tsx"
  touch "${ROOT_DIR}/components/common/Input.tsx"
  touch "${ROOT_DIR}/components/layout/Header.tsx"
  touch "${ROOT_DIR}/components/layout/Footer.tsx"
  touch "${ROOT_DIR}/components/ui/Card.tsx"
  touch "${ROOT_DIR}/components/ui/Modal.tsx"
  
  # 기타 기본 파일 생성
  touch "${ROOT_DIR}/constants/index.ts"
  touch "${ROOT_DIR}/contexts/AuthContext.tsx"
  touch "${ROOT_DIR}/hooks/useUserData.ts"
  touch "${ROOT_DIR}/lib/utils.ts"
  touch "${ROOT_DIR}/services/userService.ts"
  touch "${ROOT_DIR}/store/userStore.ts"
  touch "${ROOT_DIR}/styles/globals.css"
  touch "${ROOT_DIR}/types/index.ts"
  
  echo "✅ 기본 파일 생성 완료!"
}

# 메인 실행
echo "🚀 프로젝트 구조를 생성합니다..."
create_directories
create_basic_files
echo "✨ 프로젝트 구조 생성이 완료되었습니다!"