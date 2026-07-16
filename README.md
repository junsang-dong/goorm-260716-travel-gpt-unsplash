# AI Travel Story Writer

사진을 올리면 AI가 하루의 여행기를 써 주는 웹 MVP입니다.  
데이터는 브라우저 IndexedDB에 저장되고, OpenAI·Unsplash는 서버 API를 통해 호출합니다.

리포지토리: [junsang-dong/goorm-260716-travel-gpt-unsplash](https://github.com/junsang-dong/goorm-260716-travel-gpt-unsplash)

---

## 이번 작업 주요 내용

### 1. 웹 MVP 스캐폴딩
- React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router + Framer Motion
- Polarsteps 감성의 미니멀 UI (Fraunces / Source Sans 3, 풀블리드 히어로)
- Electron / Tauri는 다음 단계로 보류, **웹 우선**으로 구현

### 2. IndexedDB 로컬 저장
- `trips` / `photos` / `stories` / `locations` 스토어
- 사진 Blob·썸네일 저장, 새로고침 후에도 유지
- 로그인·클라우드 동기화 없음 (브라우저 로컬 전용)

### 3. 화면
| 경로 | 설명 |
|------|------|
| `/` | 여행 목록 · 새 여행 생성 |
| `/trips/:id` | Overview / Photos / Timeline / Map mock |
| `/trips/:id/story/:day` | AI 여행기 생성·편집 · 캡션 |

### 4. 사진 업로드 & EXIF
- JPG / PNG / WebP 드래그 앤 드롭
- `exifr`로 GPS · 촬영일 · 카메라 메타데이터 추출
- GPS가 있으면 Map mock 핀으로 표시

### 5. AI · Unsplash API
- `/api/story` — OpenAI로 하루 여행기 · 제목 · 무드 · SNS 요약 · 해시태그 · 캡션
- `/api/unsplash` — Hero / 커버 이미지 검색
- API 키는 `.env`에만 두고 서버 측에서만 사용 (클라이언트 미노출)
- Vite 개발 서버 미들웨어로 로컬에서도 `/api/*` 동일 경로 사용

### 6. 새 여행 입력 UX 개선
입력 항목을 아래처럼 단순화했습니다.
- 여행 제목
- 여행에 대한 간단한 설명글
- 국가 또는 도시
- 여행 날짜

**예시로 시작하기** 버튼 3개:
1. 해 질 무렵 리스본의 트램
2. 오사카의 밤 거리
3. 스위스 전통 시장

예시 선택 시 제목·설명·장소·날짜가 폼에 자동 채워집니다.  
장소 문자열(`Portugal · Lisbon`)은 파싱해 `country` / `city`로 저장하고, 설명글은 `summary`로 저장합니다.

### 7. 배포 준비
- `vercel.json` SPA rewrite (`/api` 제외)
- `.env.example` · 로컬 실행 가이드

---

## 오류 · 이슈 수정 사항

| 이슈 | 조치 |
|------|------|
| 비어 있지 않은 디렉터리에서 `create-vite` 취소 | 임시 폴더에 생성 후 루트로 복사해 스캐폴딩 |
| TypeScript 6 `baseUrl` deprecation으로 빌드 실패 | `ignoreDeprecations: "6.0"` 추가 |
| `exifr` 옵션 타입 불일치 (`ifd0: boolean`) | 불필요 옵션 제거, `gps` + `pick`만 사용 |
| Vercel용 SQLite/`better-sqlite3` 비호환 | 웹 MVP는 IndexedDB로 대체 |
| Vite `--host` 시 `uv_interface_addresses` 시스템 오류 | localhost(`--port 5173`)로 실행 |
| API 키 클라이언트 노출 위험 | Serverless / Vite 미들웨어에서만 키 로드 |
| 새 여행 폼의 국가·도시·시작·종료일 분산 | 단일 장소·단일 날짜 + 설명글 필드로 통합 |
| Object URL / 업로드 커버 ephemeral 이슈 | 커버는 Unsplash URL 우선, 로컬 Blob URL 커버 저장 제거 |

---

## 스택

- React 19 + Vite + TypeScript
- Tailwind CSS v4 + Framer Motion + React Router
- IndexedDB (`idb`) + EXIF (`exifr`)
- Vercel Serverless (`/api/story`, `/api/unsplash`)
- 지도: 목업 (Mapbox 미연동)

---

## 로컬 실행

```bash
cp .env.example .env
# .env에 OPENAI_API_KEY, UNSPLASH_ACCESS_KEY 입력

npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다.

Vite 개발 서버가 `/api/*`를 같은 프로세스로 처리하므로 `vercel dev` 없이도 API를 검증할 수 있습니다.

### 환경 변수

```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
UNSPLASH_ACCESS_KEY=
```

> `.env`는 Git에 커밋되지 않습니다. 키는 로컬·Vercel 대시보드에만 등록하세요.

---

## Vercel 배포

1. GitHub 리포지토리 Import
2. Framework Preset: **Vite**
3. Environment Variables 등록: `OPENAI_API_KEY`, `OPENAI_MODEL`(선택), `UNSPLASH_ACCESS_KEY`
4. Deploy

---

## MVP 범위 / 다음 단계

**포함:** 여행 CRUD, 사진 업로드·EXIF, AI 여행기·캡션, Unsplash Hero, 타임라인, 지도 목업  

**다음 단계:** Electron/Tauri, SQLite, 실지도 SDK, HEIC/RAW, 자연어 검색, PDF/eBook, 로그인·동기화
