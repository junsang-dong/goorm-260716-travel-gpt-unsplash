# AI Travel Story Writer

## 기술명세서 v1.0 (Desktop Edition)

> **컨셉**
>
> "여행이 끝난 후 사진을 정리하는 앱이 아니라,
> 여행을 하나의 아름다운 이야기(Book)로 만드는 AI"

---

# 1. 프로젝트 개요

## 프로젝트명

**AI Travel Story Writer**

---

## 핵심 제안 가치(Value Proposition)

사용자가 여행 사진을 업로드하면

AI가

* 여행 장소를 이해하고
* 사진 분위기를 분석하고
* 자연스러운 하루 여행기를 작성하며
* 관련 이미지를 Unsplash에서 보강하고
* 지도, 타임라인, 사진, 스토리를 하나의 여행 저널로 만들어주는
  데스크톱 기반 AI Travel Journal.

Polarsteps의 감성적인 UX와 지도 중심 탐험 경험을 계승하면서, **AI가 여행 스토리를 자동으로 완성하는 콘텐츠 제작 도구**로 확장하는 것이 핵심입니다.

---

# 2. 개발 목표

Polarsteps의

* 미니멀 UI
* 지도 기반 여행 흐름
* 큰 사진
* 아름다운 카드 디자인

을 참고하되,

아래 기능을 추가한다.

✔ AI Story Generation

✔ AI Photo Search

✔ AI Travel Book

✔ AI Timeline

✔ AI Memory Search

---

# 3. 기술 스택

## Frontend

* React 19
* Vite
* TypeScript
* TailwindCSS v4
* shadcn/ui
* Framer Motion
* React Router

---

## Desktop

Electron

또는

Tauri (권장)

이유

* 빠른 실행
* 작은 용량
* Native File System
* SQLite 지원

---

## Backend

Vercel Serverless Functions

또는

Local Node API

---

## Database

SQLite

```text
better-sqlite3
```

사진 메타데이터 저장

여행 기록 저장

AI Story 저장

---

## 지도

Mapbox

또는

Google Maps

---

## AI

OpenAI GPT-5.5

주요 기능

* Story Generation
* Image Caption
* Emotion Analysis
* Travel Summary

---

## 이미지

Unsplash API

용도

* 대표 이미지
* 장소 분위기
* Hero Background

---

# 4. 전체 아키텍처

```text
            Photo Upload

                  │

          Image Analyzer

                  │

       EXIF + GPS + Date Parsing

                  │

         AI Story Generator
       (OpenAI Responses API)

                  │

      Unsplash Photo Search

                  │

      Story + Photos + Timeline

                  │

      SQLite Travel Database

                  │

          Desktop UI
```

---

# 5. 주요 화면

## ① Home

Polarsteps 느낌

```
------------------------------------------------

 AI Travel Story Writer

 Welcome Back

 Last Journey

 Iceland

 Japan

 Vietnam

 New Zealand

 +

------------------------------------------------
```

---

## ② Journey Detail

```
---------------------------------------

Header Image

Trip Name

2026.07

Map

Timeline

Photos

Stories

Statistics

---------------------------------------
```

---

## ③ Story Page

큰 사진

↓

AI Story

↓

사진

↓

AI Story

↓

사진

↓

Quote

↓

Map

---

Polarsteps 스타일의

Magazine Layout

---

## ④ Map View

Mapbox

사진 핀

```
●

●

●

●

```

클릭

↓

사진

↓

Story

↓

Location

---

## ⑤ Timeline

```
Day1

↓

Day2

↓

Day3

↓

Day4
```

---

## ⑥ AI Writer

```
오늘 여행기를 작성합니다.

사진

↓

GPT

↓

여행기 생성

↓

사용자 수정

↓

저장
```

---

# 6. 핵심 기능

## 여행 생성

* 새 여행 생성
* 기간 설정
* 국가
* 도시
* 여행 목적

---

## 사진 업로드

Drag & Drop

지원

* JPG
* PNG
* HEIC
* RAW

---

## EXIF 분석

자동 추출

* GPS
* 촬영 시간
* 카메라
* 렌즈

---

## AI Story Writer

입력

```
사진

위치

날짜

시간

```

↓

GPT

↓

생성

예시

> 아침의 교토는 고요했다.
>
> 이른 햇살이 오래된 골목을 비추고
>
> 작은 찻집에서는 은은한 향기가 흘러나왔다.
>
> 카메라를 들어 셔터를 누르는 순간,
>
> 여행이 시작되고 있음을 느꼈다.

---

## AI Caption

사진마다

한 줄 캡션

