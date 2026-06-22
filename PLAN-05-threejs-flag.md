## 기능 계획: Three.js 태극기 + 국기봉

### 목표
- 기존 2D 이미지(`태극기.jpg`) 대신 Three.js로 **국기봉 + 펄럭이는 태극기** 3D 씬을 렌더링한다.
- PLAN-02(펄럭임 + 마우스 인터랙션) 요구를 3D 셰이더 방식으로 대체·구현한다.

### 사용자 시나리오
- 페이지를 열면 화면 중앙에 국기봉과 태극기가 3D로 보인다.
- 태극기가 바람에 펄럭이며, 마우스/포인터 위치에 따라 바람 방향·세기가 변한다.
- 하단 카운트다운(PLAN-01)은 HTML 오버레이로 그대로 유지된다.

---

### 단계별 실행 계획

#### Phase 1 — Three.js 기반 ✅
- [x] `importmap` + ES module로 Three.js CDN 로드
- [x] `#flagContainer`에 `<canvas>` 렌더 타겟
- [x] Scene / PerspectiveCamera / WebGLRenderer 생성
- [x] `requestAnimationFrame` 루프 + `resize` 대응

#### Phase 2 — 국기봉 + 정적 국기 ✅
- [x] `CylinderGeometry`로 국기봉(은색 메탈릭 재질)
- [x] `PlaneGeometry`(3:2 비율, 세그먼트 분할) + `태극기.jpg` 텍스처
- [x] 봉 상단 왼쪽에 국기 왼쪽 가장자리 고정 배치
- [x] Ambient + Directional 조명

#### Phase 3 — 셰이더 펄럭임 ✅
- [x] 커스텀 `ShaderMaterial`로 정점 파형(wave) 적용
- [x] 봉 쪽(왼쪽) 정점은 고정, 오른쪽 끝으로 갈수록 진폭 증가
- [x] `uTime` uniform으로 시간 기반 애니메이션

#### Phase 4 — 마우스 바람 인터랙션 ✅
- [x] `pointermove` → `uWindX`, `uWindY` uniform 전달
- [x] `passive` + rAF 프록시로 성능 최적화
- [x] `prefers-reduced-motion: reduce` 시 진폭 최소화

#### Phase 5 — 마무리 ✅
- [x] `visibilitychange` 시 렌더 루프 일시 정지
- [x] `app.js` 레거시 `#group1` 코드 제거
- [x] `index.html` 인라인 스타일 → `styles.css` 이전
- [ ] 모바일 실기기 QA (수동)

---

### 파일 변경
| 파일 | 역할 |
|------|------|
| `flag-scene.js` | Three.js 씬 초기화·애니메이션 (ES module) |
| `index.html` | importmap, canvas 컨테이너, module 스크립트 |
| `styles.css` | `#flagContainer`, `#flagCanvas` 스타일 |
| `app.js` | 카운트다운만 유지 |

### 기술 스택
- Three.js r160 (jsDelivr CDN, importmap)
- 빌드 도구 없음 — 정적 HTML 유지

### 수용 기준(AC)
- [x] 국기봉 + 태극기(3:2)가 화면에 보인다
- [x] 태극기가 부드럽게 펄럭인다
- [x] 마우스 이동 시 펄럭임 방향/세기가 눈에 띄게 변한다
- [x] 창 크기 변경 시 씬이 리사이즈된다
- [x] `prefers-reduced-motion`에서 펄럭임이 거의 없다
- [x] 카운트다운 UI는 기존과 동일하게 동작한다

### 리스크 및 완화
- **모바일 성능**: 세그먼트 수 제한(32×16), 저사양 시 진폭 자동 축소 가능
- **텍스처 로드 실패**: `onError` 시 단색 폴백 재질
- **WebGL 미지원**: canvas 영역에 정적 `<img>` 폴백(향후)
