#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 스크립트 시작
log_info "Link-Quration 프로젝트 의존성 설치를 시작합니다..."

# 시스템 업데이트
log_info "시스템 패키지 목록을 업데이트합니다..."
sudo apt update -y

# 기본 빌드 도구 설치
log_info "기본 빌드 도구를 설치합니다..."
sudo apt install -y \
    build-essential \
    python3 \
    python3-pip \
    make \
    g++ \
    curl \
    wget \
    git

# Chromium 및 Playwright/Puppeteer 의존성 설치
log_info "Chromium 및 브라우저 자동화 도구 의존성을 설치합니다..."
sudo apt install -y \
    chromium-browser \
    libnss3-dev \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libglib2.0-0 \
    libgtk-3-0 \
    libpangocairo-1.0-0 \
    libxrandr2 \
    libasound2 \
    libatk1.0-0 \
    libcups2 \
    libxss1 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    libgbm-dev \
    libxshmfence1

# Sharp 이미지 처리 라이브러리 의존성 설치
log_info "Sharp 이미지 처리 라이브러리 의존성을 설치합니다..."
sudo apt install -y \
    libvips-dev \
    libvips42 \
    libjpeg-dev \
    libpng-dev \
    libwebp-dev \
    libgif-dev \
    librsvg2-dev \
    libexif-dev \
    libtiff5-dev

# Canvas 의존성 설치
log_info "Canvas 라이브러리 의존성을 설치합니다..."
sudo apt install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config

# TensorFlow 의존성 설치
log_info "TensorFlow 의존성을 설치합니다..."
sudo apt install -y \
    libc6 \
    libstdc++6 \
    libgcc1

# 추가 유틸리티 설치
log_info "추가 유틸리티를 설치합니다..."
sudo apt install -y \
    ffmpeg \
    imagemagick \
    graphicsmagick

# 시스템 정리
log_info "시스템을 정리합니다..."
sudo apt autoremove -y
sudo apt autoclean -y

# 설치 완료
log_info "========================================="
log_info "모든 시스템 의존성 설치가 완료되었습니다!"
log_info "========================================="