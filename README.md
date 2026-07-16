# AI Travel Story Writer

사진을 올리면 AI가 하루의 여행기를 써 주는 웹 MVP입니다.  
데이터는 브라우저 IndexedDB에 저장되고, OpenAI·Unsplash는 서버 API를 통해 호출합니다.

리포지토리: [junsang-dong/goorm-260716-travel-gpt-unsplash](https://github.com/junsang-dong/goorm-260716-travel-gpt-unsplash)

---

## 이번 작업 주요 내용

### 1. 웹 MVP 기반
- React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router + Framer Motion
- IndexedDB (`trips` / `photos` / `stories` / `locations`) — 로그인·동기화 없음
- Electron / Tauri는 다음 단계

### 2. 새 여행 입력 UX
- 필드: 여행 제목 · 간단한 설명글 · 국가 또는 도시 · 여행 날짜
- **예시로 시작하기** 3종 (리스본 트램 / 오사카 밤 / 스위스 시장)

### 3. Unsplash 상세 연동 + 사진 선택
- `/api/unsplash` 액션: `search` / `detail` (`GET /photos/:id`) / `track-download`
- `UnsplashPicker`: 검색 그리드 → 선택 시 위치·태그·설명·EXIF 미리보기 → 적용
- Trip Detail **Unsplash Hero 선택**, Story Editor **Hero 사진 고르기**
- `unsplashMeta`를 Trip/Story에 저장 (IndexedDB)

### 4. AI 프롬프트 주입
- `/api/story`에 `unsplashContext`(description, location, tags, camera, photographer) 전달
- 여행기·캡션 생성 시 Unsplash 메타데이터를 문맥으로 사용

### 5. React-Leaflet GPS 지도
- Map mock → **OpenStreetMap** (`leaflet` + `react-leaflet`)
- 업로드 사진 EXIF GPS → `locations` → Marker / Popup / fitBounds
- 하단 핀 리스트 클릭 시 `flyTo`
- `locations` 없으면 사진의 lat/lng로 폴백

### 6. 랜딩 히어로
- Chris Lawton Unsplash 사진 배경 (`public/images/hero-chris-lawton.jpg`)
- 하단 작가 크레딧 링크 표시

### 화면 경로

| 경로 | 설명 |
|------|------|
| `/` | 여행 목록 · 새 여행 생성 |
| `/trips/:id` | Overview / Photos / Timeline / Map (OSM) |
| `/trips/:id/story/:day` | AI 여행기 · Hero 선택 · 캡션 |

---

## 오류 · 이슈 수정 사항

| 이슈 | 조치 |
|------|------|
| Unsplash 검색만으로는 location/tags 부족 | `GET /photos/:id` detail 연동, 선택 시에만 호출해 rate limit 절약 |
| Hero 자동 1장 적용으로 선택권 부족 | `UnsplashPicker`로 다중 후보 선택 UI 도입 |
| AI가 Unsplash 맥락을 모름 | `unsplashContext`를 스토리/캡션 프롬프트에 주입 |
| Map mock으로 실제 위치 확인 불가 | React-Leaflet + OSM Marker로 교체 |
| Vite에서 Leaflet 기본 마커 아이콘 깨짐 | 번들된 marker PNG로 `L.icon` 설정 |
| 랜딩 히어로가 일반 스톡 이미지 | Chris Lawton 사진 + Unsplash 크레딧으로 교체 |
| API 키 클라이언트 노출 위험 | Serverless / Vite 미들웨어에서만 키 로드 |
| `.env` 시크릿 커밋 위험 | `.gitignore`에 `.env` 제외, `.env.example`만 커밋 |

---

## 스택

- React 19 + Vite + TypeScript
- Tailwind CSS v4 + Framer Motion + React Router
- IndexedDB (`idb`) + EXIF (`exifr`)
- Vercel Serverless (`/api/story`, `/api/unsplash`)
- 지도: **React-Leaflet + OpenStreetMap**

---

## 로컬 실행

```bash
cp .env.example .env
# .env에 OPENAI_API_KEY, UNSPLASH_ACCESS_KEY 입력

npm install
npm run dev
```

브라우저: http://localhost:5173

### 환경 변수

```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
UNSPLASH_ACCESS_KEY=
```

> `.env`는 Git에 커밋되지 않습니다.

---

## Vercel 배포 가이드

### 사전 준비
1. 코드가 GitHub에 푸시되어 있어야 합니다 (이 리포지토리).
2. [Vercel](https://vercel.com) 계정으로 로그인 (GitHub 연동 권장).
3. OpenAI / Unsplash API 키를 준비합니다.

### 배포 절차
1. [vercel.com/new](https://vercel.com/new) → **Import** `junsang-dong/goorm-260716-travel-gpt-unsplash`
2. Framework Preset: **Vite** (자동 감지되는 경우가 많음)
3. Build Command: `npm run build` / Output Directory: `dist` (기본값 유지)
4. **Environment Variables**에 등록 (Production / Preview 모두 권장):
   - `OPENAI_API_KEY` — 필수
   - `UNSPLASH_ACCESS_KEY` — 필수
   - `OPENAI_MODEL` — 선택 (기본 `gpt-4o`)
5. **Deploy** 클릭

### 동작 확인 포인트
- `/` 랜딩·여행 생성
- `/api/story`, `/api/unsplash`가 404가 아닌지 (Serverless Functions)
- SPA 직접 URL (`/trips/...`) 새로고침 시 404가 아닌지 (`vercel.json` rewrite)
- AI·Unsplash 호출 시 키 오류가 없는지 (Vercel 프로젝트 → Settings → Environment Variables)

### CLI로 배포하는 경우 (선택)

```bash
npm i -g vercel
vercel login
vercel          # Preview
vercel --prod   # Production
```

환경 변수는 대시보드에 넣거나 `vercel env add`로 등록합니다.

### 참고
- 여행·사진 데이터는 **각 사용자 브라우저 IndexedDB**에만 저장됩니다 (서버 DB 없음).
- Unsplash Demo 모드 rate limit: 시간당 약 50회 — Production 승인 시 상향.
- 이미지 URL은 Unsplash 가이드에 따라 hotlink + 적용 시 download track을 사용합니다.

---

## MVP 범위 / 다음 단계

**포함:** 여행 CRUD, 사진 업로드·EXIF, AI 여행기·캡션, Unsplash Hero 선택·메타 주입, 타임라인, OSM GPS 지도  

**다음 단계:** Electron/Tauri, SQLite, Mapbox, HEIC/RAW, 자연어 검색, PDF/eBook, 로그인·동기화, 날씨 API
