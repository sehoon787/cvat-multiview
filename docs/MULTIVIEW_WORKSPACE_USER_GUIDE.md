# CVAT Multiview Workspace 사용자 가이드

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [애플리케이션 실행](#애플리케이션-실행)
3. [데이터 업로드 및 Task 생성](#데이터-업로드-및-task-생성)
4. [Multiview Workspace 개요](#multiview-workspace-개요)
5. [라벨링 방법](#라벨링-방법)
6. [라벨링 도구 설명](#라벨링-도구-설명)
7. [결과물 저장](#결과물-저장)
8. [결과물 내보내기 및 확인](#결과물-내보내기-및-확인)
9. [단축키](#단축키)
10. [문제 해결](#문제-해결)

---

## 시스템 요구사항

- **Docker**: Docker Desktop 또는 Docker Engine
- **Docker Compose**: v2.0 이상
- **메모리**: 최소 8GB RAM (16GB 권장)
- **디스크 공간**: 최소 50GB
- **브라우저**: Chrome, Firefox, Edge (최신 버전 권장)

---

## 애플리케이션 실행

### 1. Docker를 사용한 실행

```bash
# 프로젝트 디렉토리로 이동
cd cvat

# Docker Compose로 서비스 시작
docker compose up -d
```

### 2. 개발 모드로 실행

```bash
# 개발용 설정으로 실행
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 3. 서비스 확인

```bash
# 실행 중인 컨테이너 확인
docker compose ps
```

### 4. 접속

브라우저에서 다음 주소로 접속:
- **URL**: `http://localhost:8080`
- **기본 관리자 계정**:
  - 사용자명: `admin`
  - 비밀번호: 초기 설정 시 지정

### 5. 서비스 중지

```bash
docker compose down
```

---

## 데이터 업로드 및 Task 생성

### 1. 프로젝트 생성 (선택사항)

1. 상단 메뉴에서 **Projects** 클릭
2. **+** 버튼 또는 **Create a new project** 클릭
3. 프로젝트 이름 및 설명 입력
4. **Submit** 클릭

### 2. Task 생성

1. 상단 메뉴에서 **Tasks** 클릭
2. **+** 버튼 클릭하여 새 Task 생성

### 3. 기본 정보 입력

| 항목 | 설명 |
|------|------|
| **Name** | Task 이름 (필수) |
| **Project** | 연결할 프로젝트 (선택) |
| **Labels** | 라벨 정의 (필수) |

### 4. 라벨 정의

```
예시:
- Sound (Rectangle 또는 Polygon 용)
- Person (Rectangle 용)
- Car (Rectangle 용)
```

라벨 추가 방법:
1. **Add label** 클릭
2. 라벨 이름 입력
3. 색상 선택
4. 속성(Attribute) 추가 (선택사항)

### 5. 데이터 업로드

#### Multiview Task를 위한 데이터 구조

Multiview 작업을 위해서는 5개의 동기화된 비디오 파일이 필요합니다:

```
multiview_data/
├── view1.mp4  # 카메라 1 영상
├── view2.mp4  # 카메라 2 영상
├── view3.mp4  # 카메라 3 영상
├── view4.mp4  # 카메라 4 영상
└── view5.mp4  # 카메라 5 영상
```

#### 업로드 방법

**방법 1: 로컬 파일 업로드**
1. **Select files** 클릭
2. 비디오 파일 5개 선택
3. 파일 업로드 완료 대기

**방법 2: 연결된 파일 공유 사용**
1. **Connected file share** 탭 선택
2. 서버에 마운트된 경로에서 파일 선택

**방법 3: 클라우드 스토리지**
1. **Cloud Storage** 탭 선택
2. 사전 구성된 클라우드 스토리지에서 파일 선택

### 6. Task 제출

1. 모든 정보 입력 완료 후 **Submit & Open** 또는 **Submit & Continue** 클릭
2. 업로드 및 처리 완료 대기

---

## Multiview Workspace 개요

### Workspace 선택

1. Task 열기 후 상단 우측의 **Workspace** 드롭다운 클릭
2. **Multiview** 선택

### 화면 구성

```
┌─────────────────────────────────────────────────────────────────┐
│                        상단 메뉴바                               │
├──────┬──────────────────────────────────────────────┬───────────┤
│      │  ┌─────────────┬─────────────┐              │           │
│  컨  │  │   View 1    │   View 2    │              │  Objects  │
│  트  │  │ (Active)    │             │              │  Side     │
│  롤  │  ├─────────────┼─────────────┤              │  Bar      │
│  사  │  │   View 3    │   View 4    │              │           │
│  이  │  └─────────────┴─────────────┘              │           │
│  드  │  ┌───────────────────────────┐              │           │
│  바  │  │         View 5            │              │           │
│      │  └───────────────────────────┘              │           │
│      │  ┌───────────────────────────────────────┐  │           │
│      │  │      Audio Spectrogram Panel          │  │           │
│      │  └───────────────────────────────────────┘  │           │
└──────┴──────────────────────────────────────────────┴───────────┘
```

### 주요 영역 설명

| 영역 | 설명 |
|------|------|
| **상단 메뉴바** | 저장, Undo/Redo, 프레임 이동, 설정 등 |
| **컨트롤 사이드바** | 라벨링 도구 모음 |
| **비디오 그리드** | 5개의 동기화된 비디오 뷰 |
| **스펙트로그램 패널** | 오디오 시각화 및 탐색 |
| **Objects 사이드바** | 생성된 annotation 목록 및 관리 |

### 뷰 선택

- 클릭하여 활성 뷰 변경
- 활성 뷰는 주황색 테두리로 표시
- 활성 뷰에서만 annotation 생성 가능

### 재생 속도 조절

상단의 **Playback Speed** 드롭다운에서 선택:
- 0.25x, 0.5x, 0.75x, 1.0x (기본), 1.25x, 1.5x, 2.0x

---

## 라벨링 방법

### Shape vs Track

| 유형 | 설명 | 사용 사례 |
|------|------|----------|
| **Shape** | 단일 프레임에만 존재하는 annotation | 정적 객체, 이미지 라벨링 |
| **Track** | 여러 프레임에 걸쳐 유지되는 annotation | 움직이는 객체 추적 |

### 기본 라벨링 절차

#### 1. 뷰 선택
원하는 비디오 뷰 클릭하여 활성화

#### 2. 도구 선택
좌측 컨트롤 사이드바에서 도구 선택:
- Rectangle (사각형)
- Polygon (다각형)
- Polyline (폴리라인)
- Points (점)
- Ellipse (타원)
- Cuboid (3D 직육면체)
- Mask (브러시/마스크)

#### 3. 라벨 선택
팝업에서 사용할 라벨 선택

#### 4. 모드 선택
- **Shape**: 현재 프레임에만 생성
- **Track**: 여러 프레임에 걸쳐 추적

#### 5. Annotation 그리기

**Rectangle (사각형):**
1. 시작점 클릭
2. 드래그하여 크기 조절
3. 마우스 놓기

**Polygon (다각형):**
1. 각 꼭지점 클릭
2. 시작점 다시 클릭하거나 `N` 키로 완료

**Polyline (폴리라인):**
1. 각 점 클릭
2. `N` 키로 완료

### ViewId 기반 필터링

- 각 뷰에서 생성된 annotation은 해당 뷰의 viewId가 저장됨
- View 1에서 생성한 annotation은 View 1에서만 표시
- View 2에서 생성한 annotation은 View 2에서만 표시
- viewId가 없는 기존 annotation은 모든 뷰에서 표시

---

## 라벨링 도구 설명

### 기본 도구

| 아이콘 | 도구 | 단축키 | 설명 |
|--------|------|--------|------|
| 🖱️ | Cursor | `Esc` | 선택 모드 |
| ➕ | Move | `M` | 캔버스 이동 |
| 🔍 | Zoom | `Z` | 확대/축소 |
| ⬛ | Fit | `0` | 화면에 맞춤 |
| ↻ | Rotate | `R` | 회전 |

### 드로잉 도구

| 도구 | 단축키 | 설명 |
|------|--------|------|
| **Rectangle** | `N` → `1` | 사각형 그리기 |
| **Polygon** | `N` → `2` | 다각형 그리기 |
| **Polyline** | `N` → `3` | 폴리라인 그리기 |
| **Points** | `N` → `4` | 점 그리기 |
| **Ellipse** | `N` → `5` | 타원 그리기 |
| **Cuboid** | `N` → `6` | 3D 직육면체 그리기 |
| **Skeleton** | | 스켈레톤 (자세 추정) |
| **Mask/Brush** | | 브러시로 마스크 영역 칠하기 |

### 편집 도구

| 도구 | 단축키 | 설명 |
|------|--------|------|
| **Split** | | Track을 두 개로 분할 |
| **Merge** | `M` | 여러 Shape를 하나로 병합 |
| **Group** | `G` | 여러 객체를 그룹화 |
| **Slice** | | Shape를 여러 개로 분할 |
| **Join** | | 분할된 Shape 연결 |

### AI 도구 (사용 가능한 경우)

| 도구 | 설명 |
|------|------|
| **AI Tools** | 자동 annotation 생성 |
| **OpenCV** | OpenCV 기반 도구 |
| **SAM2 Tracker** | Segment Anything Model 기반 추적 |

---

## 결과물 저장

### 자동 저장 vs 수동 저장

- **자동 저장**: 기본적으로 비활성화 (설정에서 변경 가능)
- **수동 저장**: 명시적으로 저장 필요

### 저장 방법

#### 방법 1: 버튼 사용
상단 메뉴에서 **Save** 버튼 클릭

#### 방법 2: 단축키 사용
`Ctrl + S` (Windows/Linux) 또는 `Cmd + S` (Mac)

### 저장 상태 확인

- 저장 버튼 옆에 저장 상태 표시
- 미저장 변경사항이 있으면 표시됨

---

## 결과물 내보내기 및 확인

### Annotation 내보내기

#### 1. Task 메뉴에서 내보내기

1. Tasks 페이지에서 해당 Task 찾기
2. 우측 **⋮** 메뉴 클릭
3. **Export task dataset** 선택

#### 2. Job 메뉴에서 내보내기

1. Job 열기
2. 상단 **Menu** → **Export job dataset** 선택

### 지원 포맷

| 포맷 | 설명 | 확장자 |
|------|------|--------|
| **CVAT for images** | CVAT 기본 XML 포맷 | `.xml` |
| **CVAT for video** | CVAT 비디오 XML 포맷 | `.xml` |
| **COCO** | MS COCO JSON 포맷 | `.json` |
| **YOLO** | YOLO 텍스트 포맷 | `.txt` |
| **Pascal VOC** | Pascal VOC XML 포맷 | `.xml` |
| **LabelMe** | LabelMe JSON 포맷 | `.json` |
| **Datumaro** | Datumaro 포맷 | 다양한 |

### 내보내기 절차

1. 원하는 포맷 선택
2. 옵션 설정 (이미지 포함 여부 등)
3. **OK** 클릭
4. 다운로드 대기 및 파일 저장

### CVAT for video 포맷 상세

#### Track 구조 이해

CVAT for video 포맷은 **Track 기반**으로 annotation을 저장합니다. 단일 프레임에만 라벨링해도 XML에서 2개의 `<box>` 요소가 생성됩니다:

```xml
<track id="0" label="Sound" source="file" view_id="1">
  <!-- 실제 annotation: frame 0에서 visible -->
  <box frame="0" keyframe="1" outside="0" occluded="0"
       xtl="1278.22" ytl="437.17" xbr="1722.08" ybr="997.66" z_order="0" />

  <!-- 종료 마커: frame 1부터 invisible -->
  <box frame="1" keyframe="1" outside="1" occluded="0"
       xtl="1278.22" ytl="437.17" xbr="1722.08" ybr="997.66" z_order="0" />
</track>
```

#### outside 속성 설명

| 속성 | 값 | 의미 |
|------|-----|------|
| `outside` | `0` | 객체가 화면에 **보임** (visible) |
| `outside` | `1` | 객체가 화면에서 **사라짐** (invisible) |

#### 왜 2개의 box가 생성되는가?

Track 기반 비디오 포맷에서는 객체의 **시작**과 **끝**을 모두 명시해야 합니다:

1. **frame 0, outside=0**: "이 프레임에서 박스가 보입니다"
2. **frame 1, outside=1**: "이 프레임부터 박스가 안 보입니다" (트랙 종료 표시)

이렇게 해야 Import 시 트랙의 수명(lifetime)을 정확히 복원할 수 있습니다.

#### 실제 동작

| 프레임 | outside 값 | 화면 표시 |
|--------|------------|----------|
| 0 | 0 | ✅ 박스 표시됨 |
| 1 | 1 | ❌ 박스 표시 안 됨 |
| 2+ | (없음) | ❌ 박스 표시 안 됨 |

> **참고**: 이것은 CVAT의 설계된 동작이며, Import 시 frame 0에만 annotation이 표시됩니다.

#### view_id 속성

Multiview workspace에서 생성된 annotation에는 `view_id` 속성이 추가됩니다:

```xml
<track id="0" label="Sound" source="file" view_id="1">
```

- `view_id="1"`: View 1에서 생성된 annotation
- `view_id="2"`: View 2에서 생성된 annotation
- 등등...

### 결과물 확인

#### Objects 패널에서 확인

우측 **Objects** 사이드바에서:
- 모든 annotation 목록 확인
- ID, 타입, 라벨 정보 표시
- 클릭하여 해당 annotation으로 이동

#### 필터링

- **Sort by**: ID, 라벨, 생성 순서 등으로 정렬
- **Lock/Unlock**: 수정 방지
- **Hide/Show**: 표시 여부 토글

#### 프레임별 확인

- 플레이어 컨트롤로 프레임 이동
- 각 프레임의 annotation 확인
- Track의 경우 키프레임 간 보간 확인

---

## 단축키

### 재생 컨트롤

| 단축키 | 동작 |
|--------|------|
| `Space` | 재생/일시정지 |
| `V` | 앞으로 이동 |
| `C` | 뒤로 이동 |
| `D` | 다음 프레임 |
| `F` | 이전 프레임 |

### 라벨링

| 단축키 | 동작 |
|--------|------|
| `N` | 새 Shape/Track 그리기 |
| `Esc` | 그리기 취소 / 선택 해제 |
| `Del` | 선택된 객체 삭제 |
| `Ctrl + Z` | 실행 취소 |
| `Ctrl + Shift + Z` | 다시 실행 |
| `Ctrl + S` | 저장 |

### 뷰 컨트롤

| 단축키 | 동작 |
|--------|------|
| `0` | 화면 맞춤 |
| `+` / `-` | 확대/축소 |
| 마우스 휠 | 확대/축소 |

### 객체 조작

| 단축키 | 동작 |
|--------|------|
| `L` | 잠금/해제 |
| `H` | 숨기기/표시 |
| `O` | 가림 설정 토글 |
| `K` | 키프레임 설정 |

---

## 문제 해결

### 일반적인 문제

#### 비디오가 로드되지 않음
- 브라우저 콘솔에서 오류 확인
- 비디오 파일 형식 확인 (MP4/H.264 권장)
- CORS 설정 확인

#### Annotation이 저장되지 않음
- 네트워크 연결 확인
- 브라우저 개발자 도구에서 오류 확인
- 권한 확인

#### 재생 시 동기화 문제
- 모든 비디오의 FPS가 동일한지 확인
- 비디오 길이가 동일한지 확인

#### ViewId 필터링이 작동하지 않음
- 페이지 새로고침 시도
- 콘솔에서 `[MultiviewCanvas]` 로그 확인

### 성능 최적화

1. **브라우저 하드웨어 가속 활성화**
2. **불필요한 탭/창 닫기**
3. **고해상도 비디오의 경우 트랜스코딩 고려**

### 로그 확인

브라우저 개발자 도구 (F12) → Console 탭에서:
- `[MultiviewCanvas]` 접두사가 붙은 로그 확인
- 각 프레임에서 표시되는 annotation 수 확인

```
[MultiviewCanvas] Frame 0, View 1: 6/7 annotations
```

---

## 추가 리소스

- **공식 문서**: https://docs.cvat.ai
- **GitHub**: https://github.com/cvat-ai/cvat
- **문제 보고**: https://github.com/cvat-ai/cvat/issues

---

*이 문서는 CVAT Multiview Workspace의 사용자 가이드입니다. 최종 업데이트: 2026-01-29*
