# 인계 프롬프트 — Phi 1년제 프로그램 페이지 (2026-10-17 갱신)

> 새 Claude 세션에 "BI_랜더링_파일/인계프롬프트.md 읽고 이어서 해줘"라고 하면 된다.
> 사용자는 한국어로 대화한다. 답도 한국어로, 짧고 쉽게.

---

## 1. 무엇을 하고 있나

Phi 1년제 프로그램 페이지(GitHub `Ssio9X/phi-programs`, GitHub Pages https://ssio9x.github.io/phi-programs/ — `main` 브랜치가 배포됨)를
Figma 파일 `SYr3Mjh6cOEh81jKnqmqCZ`("[1기] Beautiful Interface 디자인용") 기준으로 섹션별로 교체 중.

- 미리보기 아티팩트(비공개): https://claude.ai/artifact/LFMddaan9AYtrs4um8C93E
- 로컬 사본: `BI_랜더링_파일/site_snapshot/` (index.html + 이번에 바뀐 assets만). 나머지 에셋은 저장소/아티팩트에 있음.
- 맥미니 저장소 클론: `~/phi-programs`

### 섹션 상태
| 섹션 | Figma | 상태 |
|---|---|---|
| 히어로 (스크롤 스토리 Hero → 21) | 시나리오 섹션 7013:1724, Hero 6971:3281 | ✅ 10/17 교체 |
| 주요 수업들 (크림 카드 12개 + 교실 사진) | 시나리오 21번 7013:1648 | ✅ |
| 프로그램 구조 | 6891:839 | ✅ |
| 수업을 관통하는 접근 | 6906:6568 (10/17 수정본) | ✅ 10/17 교체 |
| 커리큘럼 | 6892:1052 | ✅ |
| 채용 연계 · 푸터 · 모달 | — | 기존 코드 (다음 교체 대상) |

---

## 2. 히어로 (index.html 스크립트 "Hero: pinned scroll story")

- 1920×1080 디자인 캔버스를 `S = min(vw/1920, vh/1080)`로 스케일. 배경 `#0d0d0d`(사용자 요청).
- `K` = 각 Figma 프레임의 스크롤 위치(뷰포트 높이 단위). **사용자 요청으로 처음 버전의 4배 길이**(f20 = 32.8). 키프레임 사이는 smootherstep 감속, 스크롤 관성 0.06.
- 흐름: 소개 글 + FUNDAMENTALS OVER TOOLS → 조각상이 정면으로 돌며 가운데로 → 로고 페이드 → 다섯 원칙(NO.1~5) 하나씩(반→완전) → 카드가 아래에서 올라와 공전(태도 Phi OS 먼저) → 카드 위로 퇴장 → 얼굴 확대 → PHI OPERATING SYSTEM → 로고가 스크롤되며 주요 수업들이 바로 아래 붙음(518 디자인 px).
- 다섯 원칙: `assets/five-principles.svg`(Figma 7009:256의 2× export) 한 장을 `<svg><use>` 창 5개로 잘라 씀. **번호는 카드 순서에 맞춤**(2 Discovering, 4 Dissatisfaction — Figma와 다름, 사용자 승인). 카드 3번 영문은 "Unpacking Invisible Decisions".
- ⚠️ 벡터(.pr-w, .fot, .phios)에 `will-change` 넣지 말 것 — 축소 해상도로 래스터돼서 글자가 깨짐(실제로 겪음).
- Hero 화면 안내선은 Figma에서 빠져서 제거(10/17). 소개 글 top 244.

### 조각상
- 상반신 렌더 `scripts/bust.py` (카메라 거리 = turntable.py와 같음, 화각만 좁힘, 머리~엉덩이 z 0.80–1.86m, 1800×2000).
  - `--x25` → 4500×5000 (`bust/bust25x_*.png`), `--test` → 저해상도 빠른 확인.
- 사이트 에셋 `assets/statue/`:
  - `q00~q19` = +30°→−27° 3° 간격 1800×2000 webp q90 (회전 중 캔버스), `m00~m19` = 1200×1333 (폰).
  - `a18.webp`(+18°, 첫 화면) / `f27.webp`(−27°, 정면) = 4500×5000 고해상도 정지 이미지 — 캔버스 아닌 `<img>`로 표시.
  - 첫 화면 각도는 **사용자가 고른 +18°**(Figma는 +30°). 회전은 q04→q19만 씀(`SEQ_0 = 4`).
- 페이지는 이미지를 `scaleX(-1)`로 좌우반전해서 보여줌 → 렌더 각도 +면 화면에서 왼쪽을 봄, −27°가 정면.
- `POSE` = 프레임별 조각상 상자 [left, top, scale]. Figma 시안의 조각상은 블렌더 스크린샷/0° 임시 이미지라 머리 위치 기준으로 맞춤.

---

## 3. 수업을 관통하는 접근 (`#approach`, `.ap2`)
- 머리말(핵심 수업 장치 / 제목 / 설명, 왼쪽 정렬) → 둥근 사진 카드가 전체 화면으로 커짐 → 가운데 영문 제목 60px + 설명, 양옆 화살표.
- 01~06은 스크롤로 넘어감(장면당 3뷰포트), 화살표는 이전/다음 장면으로 스크롤. 사진 `ap-1~6.webp`는 Figma 배치대로 1920×1080 크롭.
- 01 Live Demo 설명은 Figma가 섹션 소개문을 중복해서 원래 라이브데모 문구 유지.

---

## 4. 블렌더 장면 (`blend/statue_kas633.blend`)
- Cycles GPU(Metal) 128 samples, AgX Medium High Contrast, 필름 투명. KAS633 소포클레스(SMK, Public Domain), 높이 1.8m.
- 조명 Key/Fill/Rim/Kicker + 어깨 그림자용 Flag. 재질 "Marble"(아이보리 무광, 가는 결 — 크랙처럼 보인다는 지적 있었음, 미정).
- 렌더 예: `B=/Applications/Blender.app/Contents/MacOS/Blender; R=~/Desktop/BI_랜더링_파일`
  `$B -b $R/blend/statue_kas633.blend -P $R/scripts/bust.py -- $R/bust <각도...>` (장당 약 1분, `--x25`는 5~6분)
- 웹 변환: `cwebp -q 90 -alpha_q 95 -m 6` (cwebp는 homebrew)

---

## 5. 남은 일 / 선택지
1. 채용 연계 · 푸터 · 모달 섹션 Figma로 교체.
2. 회전 프레임 2배(3600×4000) 재렌더 — 약 1.5시간, 메모리 ~1.1GB라 비추천했음. 사용자가 원본 해상도 써보고 결정하기로.
3. 커리큘럼 저해상도 사진(cur-2~4) 원본 확보, 모바일 히어로 배치.

## 6. 사용자 취향·작업 방식
- Figma 시안의 오류·중복은 구현 전에 짚고 기본안 제시. 아직 안 바꾼 섹션 연결은 묻지 말 것.
- 스크롤은 토스(toss.im)처럼 장면이 오래 머물고 천천히 바뀌는 걸 선호(현재 4배).
- 조각상: 하드한 그림자, 수염 명암 건드리지 말 것, 부분 수정은 그 부분만 + 전/후 비교.
- 결과물은 이 폴더 안에. 바탕화면 어지럽히지 말 것. 대용량 다운로드는 사용자가 직접.
- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
