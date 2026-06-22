## 기능 계획: 태극기 애니메이션 + 마우스 인터랙션

### 목표
- 태극기가 바람에 펄럭이는 자연스러운 효과를 제공하고, 마우스/포인터 움직임에 따라 방향과 강도가 변화한다.

### 사용자 시나리오
- 페이지 로드 시 태극기가 부드럽게 펄럭인다.
- 사용자가 마우스를 움직이거나 기기를 기울이면(옵션) 바람 방향이 바뀐다.

### 접근 전략
- 우선 CSS 기반(가벼운 변형/필터) → 필요 시 SVG 필터(`feTurbulence`, `feDisplacementMap`).
- 저사양 성능 고려: 효과 강도와 업데이트 빈도 동적 조절.

### UI/DOM
- `index.html`
  - 태극기 컨테이너: `#flagContainer`
  - SVG 또는 IMG 태그에 클래스 `flag` 부여

### 스타일(`styles.css`)
- 기본 펄럭임: keyframes로 약한 수평/수직 변형 조합
- GPU 가속: `transform`, `filter` 위주 사용
- `prefers-reduced-motion: reduce`에서 애니메이션 강도 0 또는 매우 낮게

### 로직(`app.js`)
- `initFlagAnimation()`
  - 기본 펄럭임 애니메이션 클래스 토글
  - 성능 측정(프레임 드롭 감지) 시 강도 감소
- `initPointerWind()`
  - `pointermove` 이벤트를 `requestAnimationFrame` 프록시로 처리
  - 포인터의 화면 상대 각도/속도 → 바람 벡터 계산 → CSS 변수(`--windX`, `--windY`, `--windAmp`)로 전달
  - 스로틀/디바운스 적용

### 성능/안정성
- 이벤트 `passive: true`
- `will-change` 남용 금지, 필요 시에만 적용
- 백오프 로직: 30fps 미만 지속 시 강도 축소

### 접근성
- 모션 민감 사용자 고려: `prefers-reduced-motion`
- 키보드 사용자 영향 없음(시각 효과만)

### 테스트/검증
- 데스크톱/모바일에서 프레임 드롭 확인
- 포인터 이동에 따른 시각 변화가 즉각적이고 과하지 않은지 확인

### 수용 기준(AC)
- [x] 기본 상태에서 태극기가 자연스럽게 펄럭인다. *(PLAN-05 Three.js 셰이더로 구현)*
- [x] 포인터 이동 시 방향/강도가 즉시 반영된다.
- [x] 모션 감소 설정에서 애니메이션이 현저히 줄거나 정지한다.

> **완료 노트:** CSS/SVG 방식 대신 `flag-scene.js` 셰이더 펄럭임으로 대체 완료.