생성

예

> 노을이 도시를 금빛으로 물들였다.

---

## AI Summary

여행 종료

↓

한 문장

↓

한 페이지

↓

한 편의 에세이

자동 생성

---

## AI Title

자동 생성

예

> 가을의 교토를 걷다

또는

> Iceland Winter Roadtrip

---

## Unsplash 연동

AI Prompt

```
Kyoto street
autumn
golden light
travel photography
```

↓

Unsplash API

↓

Hero Image

↓

Background

↓

Story Cover

---

## AI Mood

분석

* Calm
* Adventure
* Romantic
* Hiking
* City
* Luxury
* Backpacking

---

## Travel Statistics

자동 생성

* 국가
* 도시
* 이동거리
* 사진 수
* 여행일수
* 방문장소

---

## 검색

Natural Language

예

> 제주도 바다 사진 보여줘

↓

AI

↓

검색

---

# 7. 데이터 모델

## Trip

```
id

title

country

city

startDate

endDate

coverImage

summary
```

---

## Photo

```
id

tripId

filePath

gps

latitude

longitude

date

camera

lens

aiCaption
```

---

## Story

```
id

tripId

day

content

mood

title

heroImage
```

---

## Location

```
id

tripId

name

lat

lng

visitedAt
```

---

# 8. AI 프롬프트 전략

### Story Writer

입력

```
사진 분석 결과

촬영 위치

날짜

시간

사용자의 메모
```

출력

```
여행기

감정

소제목

SNS 요약

추천 해시태그
```

---

### Unsplash Search Prompt

```
Generate the best travel photography keywords.

Location

Mood

Season

Weather

Architecture

Landscape

People

Lighting
```

---

# 9. Design.md 연동 전략

Google Stitch에서 생성한 **Design.md**를 UI 구현의 단일 기준(Single Source of Truth)으로 사용합니다.

### 반영 범위

* Color Palette
* Typography
* Grid System
* Spacing
* Card Style
* Navigation
* Animation
* Iconography
* Responsive Rule
* Component Variants

### 구현 원칙

```
Design.md
      │
      ▼
Design Tokens
      │
      ▼
Tailwind Theme
      │
      ▼
React Components
      │
      ▼
Desktop UI
```

디자인 변경 시에는 Design.md를 갱신하고, 컴포넌트는 해당 토큰을 참조하도록 구성하여 일관성을 유지합니다.

---

# 10. 차별화 기능 (AI-Native)

| 기능                            | Polarsteps | AI Travel Story Writer |
| ----------------------------- | ---------- | ---------------------- |
| 지도 기반 여행 기록                   | ✅          | ✅                      |
| 사진 중심 스토리                     | ✅          | ✅                      |
| AI 여행기 자동 작성                  | ❌          | ✅                      |
| AI 사진 캡션                      | ❌          | ✅                      |
| Unsplash 분위기 사진 자동 보강         | ❌          | ✅                      |
| AI 대표 이미지 추천                  | ❌          | ✅                      |
| 여행 감성 분석(Mood Analysis)       | ❌          | ✅                      |
| 자연어 여행 검색                     | ❌          | ✅                      |
| AI 여행 에세이 생성                  | ❌          | ✅                      |
| AI 여행 책(PDF/eBook) 생성         | 일부(인쇄 중심)  | ✅                      |
| Google Stitch 기반 Design.md 연동 | ❌          | ✅                      |

---

# 11. 향후 확장 로드맵

### Phase 1 (MVP)

* 여행 생성 및 관리
* 사진 업로드
* EXIF/GPS 분석
* AI 하루 여행기 작성
* Unsplash Hero 이미지 자동 추천
* Polarsteps 스타일 타임라인
* Design.md 기반 UI 구현

### Phase 2

* 음성 메모를 여행기로 변환
* 여행 하이라이트 영상 자동 생성
* AI 여행 지도(Story Map)
* Markdown 및 PDF 여행책 내보내기
* Obsidian Vault 연동

### Phase 3

* 다국어 여행기 생성
* 가족·친구 공동 여행 저널
* AI 여행 코치 및 회상 챗봇
* Apple Photos, Google Photos, Lightroom 연동
* MCP 기반 플러그인 확장(지도, 항공, 날씨, 숙소, 사진 편집 등)

이 명세는 **Polarsteps의 감성적인 여행 경험**과 **AI 기반 자동 콘텐츠 생성**을 결합한 AI-Native 데스크톱 애플리케이션을 목표로 하며, Google Stitch가 생성한 `Design.md`를 디자인 구현의 기준으로 사용하도록 설계되었습니다.
